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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react-native';
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

  useEffect(() => {
    const fetchServices = async () => {
      if (!barberId) return;

      try {
        setLoading(true);

        // Fetch active services for this barber from Supabase
        const { data, error } = await supabase
          .from('services')
          .select('id, name, price, duration, description')
          .eq('barber_id', barberId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        Alert.alert('Error', 'Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
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
    paddingHorizontal: Spacing.xl,
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
});
