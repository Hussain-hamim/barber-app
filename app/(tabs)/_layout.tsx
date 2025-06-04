import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Calendar, User, Settings } from 'lucide-react-native';
import { Colors, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

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
