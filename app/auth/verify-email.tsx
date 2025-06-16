import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, name } = useLocalSearchParams();
  const { verifyOtp } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { session, error } = await verifyOtp(email as string, code);

      if (error) {
        Alert.alert(
          'Verification Failed',
          error.message || 'Invalid verification code'
        );
        return;
      }

      if (session) {
        router.replace('/(tabs)');
      }

      if (session?.user) {
        await supabase.from('profiles').insert({
          id: session?.user.id,
          name: name,
          email: session?.user.email,
          is_admin: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </TouchableOpacity> */}

        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to {email}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Verification Code"
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            leftIcon={<Mail size={20} color={Colors.neutral[500]} />}
          />

          <Button
            title="Verify Email"
            onPress={handleVerify}
            loading={loading}
            fullWidth
            style={styles.verifyButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive a code?</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Info',
                  'Check your spam folder or try signing up again'
                )
              }
            >
              <Text style={styles.footerLink}>Need help?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    paddingTop: Spacing.xl * 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes['2xl'],
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
  },
  form: {
    marginTop: Spacing.lg,
  },
  verifyButton: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
  },
  footerLink: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.primary[600],
    marginLeft: 5,
  },
});
