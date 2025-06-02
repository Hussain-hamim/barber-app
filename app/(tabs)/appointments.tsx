import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { getAppointments, updateAppointment } from '@/utils/storage';
import { BARBERS, SERVICES, Appointment } from '@/constants/data';
import { Calendar, Clock, User, MapPin, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

type AppointmentWithDetails = Appointment & {
  barberName: string;
  serviceName: string;
  formattedDate: string;
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const storedAppointments = await getAppointments();
      
      // Add barber and service names to appointments
      const enhancedAppointments = storedAppointments.map(appointment => {
        const barber = BARBERS.find(b => b.id === appointment.barberId);
        const service = SERVICES.find(s => s.id === appointment.serviceId);
        
        const formattedDate = formatDate(appointment.date);
        
        return {
          ...appointment,
          barberName: barber?.name || 'Unknown Barber',
          serviceName: service?.name || 'Unknown Service',
          formattedDate,
        };
      });
      
      setAppointments(enhancedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await updateAppointment(appointmentId, { status: 'cancelled' });
      setAppointments(appointments.map(appt => 
        appt.id === appointmentId ? { ...appt, status: 'cancelled' } : appt
      ));
    } catch (error) {
      console.error('Error cancelling appointment:', error);
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

  const renderAppointmentItem = ({ item }: { item: AppointmentWithDetails }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        
        {item.status === 'pending' && !isAdmin && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelAppointment(item.id)}
          >
            <X size={16} color={Colors.neutral[600]} />
          </TouchableOpacity>
        )}
        
        {isAdmin && (
          <View style={styles.adminActions}>
            {item.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.adminActionButton, { backgroundColor: Colors.success[500] }]}
                onPress={() => updateAppointment(item.id, { status: 'confirmed' }).then(loadAppointments)}
              >
                <Text style={styles.adminActionText}>Confirm</Text>
              </TouchableOpacity>
            )}
            {(item.status === 'pending' || item.status === 'confirmed') && (
              <TouchableOpacity 
                style={[styles.adminActionButton, { backgroundColor: Colors.error[500] }]}
                onPress={() => updateAppointment(item.id, { status: 'cancelled' }).then(loadAppointments)}
              >
                <Text style={styles.adminActionText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentService}>
          {item.serviceName}
        </Text>
        
        <View style={styles.infoItem}>
          <User size={16} color={Colors.neutral[500]} />
          <Text style={styles.infoText}>
            {item.barberName}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Calendar size={16} color={Colors.neutral[500]} />
          <Text style={styles.infoText}>
            {item.formattedDate}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Clock size={16} color={Colors.neutral[500]} />
          <Text style={styles.infoText}>
            {item.time}
          </Text>
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
          />
        )}
      </View>
    </SafeAreaView>
  );
}

import Button from '@/components/Button';

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
});