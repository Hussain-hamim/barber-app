import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import {
  ChevronRight,
  UserIcon,
  Calendar,
  LogOut,
  Heart,
  X,
  Edit,
  Check,
} from 'lucide-react-native';
import { getFavoriteBarbers, toggleFavorite } from '@/utils/favorites';

interface Barber {
  id: string;
  name: string;
  image: string;
  experience: string;
  image_url: string;
}

interface Appointment {
  id: string;
  barber_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [favoriteBarbers, setFavoriteBarbers] = useState<Barber[]>([]);
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);

  // Edit Modal States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) fetchData();
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(profile);
        setEditedName(profile?.name || '');
        setProfileImage(profile?.profile_image || null);

        // Fetch appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('profile_id', session.user.id)
          .order('appointment_date', { ascending: true })
          .limit(3);

        setUpcomingAppointments(
          appointments?.filter(
            (appt: Appointment) =>
              appt.status === 'confirmed' || appt.status === 'pending'
          ) || []
        );

        // Fetch favorite barbers
        const favoriteBarbers = await getFavoriteBarbers(session.user.id);
        setFavoriteBarbers(favoriteBarbers || []);

        // Fetch all barbers (for appointment names)
        const { data: barbers } = await supabase.from('barbers').select('*');
        setAllBarbers(barbers || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to handle removing favorites
  const handleRemoveFavorite = async (barberId: string) => {
    if (!session?.user?.id) return;

    try {
      const success = await toggleFavorite(session.user.id, barberId);
      if (success === false) {
        // Only update state if removal was successful
        setFavoriteBarbers((prev) => prev.filter((b) => b.id !== barberId));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
      console.error('Error toggling favorite:', error);
    }
  };

  const handleImageUpload = async () => {
    try {
      setUploading(true);

      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please allow access to your photos to upload images'
        );
        return;
      }

      // Pick image
      const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (canceled || !assets?.[0]?.base64) return;

      const base64 = assets[0].base64;
      const fileExt = assets[0].uri.split('.').pop() || 'jpg';
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('barber-images')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('barber-images').getPublicUrl(filePath);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProfileImage(publicUrl);
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editedName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      await fetchData();
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
      console.error('Error during logout:', error);
    }
  };

  const getBarberName = (barberId: string) => {
    return allBarbers.find((b) => b.id === barberId)?.name || 'Unknown Barber';
  };

  if (loading && !profile) {
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
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImage}>
                <UserIcon size={40} color={Colors.white} />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          <Text style={styles.userEmail}>
            {session?.user?.email || 'user@example.com'}
          </Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Edit size={16} color={Colors.primary[700]} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Calendar size={18} color={Colors.primary[600]} />
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            </View>
            {upcomingAppointments.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/appointments')}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentItem}>
                <View style={styles.appointmentDate}>
                  <Text style={styles.appointmentDateText}>
                    {new Date(appointment.appointment_date).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </Text>
                </View>

                <View style={styles.appointmentDetails}>
                  <Text style={styles.appointmentTime}>
                    {appointment.appointment_time}
                  </Text>
                  <Text style={styles.appointmentBarber}>
                    with {getBarberName(appointment.barber_id)}
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
            ))
          ) : (
            <Text style={styles.noItemsText}>No upcoming appointments</Text>
          )}
        </View>

        {/* Favorite Barbers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Heart size={18} color={Colors.primary[600]} />
              <Text style={styles.sectionTitle}>Favorite Barbers</Text>
            </View>
            {favoriteBarbers.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {favoriteBarbers.length > 0 ? (
            favoriteBarbers.map((barber) => (
              <View key={barber.id} style={styles.favoriteItemContainer}>
                <TouchableOpacity
                  style={styles.favoriteItem}
                  onPress={() =>
                    router.push({
                      pathname: '/services',
                      params: { barberId: barber.id, barberName: barber.name },
                    })
                  }
                >
                  <Image
                    source={{
                      uri:
                        barber.image_url || 'https://via.placeholder.com/150',
                    }}
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
                <TouchableOpacity
                  style={styles.removeFavoriteButton}
                  onPress={() => handleRemoveFavorite(barber.id)}
                >
                  <X size={18} color={Colors.error[500]} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No favorite barbers yet</Text>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error[600]} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setIsEditModalVisible(false)}
            >
              <X size={24} color={Colors.neutral[500]} />
            </Pressable>

            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TouchableOpacity
              style={styles.profileImageUpload}
              onPress={handleImageUpload}
              disabled={uploading}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImagePreview}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <UserIcon size={40} color={Colors.white} />
                </View>
              )}
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              )}
              <View style={styles.editImageBadge}>
                <Edit size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.neutral[400]}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={loading || !editedName.trim()}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Check size={20} color={Colors.white} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
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
    paddingVertical: Spacing['2xl'],
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
    paddingBottom: Spacing.md,
  },
  profileSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
    maxWidth: '90%',
    marginBottom: Spacing.md,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
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
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  logoutText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.error[600],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    zIndex: 1,
  },
  profileImageUpload: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary[600],
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  inputLabel: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[600],
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  saveButtonText: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.white,
  },

  favoriteItemContainer: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  removeFavoriteButton: {
    position: 'absolute',
    right: 40,
    top: '40%',
    transform: [{ translateY: -9 }],
    padding: Spacing.sm,
  },
});
