/**
 * BiteSwipe Mock Data
 * Realistic data for building and testing all screens.
 */

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  servings: number;
  image: any;
  icon: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
  matchPercentage?: number;
}

export interface TrendingItem {
  id: string;
  title: string;
  source: 'instagram' | 'youtube';
  creator: string;
  views: string;
  image: any;
  icon: string;
}

export interface FeedPost {
  id: string;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  recipeName: string;
  image: any;
  icon: string;
  likes: number;
  comments: number;
  caption: string;
  isLiked: boolean;
  badge?: string;
}

// ─── Recipe Data ─────────────────────────────────────────────────
export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Butter Chicken Masala',
    cuisine: 'Indian',
    cookTime: '35 min',
    difficulty: 'Medium',
    calories: 480,
    servings: 4,
    image: require('../assets/food/butter_chicken.jpg'),
    icon: 'coffee', // Feather icon equivalent for food/pot
    category: 'dinner',
    tags: ['Dinner', 'Protein-Rich', 'Comfort Food'],
    matchPercentage: 92,
    ingredients: [
      '500g chicken thighs', '1 cup yogurt', '2 tbsp butter',
      '1 can tomato puree', '1 tsp garam masala', '1 tsp turmeric',
      '2 cloves garlic', '1 inch ginger', 'Fresh cream', 'Kasuri methi',
    ],
    steps: [
      'Marinate chicken in yogurt, turmeric, and salt for 30 minutes.',
      'Grill or pan-sear the marinated chicken until charred.',
      'In a pan, melt butter and sauté garlic-ginger paste.',
      'Add tomato puree, garam masala, and simmer for 15 min.',
      'Add grilled chicken, cream, and kasuri methi. Cook 5 min.',
    ],
  },
  {
    id: '2',
    title: 'Avocado Toast Supreme',
    cuisine: 'Continental',
    cookTime: '10 min',
    difficulty: 'Easy',
    calories: 320,
    servings: 2,
    image: require('../assets/food/avocado_toast.jpg'),
    icon: 'star',
    category: 'breakfast',
    tags: ['Breakfast', 'Healthy', 'Quick'],
    matchPercentage: 88,
    ingredients: [
      '2 ripe avocados', '4 slices sourdough bread', '2 eggs',
      'Cherry tomatoes', 'Red pepper flakes', 'Lemon juice',
      'Everything bagel seasoning', 'Microgreens',
    ],
    steps: [
      'Toast sourdough slices until golden and crispy.',
      'Mash avocados with lemon juice, salt, and pepper.',
      'Poach eggs in simmering water with vinegar.',
      'Spread avocado on toast, top with poached egg.',
      'Garnish with cherry tomatoes, microgreens, and red pepper flakes.',
    ],
  },
  {
    id: '3',
    title: 'Spicy Ramen Bowl',
    cuisine: 'Japanese',
    cookTime: '25 min',
    difficulty: 'Medium',
    calories: 650,
    servings: 2,
    image: require('../assets/food/spicy_ramen.jpg'),
    icon: 'wind',
    category: 'dinner',
    tags: ['Dinner', 'Spicy', 'Noodles'],
    matchPercentage: 76,
    ingredients: [
      '2 packs ramen noodles', '4 cups chicken broth', '2 tbsp miso paste',
      '1 tbsp sesame oil', 'Soft boiled eggs', 'Green onions',
      'Nori sheets', 'Corn kernels', 'Chili oil', 'Bean sprouts',
    ],
    steps: [
      'Bring chicken broth to a boil, dissolve miso paste.',
      'Cook ramen noodles according to package instructions.',
      'Prepare soft-boiled eggs (6.5 min in boiling water).',
      'Assemble bowls: noodles, broth, then toppings.',
      'Drizzle with sesame oil and chili oil. Serve hot.',
    ],
  },
  {
    id: '4',
    title: 'Classic Margherita Pizza',
    cuisine: 'Italian',
    cookTime: '45 min',
    difficulty: 'Medium',
    calories: 550,
    servings: 4,
    image: require('../assets/food/pizza.jpg'),
    icon: 'aperture',
    category: 'dinner',
    tags: ['Dinner', 'Vegetarian', 'Cheesy'],
    matchPercentage: 70,
    ingredients: [
      'Pizza dough', 'San Marzano tomatoes', 'Fresh mozzarella',
      'Fresh basil leaves', 'Extra virgin olive oil', 'Salt',
      'Garlic cloves', 'Oregano',
    ],
    steps: [
      'Preheat oven to 250°C (480°F) with a pizza stone.',
      'Stretch dough into a thin circle on a floured surface.',
      'Crush tomatoes with garlic and salt for sauce.',
      'Spread sauce, add torn mozzarella pieces.',
      'Bake 8-10 min until crust is golden. Top with fresh basil.',
    ],
  },
  {
    id: '5',
    title: 'Premium Sushi Roll',
    cuisine: 'Japanese',
    cookTime: '30 min',
    difficulty: 'Hard',
    calories: 410,
    servings: 2,
    image: require('../assets/food/sushi.jpg'),
    icon: 'target',
    tags: ['Dinner', 'Seafood', 'Date Night'],
    matchPercentage: 65,
    ingredients: [
      'Sushi rice', 'Nori sheets', 'Fresh salmon',
      'Avocado', 'Cucumber', 'Soy sauce',
      'Wasabi', 'Pickled ginger',
    ],
    steps: [
      'Cook and season sushi rice with vinegar, sugar, salt.',
      'Lay nori on a bamboo mat, spread rice evenly.',
      'Add strips of salmon, avocado, and cucumber.',
      'Roll tightly using the mat.',
      'Slice with a sharp wet knife and serve.',
    ],
  },
  {
    id: '6',
    title: 'Mango Lassi Smoothie Bowl',
    cuisine: 'Indian Fusion',
    cookTime: '5 min',
    difficulty: 'Easy',
    calories: 280,
    servings: 1,
    image: require('../assets/food/smoothie_bowl.jpg'),
    icon: 'sun',
    tags: ['Breakfast', 'Healthy', 'Summer'],
    matchPercentage: 83,
    ingredients: [
      '1 large ripe mango', '1/2 cup Greek yogurt', '1/4 cup milk',
      'Honey', 'Granola', 'Chia seeds',
      'Sliced almonds', 'Cardamom powder',
    ],
    steps: [
      'Blend mango, yogurt, milk, honey, and cardamom until smooth.',
      'Pour into a bowl (keep it thick!).',
      'Top with granola, chia seeds, sliced almonds.',
      'Add extra mango slices and a drizzle of honey.',
    ],
  },
];

// ─── Trending Data ───────────────────────────────────────────────
export const MOCK_TRENDING: TrendingItem[] = [
  {
    id: 't1',
    title: 'Cloud Bread That Actually Works',
    source: 'instagram',
    creator: '@thefeedfeed',
    views: '4.2M',
    image: require('../assets/food/avocado_toast.jpg'), // Reusing for mock
    icon: 'cloud',
  },
  {
    id: 't2',
    title: 'Dubai Chocolate Bar at Home',
    source: 'youtube',
    creator: 'Joshua Weissman',
    views: '8.1M',
    image: require('../assets/food/pizza.jpg'), // Reusing for mock
    icon: 'package',
  },
  {
    id: 't3',
    title: 'Birria Tacos - Street Style',
    source: 'instagram',
    creator: '@senpaiknows',
    views: '6.7M',
    image: require('../assets/food/spicy_ramen.jpg'), // Reusing for mock
    icon: 'map-pin',
  },
  {
    id: 't4',
    title: '15-Min Garlic Butter Shrimp',
    source: 'youtube',
    creator: 'Gordon Ramsay',
    views: '12.3M',
    image: require('../assets/food/butter_chicken.jpg'), // Reusing for mock
    icon: 'droplet',
  },
];

// ─── Community Feed Data ─────────────────────────────────────────
export const MOCK_FEED: FeedPost[] = [
  {
    id: 'f1',
    userName: 'Priya Sharma',
    userAvatar: 'user', // Feather icon
    timeAgo: '2h ago',
    recipeName: 'Paneer Tikka',
    image: require('../assets/food/butter_chicken.jpg'),
    icon: 'zap',
    likes: 234,
    comments: 18,
    caption: 'First attempt at restaurant-style paneer tikka and I\'m SHOOK 🤯',
    isLiked: false,
    badge: 'Nailed It! 🏆',
  },
  {
    id: 'f2',
    userName: 'Arjun Patel',
    userAvatar: 'user',
    timeAgo: '5h ago',
    recipeName: 'Chocolate Lava Cake',
    image: require('../assets/food/pizza.jpg'),
    icon: 'alert-circle',
    likes: 567,
    comments: 42,
    caption: 'It was supposed to be a lava cake... it became a lava LAKE 🌋💀',
    isLiked: true,
    badge: 'Failed It! 😂',
  },
];

// ─── Scanned Ingredients Example ─────────────────────────────────
export const MOCK_SCANNED_INGREDIENTS = [
  { name: 'Tomatoes', icon: 'circle', confidence: 0.97 },
  { name: 'Onions', icon: 'target', confidence: 0.95 },
  { name: 'Paneer', icon: 'box', confidence: 0.91 },
  { name: 'Bell Pepper', icon: 'hexagon', confidence: 0.89 },
  { name: 'Yogurt', icon: 'droplet', confidence: 0.86 },
  { name: 'Garlic', icon: 'moon', confidence: 0.94 },
  { name: 'Eggs', icon: 'octagon', confidence: 0.93 },
  { name: 'Butter', icon: 'square', confidence: 0.90 },
];

// ─── Categories ──────────────────────────────────────────────────
export const MEAL_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { id: 'lunch', label: 'Lunch', icon: 'sun' },
  { id: 'dinner', label: 'Dinner', icon: 'moon' },
  { id: 'snack', label: 'Snacks', icon: 'coffee' },
  { id: 'healthy', label: 'Healthy', icon: 'heart' },
];
