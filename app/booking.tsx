import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import { TIME_SLOTS } from '@/constants/data';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Check,
} from 'lucide-react-native';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { sendPushNotification } from '@/services/notifications';

export default function BookingScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const {
    barberId,
    barberName,
    serviceId,
    serviceName,
    servicePrice,
    serviceDuration,
  } = useLocalSearchParams();

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(formattedToday);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedTime(null); // Reset time selection when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Fetch booked times when date or barber changes
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!selectedDate || !barberId) return;

      setLoadingTimes(true);
      try {
        // Convert date to proper format (YYYY-MM-DD)
        const dateParts = selectedDate.split('-');
        const formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;

        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('barber_id', barberId)
          .eq('appointment_date', formattedDate)
          .eq('status', 'confirmed'); // Changed from .neq('status', 'cancelled') to .eq('status', 'confirmed')

        if (error) throw error;

        if (data) {
          // Convert database time format (HH:MM:SS) to our display format (HH:MM AM/PM)
          const booked = data.map((appt) => {
            const [hours, minutes] = appt.appointment_time.split(':');
            const hourNum = parseInt(hours, 10);
            const period = hourNum >= 12 ? 'PM' : 'AM';
            const displayHour = hourNum % 12 || 12;
            return `${displayHour}:${minutes} ${period}`;
          });
          setBookedTimes(booked);
        }
      } catch (error) {
        console.error('Error fetching booked times:', error);
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchBookedTimes();
  }, [selectedDate, barberId]);

  // Check if a time slot is available
  const isTimeSlotAvailable = (time: string) => {
    return !bookedTimes.includes(time);
  };

  const handleBookNow = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert(
        'Required',
        'Please select both date and time for your appointment'
      );
      return;
    }

    setLoading(true);

    try {
      // Convert the time string to a proper time format (e.g., "09:00:00")
      const timeParts = selectedTime.split(' ');
      const timeValue =
        timeParts[0].length === 4
          ? `0${timeParts[0]}:00`
          : `${timeParts[0]}:00`;

      // First get the user's name from their profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session?.user.id)
        .single();

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            profile_id: session?.user.id,
            barber_id: barberId,
            service_id: serviceId,
            appointment_date: selectedDate,
            appointment_time: timeValue,
            status: 'pending',
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        // Get admin push token
        const { data: adminData } = await supabase
          .from('profiles')
          .select('push_token')
          .eq('is_admin', true)
          .single();

        if (adminData?.push_token) {
          await sendPushNotification(
            adminData.push_token,
            'New Appointment Booking',
            `${barberName} has a new appointment for ${serviceName} from ${selectedDate} at ${selectedTime} with ${
              userProfile?.name || 'a customer'
            }`
          );
        }

        // Navigate to success screen
        router.push({
          pathname: '/booking-success',
          params: {
            barberName: barberName as string,
            serviceName: serviceName as string,
            date: selectedDate,
            time: selectedTime,
          },
        });
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate the next 30 days for the calendar
  const getMarkedDates = () => {
    const markedDates: any = {};

    // Mark the selected date
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: Colors.primary[600],
    };

    return markedDates;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Book Appointment</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Appointment Summary</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Barber</Text>
            <Text style={styles.summaryValue}>{barberName}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{serviceName}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryDetail}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>${servicePrice}</Text>
            </View>

            <View style={styles.summaryDetail}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{serviceDuration}</Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <CalendarIcon size={20} color={Colors.primary[600]} />
            <Text style={styles.calendarTitle}>Select Date</Text>
          </View>

          <Calendar
            current={selectedDate}
            minDate={formattedToday}
            maxDate={
              new Date(
                today.getFullYear(),
                today.getMonth() + 3,
                today.getDate()
              )
                .toISOString()
                .split('T')[0]
            }
            onDayPress={handleDateSelect}
            markedDates={getMarkedDates()}
            theme={{
              calendarBackground: Colors.white,
              textSectionTitleColor: Colors.neutral[700],
              selectedDayBackgroundColor: Colors.primary[600],
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.primary[600],
              dayTextColor: Colors.neutral[800],
              textDisabledColor: Colors.neutral[400],
              dotColor: Colors.primary[600],
              selectedDotColor: Colors.white,
              arrowColor: Colors.primary[600],
              monthTextColor: Colors.neutral[800],
              indicatorColor: Colors.primary[600],
              textDayFontFamily: Typography.families.regular,
              textMonthFontFamily: Typography.families.semibold,
              textDayHeaderFontFamily: Typography.families.medium,
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeHeader}>
            <Clock size={20} color={Colors.primary[600]} />
            <Text style={styles.timeTitle}>Select Time</Text>
          </View>

          <View style={styles.timeSlotGrid}>
            {TIME_SLOTS.map((time) => {
              const isAvailable = isTimeSlotAvailable(time);
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    !isAvailable && styles.timeSlotBooked,
                    selectedTime === time && styles.timeSlotSelected,
                  ]}
                  onPress={() => isAvailable && handleTimeSelect(time)}
                  disabled={!isAvailable}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      !isAvailable && styles.timeSlotTextBooked,
                      selectedTime === time && styles.timeSlotTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                  {selectedTime === time && isAvailable && (
                    <View style={styles.timeSlotCheckmark}>
                      <Check size={12} color={Colors.white} />
                    </View>
                  )}
                  {!isAvailable && (
                    <View style={styles.timeSlotBookedOverlay} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Book Now"
          onPress={handleBookNow}
          loading={loading}
          disabled={!selectedDate || !selectedTime}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

// Keep your existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  timeSlotBooked: {
    backgroundColor: Colors.neutral[100],
    opacity: 0.6,
  },
  timeSlotTextBooked: {
    color: Colors.neutral[400],
    textDecorationLine: 'line-through',
  },
  timeSlotBookedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: Radius.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  summaryTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    marginBottom: Spacing.md,
  },
  summaryItem: {
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  summaryDetail: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.primary[600],
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calendarTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    marginLeft: Spacing.sm,
  },
  calendar: {
    borderRadius: Radius.md,
  },
  timeContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timeTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    marginLeft: Spacing.sm,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '30%',
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[600],
    borderWidth: 1,
  },
  timeSlotText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
  },
  timeSlotTextSelected: {
    color: Colors.primary[700],
  },
  timeSlotCheckmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.full,
    padding: 2,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
});
