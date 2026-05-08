/**
 * Weekly cron: pulls top trending recipe shorts from YouTube (India region)
 * + reads any admin-curated Instagram URLs from Firestore, optionally enriches
 * each with a structured recipe via Groq, and writes them to
 * trending_recipes/{id} in Firestore.
 *
 * Manual trigger (testing): GET https://biteswipe-five.vercel.app/api/cron/refresh-trending
 * with header Authorization: Bearer ${CRON_SECRET}
 *
 * Vercel Cron runs this on the schedule defined in vercel.json. Vercel
 * automatically attaches the bearer token if CRON_SECRET is set in env.
 *
 * Required Vercel env vars:
 *   YT_API_KEY                 — YouTube Data API v3 key
 *   FIREBASE_SERVICE_ACCOUNT   — service account JSON (single-line, JSON.stringify'd)
 *   GROQ_API_KEY               — already set (used for recipe enrichment)
 *   CRON_SECRET                — long random string, used to gate manual triggers
 */
import admin from 'firebase-admin';

const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEO_URL = 'https://www.googleapis.com/youtube/v3/videos';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const QUERIES = ['indian recipe shorts', 'easy recipe shorts', 'viral recipe'];
const MAX_PER_QUERY = 6;     // 6 × 3 = 18 candidates → trim to top 12 by views
const KEEP_TOP = 12;

// ─── Firebase Admin (lazy init) ─────────────────────────────────────
function getDb() {
  if (admin.apps.length > 0) return admin.firestore();
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
  let parsed: any;
  try {
    parsed = JSON.parse(sa);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }
  // Common gotcha: Vercel UI escapes \n in private_key — un-escape it.
  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  admin.initializeApp({ credential: admin.credential.cert(parsed) });
  return admin.firestore();
}

// ─── YouTube fetch ──────────────────────────────────────────────────
interface YtCandidate {
  videoId: string;
  title: string;
  channel: string;
  channelId: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
}

async function searchYouTube(apiKey: string): Promise<YtCandidate[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const out: YtCandidate[] = [];

  for (const q of QUERIES) {
    const params = new URLSearchParams({
      key: apiKey,
      part: 'snippet',
      q,
      type: 'video',
      videoDuration: 'short',
      regionCode: 'IN',
      relevanceLanguage: 'en',
      order: 'viewCount',
      publishedAfter: sevenDaysAgo,
      maxResults: String(MAX_PER_QUERY),
      safeSearch: 'strict',
    });
    const r = await fetch(`${YT_SEARCH_URL}?${params}`);
    if (!r.ok) {
      console.warn('[YT search]', q, r.status, await r.text());
      continue;
    }
    const data: any = await r.json();
    for (const item of data.items ?? []) {
      const vid = item.id?.videoId;
      if (!vid) continue;
      out.push({
        videoId: vid,
        title: item.snippet?.title ?? '',
        channel: item.snippet?.channelTitle ?? '',
        channelId: item.snippet?.channelId ?? '',
        thumbnail:
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.default?.url ??
          '',
        publishedAt: item.snippet?.publishedAt ?? '',
        description: item.snippet?.description ?? '',
      });
    }
  }

  // Dedupe by videoId
  const seen = new Set<string>();
  return out.filter(v => (seen.has(v.videoId) ? false : (seen.add(v.videoId), true)));
}

async function attachViewCounts(
  apiKey: string,
  candidates: YtCandidate[],
): Promise<(YtCandidate & { viewCount: number })[]> {
  if (candidates.length === 0) return [];
  const ids = candidates.map(c => c.videoId).join(',');
  const params = new URLSearchParams({ key: apiKey, part: 'statistics', id: ids });
  const r = await fetch(`${YT_VIDEO_URL}?${params}`);
  if (!r.ok) return candidates.map(c => ({ ...c, viewCount: 0 }));
  const data: any = await r.json();
  const counts = new Map<string, number>();
  for (const v of data.items ?? []) counts.set(v.id, parseInt(v.statistics?.viewCount ?? '0', 10));
  return candidates.map(c => ({ ...c, viewCount: counts.get(c.videoId) ?? 0 }));
}

// ─── Groq enrichment (best-effort, single batched call) ─────────────
async function enrichWithGroq(
  candidates: (YtCandidate & { viewCount: number })[],
  apiKey: string,
): Promise<Record<string, any>> {
  if (candidates.length === 0 || !apiKey) return {};

  const summaries = candidates.map((c, i) =>
    `${i + 1}. id=${c.videoId} | title=${c.title.slice(0, 120)} | desc=${c.description.slice(0, 200)}`,
  ).join('\n');

  const prompt = `You are a recipe analyst. For each video below, infer a likely recipe.
Return ONLY a valid JSON array. One object per video, in the SAME ORDER. Format:
[{"id":"<videoId>","cuisine":"","cookTime":"25 min","difficulty":"Easy","calories":420,"servings":2,"tags":[""],"ingredients":["1 cup ..."],"steps":["..."]}]

Videos:
${summaries}`;

  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4500,
      }),
    });
    if (!r.ok) {
      console.warn('[Groq enrich]', r.status, await r.text());
      return {};
    }
    const data: any = await r.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return {};
    const arr = JSON.parse(text.substring(start, end + 1));
    const map: Record<string, any> = {};
    for (const r of arr) if (r?.id) map[r.id] = r;
    return map;
  } catch (e) {
    console.warn('[Groq enrich] error', e);
    return {};
  }
}

// ─── Curated Instagram (admin-fed via Firestore) ───────────────────
async function fetchCuratedInstagram(db: admin.firestore.Firestore) {
  try {
    const snap = await db.collection('curated_instagram').get();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  } catch (e) {
    console.warn('[curated_instagram]', e);
    return [];
  }
}

// ─── Handler ────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  // Simple secret gate (Vercel cron sends Authorization: Bearer <CRON_SECRET>).
  const expected = process.env.CRON_SECRET;
  const auth = req.headers?.authorization ?? '';
  if (!expected || auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ytKey = process.env.YT_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!ytKey) {
    console.error('[refresh-trending] YT_API_KEY not set');
    return res.status(500).json({ error: 'YT_API_KEY not set' });
  }

  let db: admin.firestore.Firestore;
  try {
    db = getDb();
  } catch (e: any) {
    console.error('[refresh-trending] Firebase init failed:', e?.message, e?.stack);
    return res.status(500).json({ error: e?.message ?? 'Firebase init failed' });
  }

  try {
    const candidates = await searchYouTube(ytKey);
    const withViews = (await attachViewCounts(ytKey, candidates))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, KEEP_TOP);

    const enriched = groqKey ? await enrichWithGroq(withViews, groqKey) : {};
    const igCurated = await fetchCuratedInstagram(db);

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    const writtenIds: string[] = [];

    for (const v of withViews) {
      const enrich = enriched[v.videoId] ?? {};
      const docRef = db.collection('trending_recipes').doc(`yt_${v.videoId}`);
      batch.set(docRef, {
        id: `yt_${v.videoId}`,
        source: 'youtube',
        videoId: v.videoId,
        title: v.title,
        channel: v.channel,
        creator: v.channel,
        channelId: v.channelId,
        thumbnail: v.thumbnail,
        publishedAt: v.publishedAt,
        viewCount: v.viewCount,
        embedUrl: `https://www.youtube.com/embed/${v.videoId}`,
        originalUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        cuisine: enrich.cuisine ?? null,
        cookTime: enrich.cookTime ?? null,
        difficulty: enrich.difficulty ?? null,
        calories: enrich.calories ?? null,
        servings: enrich.servings ?? null,
        tags: enrich.tags ?? [],
        ingredients: enrich.ingredients ?? [],
        steps: enrich.steps ?? [],
        refreshedAt: now,
      }, { merge: true });
      writtenIds.push(`yt_${v.videoId}`);
    }

    for (const ig of igCurated) {
      if (!ig.url) continue;
      const code = (ig.url.match(/\/(p|reel|reels)\/([^/?#]+)/) ?? [])[2];
      if (!code) continue;
      const docRef = db.collection('trending_recipes').doc(`ig_${code}`);
      batch.set(docRef, {
        id: `ig_${code}`,
        source: 'instagram',
        title: ig.title ?? 'Trending Reel',
        creator: ig.creator ?? '@curator',
        thumbnail: ig.thumbnail ?? '',
        embedUrl: `https://www.instagram.com/p/${code}/embed/`,
        originalUrl: ig.url,
        cuisine: ig.cuisine ?? null,
        cookTime: ig.cookTime ?? null,
        difficulty: ig.difficulty ?? null,
        ingredients: ig.ingredients ?? [],
        steps: ig.steps ?? [],
        tags: ig.tags ?? [],
        refreshedAt: now,
      }, { merge: true });
      writtenIds.push(`ig_${code}`);
    }

    await batch.commit();

    return res.status(200).json({
      ok: true,
      youtube: withViews.length,
      instagram: igCurated.length,
      total: writtenIds.length,
      ids: writtenIds,
    });
  } catch (e: any) {
    console.error('[refresh-trending]', e);
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}
