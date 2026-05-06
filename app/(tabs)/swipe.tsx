/**
 * Swipe Screen — "Tinder for Food"
 */
import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import RecipeCard from '@/components/RecipeCard';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { MOCK_RECIPES } from '@/constants/mock-data';

const { width: SW } = Dimensions.get('window');
const THRESHOLD = SW * 0.25;

export default function SwipeScreen() {
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const pos = useRef(new Animated.ValueXY()).current;

  const rot = pos.x.interpolate({ inputRange: [-SW, 0, SW], outputRange: ['-12deg','0deg','12deg'] });
  const likeOp = pos.x.interpolate({ inputRange: [0, SW*0.25], outputRange: [0,1], extrapolate:'clamp' });
  const nopeOp = pos.x.interpolate({ inputRange: [-SW*0.25, 0], outputRange: [1,0], extrapolate:'clamp' });
  const nextScale = pos.x.interpolate({ inputRange: [-SW, 0, SW], outputRange: [1,0.92,1], extrapolate:'clamp' });

  const swipe = (dir: 'left'|'right') => {
    const toX = dir === 'right' ? SW*1.5 : -SW*1.5;
    if (dir === 'right' && idx < MOCK_RECIPES.length) setSaved(p => [...p, MOCK_RECIPES[idx].title]);
    Animated.timing(pos, { toValue:{x:toX,y:0}, duration:300, useNativeDriver:false }).start(() => {
      pos.setValue({x:0,y:0}); setIdx(p => p+1);
    });
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => pos.setValue({x:g.dx, y:g.dy*0.3}),
    onPanResponderRelease: (_, g) => {
      if (g.dx > THRESHOLD) swipe('right');
      else if (g.dx < -THRESHOLD) swipe('left');
      else Animated.spring(pos, {toValue:{x:0,y:0}, friction:5, useNativeDriver:false}).start();
    },
  })).current;

  const cur = MOCK_RECIPES[idx];
  const next = MOCK_RECIPES[idx + 1];

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{flex:1}}>
        <View style={s.header}>
          <View>
            <Text style={s.sub}>Swipe to decide</Text>
            <View style={s.titleRow}>
              <Text style={s.title}>BiteSwipe</Text>
              <Feather name="zap" size={24} color={BrandColors.primaryStart} />
            </View>
          </View>
          <View style={s.badge}><Text style={s.badgeT}>{saved.length} saved</Text></View>
        </View>

        <View style={s.stack}>
          {idx >= MOCK_RECIPES.length ? (
            <View style={s.empty}>
              <Feather name="check-circle" size={64} color={BrandColors.success} />
              <Text style={s.emptyT}>All swiped!</Text>
              <Text style={s.emptyD}>You saved {saved.length} recipes. Time to cook!</Text>
              <TouchableOpacity onPress={() => {setIdx(0);setSaved([]);}}>
                <LinearGradient colors={Gradients.primary as [string,string]} style={s.resetG}>
                  <Feather name="rotate-ccw" size={16} color="#fff" style={{marginRight: 8}} />
                  <Text style={s.resetT}>Start Over</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {next && <Animated.View style={[s.cardC,{top:10,transform:[{scale:nextScale}]}]}><RecipeCard recipe={next}/></Animated.View>}
              <Animated.View {...pan.panHandlers} style={[s.cardC,{transform:[{translateX:pos.x},{translateY:pos.y},{rotate:rot}]}]}>
                <Animated.View style={[s.stamp,{left:24,borderColor:BrandColors.success,transform:[{rotate:'-15deg'}]},{ opacity:likeOp}]}>
                  <Text style={[s.stampT,{color:BrandColors.success}]}>COOK IT</Text>
                </Animated.View>
                <Animated.View style={[s.stamp,{right:24,borderColor:BrandColors.error,transform:[{rotate:'15deg'}]},{opacity:nopeOp}]}>
                  <Text style={[s.stampT,{color:BrandColors.error}]}>SKIP</Text>
                </Animated.View>
                <RecipeCard recipe={cur}/>
              </Animated.View>
            </>
          )}
        </View>

        {idx < MOCK_RECIPES.length && (
          <View style={s.actions}>
            <TouchableOpacity style={s.skipBtn} onPress={() => swipe('left')}>
              <Feather name="x" size={32} color={BrandColors.error} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {if(idx>0){setIdx(p=>p-1);setSaved(p=>p.slice(0,-1));}}}>
              <View style={s.undoBtn}><Feather name="rotate-ccw" size={24} color={BrandColors.warning} /></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => swipe('right')}>
              <LinearGradient colors={Gradients.primary as [string,string]} style={[s.cookBtn,Shadows.glow]}>
                <Feather name="heart" size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:BrandColors.dark900},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:Spacing.lg,paddingTop:Spacing.md,paddingBottom:Spacing.sm},
  sub:{color:BrandColors.textTertiary,...Typography.caption},
  titleRow:{flexDirection:'row',alignItems:'center',gap:Spacing.xxs},
  title:{color:BrandColors.textPrimary,...Typography.h1},
  badge:{backgroundColor:BrandColors.glass,borderWidth:1,borderColor:BrandColors.glassBorder,paddingHorizontal:Spacing.md,paddingVertical:Spacing.xs,borderRadius:Radius.full},
  badgeT:{color:BrandColors.primaryStart,...Typography.caption,fontWeight:'700'},
  stack:{flex:1,alignItems:'center',justifyContent:'center'},
  cardC:{position:'absolute' as const},
  stamp:{position:'absolute' as const,top:50,zIndex:10,paddingHorizontal:Spacing.lg,paddingVertical:Spacing.sm,borderRadius:Radius.md,borderWidth:3},
  stampT:{fontSize:24,fontWeight:'900' as const,letterSpacing:2},
  empty:{alignItems:'center',gap:Spacing.md,padding:Spacing.xxl},
  emptyT:{color:BrandColors.textPrimary,...Typography.h1},
  emptyD:{color:BrandColors.textSecondary,...Typography.body,textAlign:'center' as const},
  resetG:{flexDirection:'row',alignItems:'center',paddingHorizontal:Spacing.xl,paddingVertical:Spacing.sm,borderRadius:Radius.full,marginTop:Spacing.md},
  resetT:{color:BrandColors.textPrimary,...Typography.bodyBold},
  actions:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:Spacing.lg,paddingVertical:Spacing.lg,paddingBottom:Spacing.sm},
  skipBtn:{backgroundColor:BrandColors.glass,borderWidth:1,borderColor:BrandColors.glassBorder,width:64,height:64,borderRadius:Radius.full,alignItems:'center',justifyContent:'center'},
  undoBtn:{backgroundColor:BrandColors.glass,borderWidth:1,borderColor:BrandColors.glassBorder,width:52,height:52,borderRadius:Radius.full,alignItems:'center',justifyContent:'center'},
  cookBtn:{width:80,height:80,borderRadius:Radius.full,alignItems:'center',justifyContent:'center'},
});
