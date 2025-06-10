import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import { Calendar, Clock, User, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import Button from '@/components/Button';
import {
  scheduleReminderNotifications,
  scheduleReminderNotifications2,
  sendPushNotification,
} from '@/services/notifications';

interface Barber {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface Appointment {
  id: string;
  profile_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at?: string;
  barbers?: Barber;
  services?: Service;
  barber_name?: string;
  service_name?: string;
  formatted_date?: string;
  formatted_time?: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: Colors.neutral[500] },
  { value: 'confirmed', label: 'Confirmed', color: Colors.success[500] },
  { value: 'completed', label: 'Completed', color: Colors.neutral[500] },
  { value: 'cancelled', label: 'Cancelled', color: Colors.error[500] },
];

export default function AppointmentsScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const isAdmin = profile?.is_admin;

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profile || null);
        loadAppointments(session, profile?.is_admin);
      } else {
        setAppointments([]);
      }
    };

    fetchData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setAppointments([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAppointments = async (
    currentSession: Session | null,
    currentIsAdmin?: boolean
  ) => {
    try {
      setLoading(true);

      if (!currentSession) {
        setAppointments([]);
        return;
      }

      let query = supabase
        .from('appointments')
        .select(
          `
        id,
        profile_id,
        barber_id,
        service_id,
        appointment_date,
        appointment_time,
        status,
        created_at,
        barbers (name),
        services (name)
      `
        )
        .order('created_at', { ascending: false });

      if (!currentIsAdmin) {
        query = query.eq('profile_id', currentSession.user.id);
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      const formattedAppointments =
        data?.map((appointment: any) => ({
          ...appointment,
          user_id: appointment.profile_id,
          barber_name: appointment.barbers?.name,
          service_name: appointment.services?.name,
          formatted_date: formatDate(appointment.appointment_date),
          formatted_time: formatTime(appointment.appointment_time),
        })) || [];

      setAppointments(formattedAppointments);

      // Only schedule reminders for non-admin users
      if (!currentIsAdmin) {
        await scheduleReminderNotifications(formattedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    try {
      setLoading(true);

      const { error, data: updatedAppointment } = await supabase
        .from('appointments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .select(
          `
          *,
          profiles (push_token),
          services (name),
          barbers (name)
        `
        )
        .single();

      if (error) throw error;

      // Send notification to user if status changed by barber
      if (
        updatedAppointment &&
        updatedAppointment.profiles?.push_token &&
        isAdmin
      ) {
        const statusText = newStatus.replace('_', ' ');
        const serviceName = updatedAppointment.services?.name || 'your service';
        const barberName =
          (updatedAppointment.barbers as { name: string })?.name ||
          'your barber';

        await sendPushNotification(
          updatedAppointment.profiles.push_token,
          'Appointment Update',
          `Your appointment with ${barberName} for ${serviceName} has been ${statusText}`
        );
      }

      await loadAppointments(session, isAdmin);
      setStatusModalVisible(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return Colors.success[500];
      case 'in_progress':
        return Colors.neutral[500];
      case 'pending':
        return Colors.warning[500];
      case 'cancelled':
        return Colors.error[500];
      case 'completed':
        return Colors.neutral[500];
      default:
        return Colors.neutral[500];
    }
  };

  const openStatusModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setStatusModalVisible(true);
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === 'in_progress'
              ? 'In Progress'
              : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>

        {item.status === 'pending' && !isAdmin && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleUpdateStatus(item.id, 'cancelled')}
          >
            <X size={16} color={Colors.neutral[600]} />
          </TouchableOpacity>
        )}

        {isAdmin &&
          item.status !== 'completed' &&
          item.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.statusDropdownButton}
              onPress={() => openStatusModal(item)}
            >
              <Text style={styles.statusDropdownText}>Update Status</Text>
              <ChevronDown size={16} color={Colors.primary[500]} />
            </TouchableOpacity>
          )}
      </View>

      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentService}>{item.service_name}</Text>

        <View style={styles.infoItem}>
          <User size={16} color={Colors.neutral[500]} />
          <Text style={styles.infoText}>{item.barber_name}</Text>
        </View>

        <View style={styles.infoItem}>
          <Calendar size={16} color={Colors.neutral[500]} />
          <Text style={styles.infoText}>{item.formatted_date}</Text>
        </View>

        <View style={styles.infoItem}>
          <Clock size={16} color={Colors.neutral[500]} />
          <Text style={styles.infoText}>{item.formatted_time}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isAdmin ? 'All Appointments' : 'Your Appointments'}
        </Text>
      </View>

      <View style={styles.content}>
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptyText}>
              Your scheduled appointments will appear here
            </Text>

            {!isAdmin && (
              <Button
                title="Book an Appointment"
                onPress={() => router.push('/(tabs)')}
                style={styles.bookButton}
              />
            )}
          </View>
        ) : (
          <FlatList
            data={appointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={() => loadAppointments(session, isAdmin)}
          />
        )}
      </View>

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Appointment Status</Text>

            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.statusOption,
                  {
                    backgroundColor: pressed
                      ? Colors.neutral[100]
                      : Colors.white,
                    borderLeftColor: option.color,
                  },
                ]}
                onPress={() =>
                  selectedAppointment &&
                  handleUpdateStatus(
                    selectedAppointment.id,
                    option.value as AppointmentStatus
                  )
                }
              >
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: option.color },
                  ]}
                />
                <Text style={styles.statusOptionText}>{option.label}</Text>
              </Pressable>
            ))}

            <Button
              title="Cancel"
              onPress={() => setStatusModalVisible(false)}
              variant="outline"
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.xl,
    color: Colors.neutral[800],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  bookButton: {
    marginTop: Spacing.lg,
  },
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  appointmentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    padding: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.xs,
    color: Colors.white,
  },
  cancelButton: {
    padding: 4,
  },
  statusDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  statusDropdownText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[500],
    marginRight: 4,
  },
  appointmentInfo: {
    padding: Spacing.md,
  },
  appointmentService: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[700],
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.sm,
    borderLeftWidth: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  statusOptionText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  modalCancelButton: {
    marginTop: Spacing.md,
  },
});
