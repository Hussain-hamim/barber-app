import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Calendar, User, Settings } from 'lucide-react-native';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function TabLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const isAdmin = profile?.is_admin;

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      console.log('Session new:', session);

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarLabelStyle: {
          fontFamily: Typography.families.medium,
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[200],
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Services' : 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
