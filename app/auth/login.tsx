import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { success, error } = await signIn(email, password, isAdmin);

      if (success) {
        // Show success message with role information
        Alert.alert('Login Successful', `Welcome back! You're logged in`, [
          {
            text: 'Continue',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ]);
      } else {
        throw new Error(error || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to your HimalByte account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Mail size={20} color={Colors.neutral[500]} />}
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon={<Lock size={20} color={Colors.neutral[500]} />}
            rightIcon={
              showPassword ? (
                <EyeOff size={20} color={Colors.neutral[500]} />
              ) : (
                <Eye size={20} color={Colors.neutral[500]} />
              )
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
            error={errors.password}
          />

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={styles.loginButton}
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
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
  adminContainer: {
    marginBottom: Spacing.xl,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary[600],
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary[600],
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  adminText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[700],
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  registerText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
  },
  registerLink: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.primary[600],
    marginLeft: 5,
  },
});
