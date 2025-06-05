import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ScrollView,
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
import {
  Bell,
  Globe,
  ShieldCheck,
  CircleHelp as HelpCircle,
  Info,
  ChevronRight,
  Trash,
} from 'lucide-react-native';
import { clearAllData } from '@/utils/storage';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const router = useRouter();
  const user = { isAdmin: true };

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your appointments and preferences. This action cannot be undone. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showSwitch,
    switchValue,
    onSwitchValueChange,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchValueChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemIcon}>{icon}</View>

      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>

      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchValueChange}
          trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
          thumbColor={Colors.white}
        />
      ) : (
        onPress && <ChevronRight size={20} color={Colors.neutral[400]} />
      )}
    </TouchableOpacity>
  );

  const SettingsSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <SettingsSection title="Account">
          <SettingsItem
            icon={<ShieldCheck size={22} color={Colors.primary[600]} />}
            title="Privacy Settings"
            subtitle="Manage your data and privacy"
            onPress={() => {
              /* Navigate to privacy settings */
              // router.push('/admin/services');
            }}
          />

          {user?.isAdmin && (
            <SettingsItem
              icon={<Globe size={22} color={Colors.primary[600]} />}
              title="Admin Dashboard"
              subtitle="Manage your barber shop"
              onPress={() => {
                /* Navigate to admin dashboard */
              }}
            />
          )}
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsItem
            icon={<Bell size={22} color={Colors.primary[600]} />}
            title="Push Notifications"
            subtitle="Get updates about your appointments"
            showSwitch
            switchValue={notifications}
            onSwitchValueChange={setNotifications}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsItem
            icon={<HelpCircle size={22} color={Colors.primary[600]} />}
            title="Help Center"
            subtitle="Get help with your account"
            onPress={() => {
              /* Navigate to help center */
            }}
          />

          <SettingsItem
            icon={<Info size={22} color={Colors.primary[600]} />}
            title="About Us"
            subtitle="Learn more about HimalByte"
            onPress={() => {
              /* Navigate to about us */
            }}
          />
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsItem
            icon={<Trash size={22} color={Colors.error[600]} />}
            title="Clear All Data"
            subtitle="Reset all your appointments and preferences"
            onPress={handleClearData}
          />
        </SettingsSection>
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.xl,
    color: Colors.neutral[800],
  },
  content: {
    flex: 1,
  },
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
  },
  settingsItemSubtitle: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
});
