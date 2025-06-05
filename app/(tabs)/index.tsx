import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
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
import { getFavorites, toggleBarberFavorite } from '@/utils/storage';
import { Heart, Search, Plus, Star } from 'lucide-react-native';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';

const { height, width } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.48;
const CARD_MARGIN = Spacing.md;

interface Barber {
  id: string; // Changed from number to string since Supabase uses UUID
  name: string;
  experience: string;
  image_url: string;
  rating: number;
  about?: string;
  is_active?: boolean;
  isFavorite?: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // Changed to string[] for UUID
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const isAdmin = profile?.is_admin;

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      console.log('Session new:', session);

      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data || null);
      }
    };
    fetchUser();

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load favorites from storage
        const storedFavorites = await getFavorites();
        // setFavorites(storedFavorites);

        // Fetch barbers from Supabase
        const { data: barbersData, error } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Merge with favorites data
        const barbersWithFavorites =
          barbersData?.map((barber) => ({
            ...barber,
            isFavorite: storedFavorites.includes(barber.id),
            image: barber.image_url, // Map to match your existing component props
          })) || [];

        setBarbers(barbersWithFavorites);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load barbers data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleFavorite = async (barberId: string) => {
    try {
      const newFavoriteState = await toggleBarberFavorite(parseInt(barberId));

      setBarbers(
        barbers.map((barber) =>
          barber.id === barberId
            ? { ...barber, isFavorite: newFavoriteState }
            : barber
        )
      );

      if (newFavoriteState) {
        setFavorites([...favorites, barberId]);
      } else {
        setFavorites(favorites.filter((id) => id !== barberId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const navigateToServiceDetails = (barber: Barber) => {
    if (isAdmin) {
      router.push({
        pathname: '/admin/services',
        params: { barberId: barber.id },
      });
    } else {
      router.push({
        pathname: '/services',
        params: {
          barberId: barber.id,
          barberName: barber.name,
        },
      });
    }
  };

  const renderBarberItem = ({ item }: { item: Barber }) => (
    <TouchableOpacity
      style={[styles.cardContainer, { height: CARD_HEIGHT }]}
      onPress={() => navigateToServiceDetails(item)}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
          style={styles.fullWidthImage}
          resizeMode="cover"
        />
        {!isAdmin && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(item.id);
            }}
          >
            <Heart
              size={24}
              color={item.isFavorite ? Colors.error[500] : Colors.white}
              fill={item.isFavorite ? Colors.error[500] : 'none'}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.detailsWrapper}>
        <View style={styles.nameRatingRow}>
          <Text style={styles.barberName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.ratingBox}>
            <Star
              size={16}
              color={Colors.warning[500]}
              fill={Colors.warning[500]}
            />
            <Text>{item.rating?.toFixed(1) || 'N/A'}</Text>
          </View>
        </View>

        <Text style={styles.experienceText} numberOfLines={2}>
          {item.experience}
        </Text>

        {isAdmin && (
          <View style={styles.adminButtons}>
            <Button
              title="Edit"
              onPress={(e: any) => {
                e.stopPropagation();
                router.push({
                  pathname: '/admin/edit-barber',
                  params: {
                    barberId: item.id,
                    barberName: item.name,
                    barberImage: item.image_url,
                    barberExperience: item.experience,
                    barberRating: item.rating?.toString(),
                  },
                });
              }}
              size="sm"
              variant="outline"
            />
            <Button
              title="Services"
              onPress={(e) => {
                e.stopPropagation();
                navigateToServiceDetails(item);
              }}
              size="sm"
            />
          </View>
        )}
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
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            {isAdmin
              ? 'Admin Dashboard'
              : 'Hello, ' + (profile?.name || 'there') + '!'}
          </Text>
          <Text style={styles.subtitleText}>
            {isAdmin ? 'Manage your barber shop' : 'Book your next appointment'}
          </Text>
        </View>

        {!isAdmin && (
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color={Colors.neutral[700]} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isAdmin ? 'Manage Barbers' : 'Our Barbers'}
          </Text>

          {isAdmin && (
            <Button
              title="Add Barber"
              onPress={() => router.push('/admin/add-barber')}
              size="sm"
              leftIcon={<Plus size={18} color={Colors.white} />}
            />
          )}
        </View>

        <FlatList
          data={barbers}
          renderItem={renderBarberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          // snapToInterval={CARD_HEIGHT + CARD_MARGIN}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No barbers available</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  welcomeText: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.neutral[800],
  },
  subtitleText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  cardContainer: {
    width: '100%',
    marginBottom: CARD_MARGIN,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  imageWrapper: {
    height: '60%',
    width: '100%',
    position: 'relative',
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
  },
  detailsWrapper: {
    height: '40%',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  nameRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  barberName: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
    flex: 1,
    marginRight: Spacing.sm,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  experienceText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  adminButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: Radius.full,
    padding: Spacing.xs,
  },
});
