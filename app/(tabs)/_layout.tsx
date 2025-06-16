import React, { useEffect, useState } from 'react';
import { View, Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Calendar, User, Settings, Scissors } from 'lucide-react-native';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function TabLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('index');
  const animationValues = {
    index: new Animated.Value(1),
    appointments: new Animated.Value(0),
    profile: new Animated.Value(0),
    settings: new Animated.Value(0),
  };

  const isAdmin = profile?.is_admin;

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data || null);
      }
    };
    fetchUser();

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    // Animate all tabs
    Object.keys(animationValues).forEach((key) => {
      Animated.spring(animationValues[key], {
        toValue: key === tabName ? 1 : 0,
        useNativeDriver: true,
        friction: 5,
      }).start();
    });
  };

  const TabIcon = ({
    name,
    icon: Icon,
    isFocused,
  }: {
    name: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    isFocused: boolean;
  }) => {
    const scale = animationValues[name].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    const opacity = animationValues[name].interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    });

    return (
      <Animated.View
        style={{
          transform: [{ scale }],
          opacity,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={24}
          color={isFocused ? Colors.primary[600] : Colors.neutral[400]}
          fill={isFocused ? Colors.primary[600] : 'transparent'}
        />
        {isFocused && (
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.primary[600],
              marginTop: 4,
            }}
          />
        )}
      </Animated.View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => handleTabPress('index'),
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="index"
              icon={isAdmin ? Scissors : Home}
              isFocused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="appointments"
        listeners={{
          tabPress: () => handleTabPress('appointments'),
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="appointments" icon={Calendar} isFocused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: () => handleTabPress('profile'),
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" icon={User} isFocused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        listeners={{
          tabPress: () => handleTabPress('settings'),
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" icon={Settings} isFocused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.neutral[100],
    borderTopWidth: 0,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});
