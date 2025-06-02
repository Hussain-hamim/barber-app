import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { ArrowLeft, User, BadgeInfo, Star } from 'lucide-react-native';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { BARBERS } from '@/constants/data';

export default function AddBarberScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [image, setImage] = useState('https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=600');
  const [about, setAbout] = useState('');
  const [rating, setRating] = useState('5.0');
  const [loading, setLoading] = useState(false);
  
  const handleSave = () => {
    // Validate form
    if (!name || !experience || !image) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, you would make an API call to create the barber
      
      Alert.alert(
        'Success',
        'Barber has been added successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
      
      setLoading(false);
    }, 1000);
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
            label="Profile Image URL"
            placeholder="https://example.com/image.jpg"
            value={image}
            onChangeText={setImage}
            keyboardType="url"
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
          
          <Button
            title="Save Barber"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
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
});