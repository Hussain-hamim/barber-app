import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SERVICES, Service } from '@/constants/data';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react-native';

export default function ServicesScreen() {
  const router = useRouter();
  const { barberId, barberName } = useLocalSearchParams();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barberId) {
      return;
    }
    
    // Filter services by barber ID
    const filteredServices = SERVICES.filter(
      service => service.barberId === Number(barberId)
    );
    
    setServices(filteredServices);
    setLoading(false);
  }, [barberId]);

  const handleSelectService = (service: Service) => {
    router.push({
      pathname: '/booking',
      params: {
        barberId: barberId as string,
        barberName: barberName as string,
        serviceId: service.id.toString(),
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
      },
    });
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleSelectService(item)}
      activeOpacity={0.8}
    >
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription}>{item.description}</Text>
        
        <View style={styles.serviceDetails}>
          <View style={styles.serviceDetail}>
            <Clock size={16} color={Colors.neutral[500]} />
            <Text style={styles.detailText}>{item.duration}</Text>
          </View>
          
          <View style={styles.serviceDetail}>
            <DollarSign size={16} color={Colors.neutral[500]} />
            <Text style={styles.detailText}>{item.price}</Text>
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
          <Text style={styles.headerTitle}>
            Select a Service
          </Text>
          <Text style={styles.headerSubtitle}>
            {barberName as string}
          </Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No services available for this barber.</Text>
          </View>
        ) : (
          <FlatList
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
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