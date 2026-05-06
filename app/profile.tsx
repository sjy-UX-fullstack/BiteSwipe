/**
 * User Profile Modal
 */
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        <View style={s.header}>
          <LinearGradient colors={Gradients.primary as [string,string]} style={s.avatar}>
            <Feather name="user" size={48} color="#fff" />
          </LinearGradient>
          <Text style={s.name}>Sanjay T</Text>
          <Text style={s.handle}>@sanjayt</Text>
          
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statV}>12</Text>
              <Text style={s.statL}>Cooked</Text>
            </View>
            <View style={s.divider}/>
            <View style={s.stat}>
              <Text style={s.statV}>48</Text>
              <Text style={s.statL}>Saved</Text>
            </View>
            <View style={s.divider}/>
            <View style={s.stat}>
              <Text style={s.statV}>3</Text>
              <Text style={s.statL}>Posts</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Settings</Text>
        
        <View style={s.menu}>
          <TouchableOpacity style={s.menuItem}>
            <Feather name="bell" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Notifications</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem}>
            <Feather name="heart" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Dietary Preferences</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem}>
            <Feather name="shield" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Account & Security</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={s.logoutBtn}>
          <Text style={s.logoutT}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:BrandColors.dark900},
  scroll:{padding:Spacing.lg},
  header:{alignItems:'center',marginTop:Spacing.xl,marginBottom:Spacing.xxl},
  avatar:{width:100,height:100,borderRadius:50,alignItems:'center',justifyContent:'center',marginBottom:Spacing.md},
  name:{color:BrandColors.textPrimary,...Typography.h1},
  handle:{color:BrandColors.textSecondary,...Typography.body},
  stats:{flexDirection:'row',backgroundColor:BrandColors.dark800,borderRadius:Radius.lg,padding:Spacing.md,marginTop:Spacing.lg,width:'100%'},
  stat:{flex:1,alignItems:'center'},
  statV:{color:BrandColors.textPrimary,...Typography.h2},
  statL:{color:BrandColors.textTertiary,...Typography.caption},
  divider:{width:1,backgroundColor:BrandColors.glassBorder},
  sectionTitle:{color:BrandColors.textPrimary,...Typography.h3,marginBottom:Spacing.md},
  menu:{backgroundColor:BrandColors.dark800,borderRadius:Radius.lg,overflow:'hidden',marginBottom:Spacing.xl},
  menuItem:{flexDirection:'row',alignItems:'center',padding:Spacing.md,borderBottomWidth:1,borderBottomColor:BrandColors.glassBorder},
  menuT:{flex:1,color:BrandColors.textPrimary,...Typography.bodyBold,marginLeft:Spacing.md},
  logoutBtn:{backgroundColor:'rgba(255,71,87,0.1)',paddingVertical:Spacing.md,borderRadius:Radius.full,alignItems:'center'},
  logoutT:{color:BrandColors.error,...Typography.bodyBold},
});
