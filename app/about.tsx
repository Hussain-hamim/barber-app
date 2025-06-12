import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import {
  ArrowLeft,
  Globe,
  Instagram,
  Twitter,
  Mail,
  Phone,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();

  const openURL = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>HimalByte</Text>
          <Text style={styles.tagline}>Premium Barber Services</Text>
        </View>

        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.heroImage}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.sectionText}>
            Founded in 2025, HimalByte connects people with the best barbering
            experiences through our seamless booking platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            To revolutionize barbering by providing effortless booking,
            elevating service standards, and helping barbers grow.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureText}>• Easy online booking</Text>
            <Text style={styles.featureText}>• Verified top-rated barbers</Text>
            <Text style={styles.featureText}>
              • Personalized recommendations
            </Text>
            <Text style={styles.featureText}>• Secure in-app payments</Text>
            <Text style={styles.featureText}>• Loyalty rewards</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openURL('https://himalbyte.com')}
            >
              <Globe size={18} color={Colors.primary[600]} />
              <Text style={styles.socialText}>Website</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openURL('https://instagram.com/himalbyte')}
            >
              <Instagram size={18} color={Colors.primary[600]} />
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openURL('https://twitter.com/himalbyte')}
            >
              <Twitter size={18} color={Colors.primary[600]} />
              <Text style={styles.socialText}>Twitter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Mail size={16} color={Colors.neutral[600]} />
              <Text style={styles.contactText}>hello@himalbyte.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={16} color={Colors.neutral[600]} />
              <Text style={styles.contactText}>+1 (555) 123-4567</Text>
            </View>
          </View>
        </View>

        <Text style={styles.copyright}>© 2025 HimalByte Technologies</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontFamily: Typography.families.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.primary[700],
  },
  tagline: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  sectionText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    lineHeight: 20,
  },
  featureList: {
    marginLeft: Spacing.sm,
  },
  featureText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.xs,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    flex: 1,
    marginHorizontal: Spacing.xs,
    justifyContent: 'center',
  },
  socialText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[600],
    marginLeft: Spacing.xs,
  },
  contactInfo: {
    marginTop: Spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  contactText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginLeft: Spacing.sm,
  },
  copyright: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
