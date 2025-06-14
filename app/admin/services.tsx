import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  X,
  DollarSign,
  Clock,
  Star,
  User,
} from 'lucide-react-native';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  barber_id: string;
  name: string;
  price: number;
  duration: string;
  description: string | null;
  is_active: boolean;
}

interface Review {
  id: string;
  user_id: string;
  barber_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    name: string;
    profile_image: string | null;
  };
}

export default function AdminServicesScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [barber, setBarber] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch barber details
        const { data: barberData } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', barberId)
          .single();

        setBarber(barberData);

        // Fetch services for this barber
        const { data: servicesData, error } = await supabase
          .from('services')
          .select('*')
          .eq('barber_id', barberId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setServices(servicesData || []);

        // Fetch reviews
        await fetchReviews();
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (barberId) {
      fetchData();
    }
  }, [barberId]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(
          `
          id,
          user_id,
          barber_id,
          rating,
          comment,
          created_at,
          profiles (name, profile_image)
        `
        )
        .eq('barber_id', barberId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentService(null);
    setServiceName('');
    setServicePrice('');
    setServiceDuration('');
    setServiceDescription('');
    setModalVisible(true);
  };

  const openEditModal = (service: Service) => {
    setCurrentService(service);
    setServiceName(service.name);
    setServicePrice(service.price.toString());
    setServiceDuration(formatDuration(service.duration));
    setServiceDescription(service.description || '');
    setModalVisible(true);
  };

  const formatDuration = (interval: string) => {
    if (!interval) return '';

    const parts = interval.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;

    const hourText = hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : '';
    const minuteText =
      minutes > 0 ? `${minutes} minute${minutes === 1 ? '' : 's'}` : '';

    return `${hourText} ${minuteText}`.trim();
  };

  const parseDuration = (input: string) => {
    if (!input) return '00:00:00';

    const totalMinutes = parseInt(input.replace(/[^0-9]/g, '')) || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:00`;
  };

  const handleSaveService = async () => {
    if (!serviceName || !servicePrice || !serviceDuration) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const serviceData = {
        barber_id: barberId as string,
        name: serviceName,
        price: parseFloat(servicePrice),
        duration: parseDuration(serviceDuration),
        description: serviceDescription || null,
        is_active: true,
      };

      if (currentService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', currentService.id);

        if (error) throw error;

        setServices(
          services.map((s) =>
            s.id === currentService.id ? { ...s, ...serviceData } : s
          )
        );
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert(serviceData)
          .select();

        if (error) throw error;
        if (data) setServices([data[0], ...services]);
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('services')
                .update({ is_active: false })
                .eq('id', id);

              if (error) throw error;

              setServices(services.filter((service) => service.id !== id));
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Failed to delete service');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteReview = async (id: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setReviewsLoading(true);
              const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);

              if (error) throw error;

              setReviews(reviews.filter((review) => review.id !== id));

              // Update barber rating
              const { data } = await supabase.rpc('calculate_barber_rating', {
                barber_id: barberId,
              });

              if (data) {
                setBarber((prev: any) => ({ ...prev, rating: data }));
              }
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review');
            } finally {
              setReviewsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.serviceDescription}>{item.description}</Text>
        )}

        <View style={styles.serviceDetails}>
          <View style={styles.serviceDetail}>
            <DollarSign size={16} color={Colors.neutral[600]} />
            <Text style={styles.detailText}>${item.price.toFixed(2)}</Text>
          </View>

          <View style={styles.serviceDetail}>
            <Clock size={16} color={Colors.neutral[600]} />
            <Text style={styles.detailText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Edit2 size={16} color={Colors.primary[600]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteService(item.id)}
        >
          <Trash2 size={16} color={Colors.error[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {item.profiles.profile_image ? (
          <Image
            source={{ uri: item.profiles.profile_image }}
            style={styles.reviewUserImage}
          />
        ) : (
          <View style={styles.reviewUserPlaceholder}>
            <User size={20} color={Colors.white} />
          </View>
        )}
        <View style={styles.reviewUserInfo}>
          <Text style={styles.reviewUserName}>{item.profiles.name}</Text>
          <View style={styles.reviewRating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                color={
                  i < item.rating ? Colors.warning[500] : Colors.neutral[300]
                }
                fill={i < item.rating ? Colors.warning[500] : 'transparent'}
              />
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={styles.reviewDeleteButton}
          onPress={() => handleDeleteReview(item.id)}
        >
          <Trash2 size={16} color={Colors.error[600]} />
        </TouchableOpacity>
      </View>
      {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading && services.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Manage Services</Text>
          {barber && <Text style={styles.headerSubtitle}>{barber.name}</Text>}
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Button
            title="Add New Service"
            onPress={openAddModal}
            leftIcon={<Plus size={18} color={Colors.white} />}
            style={styles.addButton}
          />

          {services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No services available. Add your first service using the button
                above.
              </Text>
            </View>
          ) : (
            <FlatList
              data={services}
              renderItem={renderServiceItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              {barber && (
                <View style={styles.ratingBadge}>
                  <Star
                    size={16}
                    color={Colors.warning[500]}
                    fill={Colors.warning[500]}
                  />
                  <Text style={styles.ratingText}>
                    {barber.rating?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
              )}
            </View>

            {reviewsLoading && reviews.length === 0 ? (
              <ActivityIndicator size="small" color={Colors.primary[600]} />
            ) : reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet</Text>
            ) : (
              <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.reviewsList}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentService ? 'Edit Service' : 'Add New Service'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Input
                label="Service Name *"
                placeholder="Haircut"
                value={serviceName}
                onChangeText={setServiceName}
              />

              <Input
                label="Price *"
                placeholder="10.00"
                value={servicePrice}
                onChangeText={setServicePrice}
                keyboardType="decimal-pad"
                leftIcon={<DollarSign size={20} color={Colors.neutral[500]} />}
              />

              <Input
                label="Duration *"
                placeholder="minutes"
                value={serviceDuration}
                onChangeText={setServiceDuration}
                leftIcon={<Clock size={20} color={Colors.neutral[500]} />}
              />

              <Input
                label="Description (Optional)"
                placeholder="Describe the service..."
                value={serviceDescription}
                onChangeText={setServiceDescription}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <Button
                title={currentService ? 'Update Service' : 'Add Service'}
                onPress={handleSaveService}
                style={styles.saveButton}
                loading={loading}
              />
            </ScrollView>
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
  scrollContainer: {
    flex: 1,
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
  headerSubtitle: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  addButton: {
    marginBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: Spacing.md,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  serviceDescription: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detailText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginLeft: 4,
  },
  actionButtons: {
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary[50],
  },
  deleteButton: {
    backgroundColor: Colors.error[50],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: Spacing.lg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
  // Reviews Section
  reviewsSection: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.sm,
  },
  ratingText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginLeft: Spacing.xxs,
  },
  noReviewsText: {
    fontFamily: Typography.families.regular,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
  reviewsList: {
    paddingBottom: Spacing.xl,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewUserImage: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  reviewUserPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[800],
  },
  reviewRating: {
    flexDirection: 'row',
    marginTop: Spacing.xxs,
  },
  reviewDeleteButton: {
    padding: Spacing.xs,
  },
  reviewComment: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  reviewDate: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[500],
    textAlign: 'right',
  },
});
