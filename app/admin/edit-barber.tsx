import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import { ArrowLeft, User, BadgeInfo, Star } from 'lucide-react-native';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';

interface Barber {
  id: number;
  name: string;
  experience: string;
  image: string;
  about?: string;
  rating?: number;
  created_at: string;
}

export default function EditBarberScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams();

  const [barber, setBarber] = useState<Barber | null>(null);
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [about, setAbout] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchBarber = async () => {
      if (!barberId) return;

      try {
        setInitialLoading(true);

        const { data, error } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', barberId)
          .single();

        if (error) throw error;

        if (data) {
          setBarber(data);
          setName(data.name);
          setExperience(data.experience);
          setAbout(data.about || '');
          setRating(data.rating?.toString() || '');
        }
      } catch (error) {
        console.error('Error fetching barber:', error);
        Alert.alert('Error', 'Failed to load barber details');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBarber();
  }, [barberId]);

  const handleUpdate = async () => {
    // Validate form
    if (!name || !experience) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }

    if (!barberId) {
      Alert.alert('Error', 'No barber selected');
      return;
    }

    setLoading(true);

    try {
      const updates = {
        name,
        experience,
        about: about || null,
        rating: rating ? parseFloat(rating) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('barbers')
        .update(updates)
        .eq('id', barberId);

      if (error) throw error;

      Alert.alert('Success', 'Barber has been updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (error) {
      console.error('Error updating barber:', error);
      Alert.alert('Error', 'Failed to update barber');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!barberId) {
      Alert.alert('Error', 'No barber selected');
      return;
    }

    Alert.alert(
      'Delete Barber',
      'Are you sure you want to delete this barber? This action cannot be undone.',
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
                .from('barbers')
                .delete()
                .eq('id', barberId);

              if (error) throw error;

              router.replace('/(tabs)');
            } catch (error) {
              console.error('Error deleting barber:', error);
              Alert.alert('Error', 'Failed to delete barber');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  if (!barber) {
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
            <Text style={styles.headerTitle}>Edit Barber</Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Barber not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.lg }}
          />
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
          <Text style={styles.headerTitle}>Edit Barber</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Input
            label="Barber Name"
            placeholder="Enter barber's full name"
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={Colors.neutral[500]} />}
          />

          <Input
            label="Experience"
            placeholder="e.g., 5 years"
            value={experience}
            onChangeText={setExperience}
            leftIcon={<BadgeInfo size={20} color={Colors.neutral[500]} />}
          />

          <Input
            label="About"
            placeholder="Write a short bio about the barber"
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Input
            label="Rating (Optional)"
            placeholder="e.g., 4.5"
            value={rating}
            onChangeText={setRating}
            keyboardType="decimal-pad"
            leftIcon={<Star size={20} color={Colors.neutral[500]} />}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Update Barber"
              onPress={handleUpdate}
              loading={loading}
              style={styles.updateButton}
            />

            <Button
              title="Delete Barber"
              onPress={handleDelete}
              variant="outline"
              style={styles.deleteButton}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  updateButton: {},
  deleteButton: {
    borderColor: Colors.error[500],
  },
  deleteButtonText: {
    color: Colors.error[500],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
});
