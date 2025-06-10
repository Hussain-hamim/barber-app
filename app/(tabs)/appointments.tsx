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
import {
  Calendar,
  Clock,
  User,
  X,
  ChevronDown,
  Scissors,
} from 'lucide-react-native';
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

export interface Appointment {
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
  profile_name?: string;
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
        services (name),
        profiles (name)
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
          profile_name: appointment.profiles?.name,
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
      {/* Header with status and action buttons */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
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
          <Text style={styles.dateText}>{item.formatted_date}</Text>
        </View>

        {item.status === 'pending' && !isAdmin && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleUpdateStatus(item.id, 'cancelled')}
          >
            <X size={20} color={Colors.error[500]} />
          </TouchableOpacity>
        )}

        {isAdmin &&
          item.status !== 'completed' &&
          item.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.statusDropdownButton}
              onPress={() => openStatusModal(item)}
            >
              <Text style={styles.statusDropdownText}>Update</Text>
              <ChevronDown size={16} color={Colors.primary[500]} />
            </TouchableOpacity>
          )}
      </View>

      {/* Main content */}
      <View style={styles.appointmentContent}>
        <View style={styles.serviceSection}>
          <Scissors size={24} color={Colors.primary[500]} />
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            <Text style={styles.serviceTime}>
              <Clock size={16} color={Colors.neutral[500]} />{' '}
              {item.formatted_time}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.professionalSection}>
          <View style={styles.avatar}>
            <User size={20} color={Colors.white} />
          </View>
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalLabel}>
              {isAdmin ? 'Client' : 'Barber'}
            </Text>
            <Text style={styles.professionalName}>
              {isAdmin ? item.profile_name : item.barber_name}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer with action buttons */}
      {!isAdmin && (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/services',
                params: {
                  barberId: item.barber_id,
                  barberName: item.barber_name,
                },
              })
            }
            style={styles.footerButton}
          >
            <Text style={styles.footerButtonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/services',
                params: {
                  barberId: item.barber_id,
                  barberName: item.barber_name,
                },
              })
            }
            style={styles.footerButtonPrimary}
          >
            <Text style={styles.footerButtonPrimaryText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: Spacing.md,
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

  appointmentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  dateText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
  },
  cancelButton: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.error[50],
  },
  statusDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary[50],
  },
  statusDropdownText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[500],
    marginRight: Spacing.xs,
  },
  appointmentContent: {
    padding: Spacing.md,
  },
  serviceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  serviceInfo: {
    marginLeft: Spacing.md,
  },
  serviceName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  serviceTime: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing.sm,
  },
  professionalSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalInfo: {
    marginLeft: Spacing.md,
  },
  professionalLabel: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  professionalName: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    padding: Spacing.sm,
  },
  footerButton: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.neutral[100],
  },
  footerButtonText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
  },
  footerButtonPrimary: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary[500],
  },
  footerButtonPrimaryText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.white,
  },
});
