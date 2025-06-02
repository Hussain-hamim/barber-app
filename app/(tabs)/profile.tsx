import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  FlatList,
  Image,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { getAppointments } from '@/utils/storage';
import { getFavorites } from '@/utils/storage';
import { BARBERS, Appointment, Barber } from '@/constants/data';
import { ChevronRight, User as UserIcon, Calendar, LogOut, Star, Heart } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [favoriteBarbers, setFavoriteBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    // Load upcoming appointments
    const allAppointments = await getAppointments();
    const upcoming = allAppointments
      .filter(appt => appt.status === 'confirmed' || appt.status === 'pending')
      .slice(0, 3); // Just show the next 3
    
    setUpcomingAppointments(upcoming);
    
    // Load favorite barbers
    const favIds = await getFavorites();
    const favBarbers = BARBERS.filter(barber => favIds.includes(barber.id));
    
    setFavoriteBarbers(favBarbers);
  };
  
  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

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
          
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => {/* Navigate to edit profile */}}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Calendar size={18} color={Colors.primary[600]} />
                <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              </View>
              
              <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingAppointments.map(appointment => {
              const barber = BARBERS.find(b => b.id === appointment.barberId);
              
              return (
                <View key={appointment.id} style={styles.appointmentItem}>
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDateText}>
                      {new Date(appointment.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentTime}>{appointment.time}</Text>
                    <Text style={styles.appointmentBarber}>
                      with {barber?.name || 'Unknown Barber'}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.appointmentStatus,
                    {
                      backgroundColor: 
                        appointment.status === 'confirmed' 
                          ? Colors.success[100] 
                          : Colors.warning[100]
                    }
                  ]}>
                    <Text style={[
                      styles.appointmentStatusText,
                      {
                        color: 
                          appointment.status === 'confirmed' 
                            ? Colors.success[700] 
                            : Colors.warning[700]
                      }
                    ]}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        {favoriteBarbers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Heart size={18} color={Colors.primary[600]} />
                <Text style={styles.sectionTitle}>Favorite Barbers</Text>
              </View>
            </View>
            
            {favoriteBarbers.map(barber => (
              <TouchableOpacity 
                key={barber.id} 
                style={styles.favoriteItem}
                onPress={() => router.push({
                  pathname: '/services',
                  params: { barberId: barber.id, barberName: barber.name }
                })}
              >
                <Image 
                  source={{ uri: barber.image }} 
                  style={styles.favoriteImage}
                />
                
                <View style={styles.favoriteDetails}>
                  <Text style={styles.favoriteName}>{barber.name}</Text>
                  <Text style={styles.favoriteExperience}>{barber.experience}</Text>
                </View>
                
                <ChevronRight size={20} color={Colors.neutral[400]} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color={Colors.error[600]} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
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