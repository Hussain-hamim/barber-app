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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import { Calendar, Clock, User, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import Button from '@/components/Button';

interface Appointment {
  id: string;
  profile_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  barbers?: { name: string };
  services?: { name: string };
  user_id?: string; // Added for mapping
  formatted_date?: string; // Added for formatted date
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.is_admin;
  // Update the useEffect hooks to properly handle loading sequence
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

        // Load appointments only after we have both session and profile
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

  // Update loadAppointments to accept session and isAdmin as parameters
  const loadAppointments = async (
    currentSession: Session | null,
    currentIsAdmin?: boolean
  ) => {
    try {
      setLoading(true);

      // Ensure we have a session before proceeding
      if (!currentSession) {
        setAppointments([]);
        return;
      }

      let query = supabase.from('appointments').select(`
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
    `);

      // Only filter by user_id if not admin
      if (!currentIsAdmin) {
        query = query.eq('profile_id', currentSession.user.id);
      }

      // Order by date (newest first)
      const { data, error } = await query
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      // Format the dates and add to appointments
      const formattedAppointments =
        data?.map((appointment) => ({
          ...appointment,
          user_id: appointment.profile_id,
          barber_name: appointment.barbers?.name,
          service_name: appointment.services?.name,
          formatted_date: formatDate(appointment.appointment_date),
        })) || [];

      setAppointments(formattedAppointments);
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

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh the appointments list
      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.success[500];
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
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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

        {isAdmin && (
          <View style={styles.adminActions}>
            {item.status === 'pending' && (
              <TouchableOpacity
                style={[
                  styles.adminActionButton,
                  { backgroundColor: Colors.success[500] },
                ]}
                onPress={() => handleUpdateStatus(item.id, 'confirmed')}
              >
                <Text style={styles.adminActionText}>Confirm</Text>
              </TouchableOpacity>
            )}
            {(item.status === 'pending' || item.status === 'confirmed') && (
              <TouchableOpacity
                style={[
                  styles.adminActionButton,
                  { backgroundColor: Colors.error[500] },
                ]}
                onPress={() => handleUpdateStatus(item.id, 'cancelled')}
              >
                <Text style={styles.adminActionText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
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
          <Text style={styles.infoText}>{item.appointment_time}</Text>
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
            onRefresh={loadAppointments}
          />
        )}
      </View>
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
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  adminActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  adminActionText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.xs,
    color: Colors.white,
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
  notesText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    fontStyle: 'italic',
  },
});
