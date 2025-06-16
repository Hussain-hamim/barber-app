import React, { useEffect, useState, useCallback } from 'react';
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
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import { Heart, Search, Plus, Star, X } from 'lucide-react-native';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { getFavorites, toggleBarberFavorite } from '@/utils/favorites';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import ModernLoadingIndicator from '@/components/ModernLoadingIndicator';

const { height, width } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.48;
const CARD_MARGIN = Spacing.md;

interface Barber {
  id: string;
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
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const isAdmin = profile?.is_admin;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (session?.user?.id) {
        const dbFavorites = await getFavorites(session.user.id);
        setFavorites(dbFavorites);

        const { data: barbersData, error } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const barbersWithFavorites =
          barbersData?.map((barber) => ({
            ...barber,
            isFavorite: dbFavorites.includes(barber.id),
          })) || [];

        setBarbers(barbersWithFavorites);
        setFilteredBarbers(barbersWithFavorites);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh barbers data');
    } finally {
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

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
        setLoading(true);

        if (session?.user?.id) {
          const dbFavorites = await getFavorites(session.user.id);
          setFavorites(dbFavorites);

          const { data: barbersData, error } = await supabase
            .from('barbers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const barbersWithFavorites =
            barbersData?.map((barber) => ({
              ...barber,
              isFavorite: dbFavorites.includes(barber.id),
            })) || [];

          setBarbers(barbersWithFavorites);
          setFilteredBarbers(barbersWithFavorites);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load barbers data');
      }
    };

    loadData();
  }, [session]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBarbers(barbers);
    } else {
      const filtered = barbers.filter(
        (barber) =>
          barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          barber.about?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBarbers(filtered);
    }
  }, [searchQuery, barbers]);

  const handleToggleFavorite = async (barberId: string) => {
    if (!session?.user?.id) return;

    try {
      const newFavoriteState = await toggleBarberFavorite(
        session.user.id,
        barberId
      );

      setBarbers((prevBarbers) =>
        prevBarbers.map((barber) =>
          barber.id === barberId
            ? { ...barber, isFavorite: newFavoriteState }
            : barber
        )
      );

      setFilteredBarbers((prevBarbers) =>
        prevBarbers.map((barber) =>
          barber.id === barberId
            ? { ...barber, isFavorite: newFavoriteState }
            : barber
        )
      );

      setFavorites((prevFavorites) =>
        newFavoriteState
          ? [...prevFavorites, barberId]
          : prevFavorites.filter((id) => id !== barberId)
      );
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

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
      Keyboard.dismiss();
    }
  };

  const renderBarberItem = ({ item }: { item: Barber }) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <TouchableOpacity
        style={[
          styles.cardContainer,
          { height: CARD_HEIGHT, paddingBottom: isAdmin ? 60 : 5 },
        ]}
        onPress={() => navigateToServiceDetails(item)}
        activeOpacity={0.9}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: item.image_url || 'https://via.placeholder.com/150',
            }}
            style={styles.fullWidthImage}
            resizeMode="cover"
          />
          {/* <View style={styles.imageOverlay}></View> */}

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

          {item.is_active === false && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Unavailable</Text>
            </View>
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
              <Text style={styles.ratingText}>
                {item.rating?.toFixed(1) || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.experienceBadge}>
              <Text style={styles.experienceText}>{item.experience}</Text>
            </View>

            {item.about && (
              <Text style={styles.aboutText} numberOfLines={2}>
                {item.about}
              </Text>
            )}
          </View>

          {isAdmin && (
            <View style={[styles.adminButtons]}>
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
                      barberAbout: item.about,
                      isActive: item.is_active?.toString(),
                    },
                  });
                }}
                size="sm"
                variant="outline"
                style={styles.adminButton}
              />
              <Button
                title="Services"
                onPress={(e) => {
                  e.stopPropagation();
                  navigateToServiceDetails(item);
                }}
                size="sm"
                style={styles.adminButton}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ModernLoadingIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        {searchVisible ? (
          <Animated.View
            style={styles.searchContainer}
            entering={FadeIn}
            exiting={FadeOut}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Search barbers..."
              placeholderTextColor={Colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity onPress={toggleSearch} style={styles.searchClose}>
              <X size={20} color={Colors.neutral[600]} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View>
            <Text style={styles.welcomeText}>
              {isAdmin
                ? 'Admin Dashboard'
                : 'Hello, ' + (profile?.name || 'there') + '!'}
            </Text>
            <Text style={styles.subtitleText}>
              {isAdmin
                ? 'Manage your barber shop'
                : 'Book your next appointment'}
            </Text>
          </View>
        )}

        {!isAdmin && (
          <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
            {searchVisible ? (
              <X size={24} color={Colors.neutral[700]} />
            ) : (
              <Search size={24} color={Colors.neutral[700]} />
            )}
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
          data={filteredBarbers}
          renderItem={renderBarberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No matching barbers found'
                  : 'No barbers available'}
              </Text>
            </View>
          }
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {keyboardVisible && !isAdmin && (
        <Animated.View
          style={styles.keyboardSpacer}
          entering={FadeIn}
          exiting={FadeOut}
        />
      )}
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    paddingVertical: Spacing.xs,
  },
  searchClose: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  listContainer: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
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
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  inactiveBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.error[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  inactiveBadgeText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.families.medium,
  },
  ratingText: {
    marginLeft: Spacing.sm,
    fontFamily: Typography.families.medium,
  },
  infoSection: {
    marginBottom: Spacing.sm,
  },
  experienceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  aboutText: {
    color: Colors.neutral[600],
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    lineHeight: 18,
  },
  adminButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  keyboardSpacer: {
    height: 20,
    backgroundColor: Colors.white,
  },
});
