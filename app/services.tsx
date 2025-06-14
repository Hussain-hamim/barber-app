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
  Image,
  TextInput,
  Modal,
  Pressable,
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
  Clock,
  DollarSign,
  Star,
  User,
  ChevronDown,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string | null;
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

export default function ServicesScreen() {
  const router = useRouter();
  const { barberId, barberName } = useLocalSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [barber, setBarber] = useState<any>(null);

  // Review modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!barberId) return;

      try {
        setLoading(true);

        // Fetch barber details along with services
        const { data: barberData } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', barberId)
          .single();

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price, duration, description')
          .eq('barber_id', barberId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        // Fetch reviews with user profiles
        const { data: reviewsData, error: reviewsError } = await supabase
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

        if (servicesError) throw servicesError;
        if (reviewsError) throw reviewsError;

        setServices(servicesData || []);
        setReviews(reviewsData || []);
        setBarber(barberData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [barberId]);

  const handleSelectService = (service: Service) => {
    router.push({
      pathname: '/booking',
      params: {
        barberId: barberId as string,
        barberName: barberName as string,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price.toString(),
        serviceDuration: formatDuration(service.duration),
      },
    });
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!matches) return duration;

    const hours = matches[1]
      ? `${matches[1]} hour${matches[1] === '1' ? '' : 's'}`
      : '';
    const minutes = matches[2]
      ? `${matches[2]} minute${matches[2] === '1' ? '' : 's'}`
      : '';

    return `${hours} ${minutes}`.trim();
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setReviewLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You need to be logged in to leave a review');
        return;
      }

      const { error } = await supabase.from('reviews').insert([
        {
          barber_id: barberId,
          user_id: user.id,
          rating,
          comment: reviewText,
        },
      ]);

      if (error) throw error;

      // Update barber rating
      await updateBarberRating();

      // Refresh reviews
      const { data: reviewsData } = await supabase
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

      setReviews(reviewsData || []);
      setModalVisible(false);
      setReviewText('');
      setRating(null);
      Alert.alert('Success', 'Thank you for your review!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const updateBarberRating = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_barber_rating', {
        barber_id: barberId,
      });

      if (error) throw error;

      if (data) {
        setBarber((prev: any) => ({ ...prev, rating: data }));
      }
    } catch (error) {
      console.error('Error updating barber rating:', error);
    }
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleSelectService(item)}
      activeOpacity={0.9}
    >
      <View style={styles.serviceContent}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.servicePrice}>${item.price.toFixed(2)}</Text>
        </View>

        {item.description && (
          <Text style={styles.serviceDescription}>{item.description}</Text>
        )}

        <View style={styles.serviceFooter}>
          <View style={styles.serviceDetail}>
            <Clock size={16} color={Colors.primary[600]} />
            <Text style={styles.detailText}>
              {formatDuration(item.duration)}
            </Text>
          </View>

          <View style={styles.serviceBookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
      {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Select a Service</Text>
          <Text style={styles.headerSubtitle}>{barberName as string}</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      {barber && (
        <View style={styles.barberCard}>
          <View style={styles.barberImageContainer}>
            <Image
              source={{
                uri: barber.image_url || 'https://via.placeholder.com/150',
              }}
              style={styles.barberImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.barberInfo}>
            <Text style={styles.barberName}>{barber.name}</Text>

            <View style={styles.barberMeta}>
              <View style={styles.barberRating}>
                <Star
                  size={16}
                  color={Colors.warning[500]}
                  fill={Colors.warning[500]}
                />
                <Text style={styles.barberRatingText}>
                  {barber.rating?.toFixed(1) || 'N/A'}
                </Text>
              </View>

              <View style={styles.barberExperience}>
                <Text style={styles.barberExperienceText}>
                  {barber.experience || 'Professional barber'}
                </Text>
              </View>
            </View>

            {barber.about && (
              <Text style={styles.barberAbout} numberOfLines={3}>
                {barber.about}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.content}>
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No services available for this barber.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={services}
              renderItem={renderServiceItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListFooterComponent={() => (
                <View style={styles.reviewsSection}>
                  <View style={styles.reviewsHeader}>
                    <Text style={styles.sectionTitle}>Customer Reviews</Text>
                    <Button
                      title="Add Review"
                      onPress={() => setModalVisible(true)}
                      style={styles.addReviewButton}
                      textStyle={styles.addReviewButtonText}
                    />
                  </View>

                  {reviews.length === 0 ? (
                    <Text style={styles.noReviewsText}>
                      No reviews yet. Be the first to review!
                    </Text>
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
              )}
            />

            {/* Reviews Section */}
          </>
        )}
      </View>

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Your Review</Text>

            {/* Rating Dropdown */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Rating:</Text>
              <Pressable
                style={styles.ratingDropdown}
                onPress={() => setShowRatingDropdown(!showRatingDropdown)}
              >
                <Text style={styles.ratingDropdownText}>
                  {rating
                    ? `${rating} star${rating !== 1 ? 's' : ''}`
                    : 'Select rating'}
                </Text>
                <ChevronDown size={20} color={Colors.neutral[600]} />
              </Pressable>

              {showRatingDropdown && (
                <View style={styles.ratingOptions}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Pressable
                      key={num}
                      style={styles.ratingOption}
                      onPress={() => {
                        setRating(num);
                        setShowRatingDropdown(false);
                      }}
                    >
                      <Text style={styles.ratingOptionText}>
                        {num} star{num !== 1 ? 's' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Review Text Input */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this barber..."
              placeholderTextColor={Colors.neutral[400]}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setReviewText('');
                  setRating(null);
                }}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
              <Button
                title="Submit Review"
                onPress={handleSubmitReview}
                loading={reviewLoading}
                disabled={reviewLoading || !rating}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary[100],
    ...Shadows.sm,
  },
  serviceContent: {
    padding: Spacing.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.primary[700],
    flex: 1,
  },
  servicePrice: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.primary[600],
    marginLeft: Spacing.sm,
  },
  serviceDescription: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginLeft: 4,
  },
  serviceBookButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  bookButtonText: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.sm,
    color: Colors.white,
  },

  // Enhanced review card styles:
  reviewCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
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
    backgroundColor: Colors.neutral[200],
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
  reviewUserName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.base,
    color: Colors.neutral[800],
    marginRight: 'auto',
  },
  reviewRating: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },
  reviewComment: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
    lineHeight: 20,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  reviewDate: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[500],
    textAlign: 'right',
  },

  // Section headers:
  sectionHeader: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.primary[700],
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  sectionSubheader: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },

  /////////////////////////////////
  reviewsSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  addReviewButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary[100],
    borderRadius: Radius.sm,
  },
  addReviewButtonText: {
    color: Colors.primary[600],
    fontSize: Typography.sizes.sm,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalTitle: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  ratingLabel: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  ratingDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  ratingDropdownText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
  },
  ratingOptions: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  ratingOption: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  ratingOptionText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
  },
  reviewInput: {
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[800],
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: Colors.neutral[100],
    flex: 1,
    marginRight: Spacing.sm,
  },
  cancelButtonText: {
    color: Colors.neutral[700],
  },

  ///////////////////////////////////////
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
    paddingTop: 10,
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
    paddingHorizontal: Spacing.md,
    // paddingTop: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

  serviceInfo: {
    flex: 1,
  },

  serviceDetails: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },

  barberCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  barberImageContainer: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  barberImage: {
    width: '100%',
    height: '100%',
  },
  barberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  barberName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  barberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  barberRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
  },
  barberRatingText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    marginLeft: 4,
  },
  barberExperience: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  barberExperienceText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[600],
  },
  barberAbout: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    lineHeight: 18,
  },
});
