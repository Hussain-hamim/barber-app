import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Check, Calendar, Clock, User } from 'lucide-react-native';
import Button from '@/components/Button';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { barberName, serviceName, date, time } = useLocalSearchParams();
  
  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;
  const checkmarkOpacity = React.useRef(new Animated.Value(0)).current;
  const checkmarkScale = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Card animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    // Checkmark animation
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);
  
  // Format date from YYYY-MM-DD to a more readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year as string), parseInt(month as string) - 1, parseInt(day as string));
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const navigateToAppointments = () => {
    router.push('/(tabs)/appointments');
  };
  
  const navigateToHome = () => {
    router.replace('/(tabs)');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Animated.View style={[
          styles.checkmarkContainer,
          {
            opacity: checkmarkOpacity,
            transform: [{ scale: checkmarkScale }]
          }
        ]}>
          <View style={styles.checkmarkCircle}>
            <Check size={40} color={Colors.white} />
          </View>
        </Animated.View>
        
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your appointment has been scheduled</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <User size={16} color={Colors.primary[600]} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Barber</Text>
              <Text style={styles.detailValue}>{barberName}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Calendar size={16} color={Colors.primary[600]} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(date as string)}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Clock size={16} color={Colors.primary[600]} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.serviceContainer}>
            <Text style={styles.serviceTitle}>Service</Text>
            <Text style={styles.serviceName}>{serviceName}</Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="View My Appointments"
            onPress={navigateToAppointments}
            fullWidth
            style={styles.button}
          />
          
          <Button
            title="Back to Home"
            onPress={navigateToHome}
            variant="outline"
            fullWidth
            style={styles.button}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  checkmarkContainer: {
    marginBottom: Spacing.xl,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes['2xl'],
    color: Colors.neutral[800],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.neutral[50],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[700],
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[500],
  },
  detailValue: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.md,
  },
  serviceContainer: {
    marginTop: Spacing.sm,
  },
  serviceTitle: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  serviceName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    marginBottom: Spacing.sm,
  },
});