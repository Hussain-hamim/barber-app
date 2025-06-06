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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import { ArrowLeft, Clock, DollarSign, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string | null;
}

export default function ServicesScreen() {
  const router = useRouter();
  const { barberId, barberName } = useLocalSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [barber, setBarber] = useState<any>(null);

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
        const { data: servicesData, error } = await supabase
          .from('services')
          .select('id, name, price, duration, description')
          .eq('barber_id', barberId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setServices(servicesData || []);
        setBarber(barberData); // Add this state
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load services');
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

  // Format ISO duration (PT30M) to readable format (30 minutes)
  const formatDuration = (duration: string) => {
    if (!duration) return '';

    // Parse ISO 8601 duration format (e.g., PT30M)
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

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleSelectService(item)}
      activeOpacity={0.8}
    >
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.serviceDescription}>{item.description}</Text>
        )}

        <View style={styles.serviceDetails}>
          <View style={styles.serviceDetail}>
            <Clock size={16} color={Colors.neutral[500]} />
            <Text style={styles.detailText}>
              {formatDuration(item.duration)}
            </Text>
          </View>

          <View style={styles.serviceDetail}>
            <DollarSign size={16} color={Colors.neutral[500]} />
            <Text style={styles.detailText}>${item.price.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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

      <Text
        style={{
          fontFamily: Typography.families.semibold,
          fontSize: Typography.sizes.lg,
          color: Colors.neutral[800],
          paddingHorizontal: Spacing.md,
        }}
      >
        {barber.name} services
      </Text>

      <View style={styles.content}>
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No services available for this barber.
            </Text>
          </View>
        ) : (
          <FlatList
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
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
    paddingTop: Spacing.xl,
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
    paddingBottom: Spacing.xl,
  },
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  serviceDescription: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.md,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
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

  barberCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
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
