import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/theme';
import {
  ArrowLeft,
  User,
  BadgeInfo,
  Star,
  Image as ImageIcon,
} from 'lucide-react-native';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function AddBarberScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [about, setAbout] = useState('');
  const [rating, setRating] = useState('5.0');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    setUploading(true);
    try {
      // Request permissions first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please allow access to your photos to upload images'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64 = result.assets[0].base64;
        const fileExt =
          result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Math.random()
          .toString(36)
          .substring(2, 9)}.${fileExt}`;
        const filePath = `barber-profiles/${fileName}`;

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('barber-images')
          .upload(filePath, decode(base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('barber-images').getPublicUrl(filePath);

        setImageUri(publicUrl);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload image. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Validate form
    if (!name || !experience) {
      Alert.alert('Required Fields', 'Please fill in name and experience');
      return;
    }

    // if (!imageUri) {
    //   Alert.alert('Required', 'Please select a profile image');
    //   return;
    // }

    setLoading(true);

    try {
      // Insert new barber into Supabase
      const { data, error } = await supabase
        .from('barbers')
        .insert([
          {
            name,
            experience,
            image_url:
              'https://images.unsplash.com/photo-1519699047748-de8e457a634e',
            about: about || null,
            rating: rating ? parseFloat(rating) : null,
            is_active: true,
          },
        ])
        .select();

      if (error) throw error;

      Alert.alert('Success', 'Barber has been added successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('Error adding barber:', error);
      Alert.alert('Error', 'Failed to add barber. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Add New Barber</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Input
            label="Barber Name *"
            placeholder="Enter barber's full name"
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={Colors.neutral[500]} />}
          />

          <Input
            label="Experience *"
            placeholder="e.g., 5 years"
            value={experience}
            onChangeText={setExperience}
            leftIcon={<BadgeInfo size={20} color={Colors.neutral[500]} />}
          />

          <View style={styles.imageUploadContainer}>
            <Text style={styles.inputLabel}>Profile Image *</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <Button
                  title="Change Image"
                  onPress={pickImage}
                  variant="outline"
                  size="sm"
                  style={styles.changeImageButton}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imageUploadButton}
                onPress={pickImage}
              >
                {uploading ? (
                  <ActivityIndicator color={Colors.primary[600]} />
                ) : (
                  <>
                    <ImageIcon size={24} color={Colors.primary[600]} />
                    <Text style={styles.imageUploadText}>Select Image</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

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

          <Button
            title="Save Barber"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
            disabled={uploading}
          />
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
  saveButton: {
    marginTop: Spacing.lg,
  },
  imageUploadContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  imageUploadButton: {
    height: 120,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  imageUploadText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.primary[600],
    marginTop: Spacing.xs,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  changeImageButton: {
    alignSelf: 'center',
  },
});
