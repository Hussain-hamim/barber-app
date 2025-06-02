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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { BARBERS, Barber } from '@/constants/data';
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

const { height, width } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.48;
const CARD_MARGIN = Spacing.md;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedFavorites = await getFavorites();
        setFavorites(storedFavorites);

        const barbersWithFavorites = BARBERS.map((barber) => ({
          ...barber,
          isFavorite: storedFavorites.includes(barber.id),
        }));

        setBarbers(barbersWithFavorites);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleFavorite = async (barberId: number) => {
    try {
      const newFavoriteState = await toggleBarberFavorite(barberId);

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
    }
  };

  const navigateToServiceDetails = (barber: Barber) => {
    // This now works correctly for both admin and regular users
    if (isAdmin) {
      router.push({
        pathname: '/admin/services',
        params: { barberId: barber.id.toString() },
      });
    } else {
      router.push({
        pathname: '/services',
        params: {
          barberId: barber.id.toString(),
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
      {/* Full-width image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.image }}
          style={styles.fullWidthImage}
          resizeMode="cover"
        />
        {!isAdmin && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the card press
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

      {/* Details section */}
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
            <Text style={styles.ratingText}>
              {item.rating?.toFixed(1) || 'N/A'}
            </Text>
          </View>
        </View>

        <Text style={styles.experienceText} numberOfLines={2}>
          {item.experience}
        </Text>

        {isAdmin && (
          <View style={styles.adminButtons}>
            <Button
              title="Edit"
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: '/admin/edit-barber',
                  params: {
                    barberId: item.id.toString(),
                    barberName: item.name,
                    barberImage: item.image,
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

  // ... keep your existing styles

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
        <View>
          <Text style={styles.welcomeText}>
            {isAdmin
              ? 'Admin Dashboard'
              : 'Hello, ' + (user?.name || 'there') + '!'}
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
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          snapToInterval={CARD_HEIGHT + CARD_MARGIN}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
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
