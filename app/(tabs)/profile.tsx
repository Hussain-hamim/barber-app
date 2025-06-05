import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import {
  ChevronRight,
  User as UserIcon,
  Calendar,
  LogOut,
  Star,
  Heart,
} from 'lucide-react-native';

interface Barber {
  id: string;
  name: string;
  image: string;
  experience: string;
  created_at: string;
}

interface Appointment {
  id: string;
  profile_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [favoriteBarbers, setFavoriteBarbers] = useState<Barber[]>([]);
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profile);

          // Get all barbers
          const { data: barbers, error: barbersError } = await supabase
            .from('barbers')
            .select('*');

          const { data: allAppointments, error: appointmentError } =
            await supabase
              .from('appointments')
              .select('*')
              .eq('profile_id', session.user.id);

          const upcoming = (allAppointments ?? [])
            .filter(
              (appt) => appt.status === 'confirmed' || appt.status === 'pending'
            )
            .slice(0, 3); // Just show the next 3

          setUpcomingAppointments(upcoming);

          if (barbersError) throw barbersError;
          setAllBarbers(barbers || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

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
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <UserIcon size={40} color={Colors.white} />
            </View>
          </View>

          <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          <Text style={styles.userEmail}>
            {session?.user?.email || 'user@example.com'}
          </Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {upcomingAppointments.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Calendar size={18} color={Colors.primary[600]} />
                <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/appointments')}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {upcomingAppointments.map((appointment) => {
              const barber = allBarbers.find(
                (b) => b.id === appointment.barber_id
              );

              return (
                <View key={appointment.id} style={styles.appointmentItem}>
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDateText}>
                      {new Date(
                        appointment.appointment_date
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentTime}>
                      {appointment.appointment_time}
                    </Text>
                    <Text style={styles.appointmentBarber}>
                      with {barber?.name || 'Unknown Barber'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.appointmentStatus,
                      {
                        backgroundColor:
                          appointment.status === 'confirmed'
                            ? Colors.success[100]
                            : Colors.warning[100],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.appointmentStatusText,
                        {
                          color:
                            appointment.status === 'confirmed'
                              ? Colors.success[700]
                              : Colors.warning[700],
                        },
                      ]}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Calendar size={18} color={Colors.primary[600]} />
                <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              </View>
            </View>
            <Text style={styles.noItemsText}>No upcoming appointments</Text>
          </View>
        )}

        {favoriteBarbers.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Heart size={18} color={Colors.primary[600]} />
                <Text style={styles.sectionTitle}>Favorite Barbers</Text>
              </View>
            </View>

            {favoriteBarbers.map((barber) => (
              <TouchableOpacity
                key={barber.id}
                style={styles.favoriteItem}
                onPress={() =>
                  router.push({
                    pathname: '/services',
                    params: { barberId: barber.id, barberName: barber.name },
                  })
                }
              >
                <Image
                  source={{ uri: barber.image }}
                  style={styles.favoriteImage}
                />

                <View style={styles.favoriteDetails}>
                  <Text style={styles.favoriteName}>{barber.name}</Text>
                  <Text style={styles.favoriteExperience}>
                    {barber.experience}
                  </Text>
                </View>

                <ChevronRight size={20} color={Colors.neutral[400]} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Heart size={18} color={Colors.primary[600]} />
                <Text style={styles.sectionTitle}>Favorite Barbers</Text>
              </View>
            </View>
            <Text style={styles.noItemsText}>No favorite barbers yet</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error[600]} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (keep the same styles as before)

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
  },
  profileSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  profileImageContainer: {
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    marginBottom: Spacing.md,
  },
  editProfileButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.full,
  },
  editProfileText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[700],
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    marginLeft: Spacing.sm,
  },
  viewAllText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[600],
  },
  noItemsText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[500],
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  appointmentDate: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDateText: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[700],
    textAlign: 'center',
  },
  appointmentDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  appointmentTime: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  appointmentBarber: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
  },
  appointmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginLeft: Spacing.md,
  },
  appointmentStatusText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.xs,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  favoriteImage: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
  },
  favoriteDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  favoriteName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  favoriteExperience: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  logoutText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.error[600],
    marginLeft: Spacing.sm,
  },
});
