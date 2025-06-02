import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // If user is already authenticated, redirect to main app
    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }
    
    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [isAuthenticated, isLoading]);

  // Wait for auth check before rendering
  if (isLoading) return null;
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>HimalByte</Text>
          <Text style={styles.tagline}>Premium Barber Services</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/3998422/pexels-photo-3998422.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Animated.View 
            style={{ 
              opacity: fadeAnim, 
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })}] 
            }}
          >
            <Text style={styles.welcomeText}>
              Book your next haircut with ease
            </Text>
            <Text style={styles.descriptionText}>
              Find the perfect barber, choose your service, and schedule appointments in just a few taps
            </Text>
          </Animated.View>
          
          <View style={styles.buttonGroup}>
            <TouchableButton 
              label="Log In"
              onPress={() => router.push('/auth/login')}
              variant="primary"
              delay={200}
              fadeAnim={fadeAnim}
            />
            
            <TouchableButton 
              label="Register"
              onPress={() => router.push('/auth/register')}
              variant="outline"
              delay={400}
              fadeAnim={fadeAnim}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

interface TouchableButtonProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'outline';
  delay: number;
  fadeAnim: Animated.Value;
}

const TouchableButton: React.FC<TouchableButtonProps> = ({ label, onPress, variant, delay, fadeAnim }) => {
  const buttonAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const isPrimary = variant === 'primary';
  
  return (
    <Animated.View
      style={{
        opacity: buttonAnim,
        transform: [{ 
          translateY: buttonAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }}
    >
      <TouchableOpacity
        style={[
          styles.button,
          isPrimary ? styles.primaryButton : styles.outlineButton
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text 
          style={[
            styles.buttonText,
            isPrimary ? styles.primaryButtonText : styles.outlineButtonText
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

import { TouchableOpacity } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.lg,
  },
  logoText: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes['3xl'],
    color: Colors.primary[700],
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    marginTop: Spacing.xs,
  },
  imageContainer: {
    flex: 1,
    maxHeight: '40%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    padding: Spacing.xl,
  },
  welcomeText: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes['2xl'],
    color: Colors.neutral[800],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonGroup: {
    gap: Spacing.md,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary[600],
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
  buttonText: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
  },
  primaryButtonText: {
    color: Colors.white,
  },
  outlineButtonText: {
    color: Colors.primary[600],
  },
});