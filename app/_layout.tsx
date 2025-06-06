import { useCallback, useEffect, useRef } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import {
  registerForPushNotifications,
  savePushToken,
  setupNotificationListeners,
} from '@/services/notifications';
import { NavigationContainer } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Register for push notifications when app starts
    const registerPushNotifications = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = await registerForPushNotifications();
      if (token && session?.user?.id) {
        await savePushToken(session.user.id, token);
      }
    };

    registerPushNotifications();

    // Set up notification listeners
    const cleanupListeners = setupNotificationListeners(navigationRef);

    return () => {
      // Clean up listeners when component unmounts
      cleanupListeners();
    };
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} ref={navigationRef}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="auth"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="admin"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
