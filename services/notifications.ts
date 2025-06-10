import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/app/(tabs)/appointments';

// Configure how notifications should be handled when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Handle registration errors
function handleRegistrationError(errorMessage: string) {
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Register the device for push notifications
export async function registerForPushNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (!Device.isDevice) {
      handleRegistrationError(
        'Must use physical device for push notifications'
      );
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      handleRegistrationError(
        'Permission not granted to get push token for push notification!'
      );
      return null;
    }

    // Get the project ID from expo config
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      handleRegistrationError('Project ID not found');
      return null;
    }

    // Get the push token
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    console.log('Received push token:', token);
    return token;
  } catch (error) {
    handleRegistrationError(
      `Error during push notification registration: ${error}`
    );
    return null;
  }
}

// Save the push token to Supabase
export async function savePushToken(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) throw error;
    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// Send a push notification to a specific user
export async function sendPushNotification(
  to: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    const message = {
      to,
      sound: 'default',
      title,
      body,
      data,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// Listen for incoming notifications
export function setupNotificationListeners(navigation: any) {
  // Handle notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      // You can handle the notification here or show an alert
    }
  );

  // Handle notification taps
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);

      // Navigate based on notification data
      if (data?.type === 'appointment_update') {
        navigation.navigate('Appointments');
      }
    });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/////////////////////////
// sending 1-hour before reminder notification

export const scheduleReminderNotifications = async (
  appointments: Appointment[]
) => {
  try {
    const now = new Date();

    // Filter only confirmed appointments in the future
    const futureConfirmedAppointments = appointments.filter((appointment) => {
      const appointmentDateTime = new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      );
      return appointment.status === 'confirmed' && appointmentDateTime > now;
    });

    for (const appointment of futureConfirmedAppointments) {
      const appointmentDateTime = new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      );
      const reminderTime = new Date(
        appointmentDateTime.getTime() - 60 * 60 * 1000
      ); // 1 hour before

      if (reminderTime > now) {
        const timeUntilReminder = reminderTime.getTime() - now.getTime();

        setTimeout(async () => {
          try {
            // Get fresh profile data including push token
            const { data: profile } = await supabase
              .from('profiles')
              .select('push_token')
              .eq('id', appointment.profile_id)
              .single();

            if (profile?.push_token) {
              await sendPushNotification(
                profile.push_token,
                'Appointment Reminder',
                `You have an appointment with ${
                  appointment.barbers?.name
                } for ${appointment.services?.name} at ${formatTime(
                  appointment.appointment_time
                )}`,
                {
                  appointmentId: appointment.id,
                  type: 'reminder',
                }
              );
              console.log(`Sent reminder for appointment ${appointment.id}`);
            }
          } catch (error) {
            console.error('Error sending reminder:', error);
          }
        }, timeUntilReminder);

        console.log(
          `Scheduled reminder for ${appointment.id} at ${reminderTime}`
        );
      }
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};

// Properly formats your database time (17:30:00) to user-friendly format (5:30 PM)
const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const hourNum = parseInt(hours, 10);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};

////////////////////////////////
// for testing purposes, we will modify the reminder time to 1 minute instead of 1 hour
export const scheduleReminderNotifications2 = async (
  appointments: Appointment[]
) => {
  try {
    // Filter only confirmed appointments in the future (including those happening soon)
    const futureConfirmedAppointments = appointments.filter((appointment) => {
      const now = new Date();
      const appointmentDateTime = new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      );
      return appointment.status === 'confirmed' && appointmentDateTime > now;
    });

    // Schedule notifications for each appointment
    for (const appointment of futureConfirmedAppointments) {
      const appointmentDateTime = new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      );

      // TESTING MODIFICATION: Change from 1 hour to 1 minute
      // const reminderTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000); // Original (1 hour)
      const reminderTime = new Date(Date.now() + 60 * 1000); // TESTING: 1 minute from now

      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        const timeUntilReminder = reminderTime.getTime() - Date.now();

        setTimeout(async () => {
          try {
            if (
              appointment.profile_id &&
              appointment.barbers?.name &&
              appointment.services?.name
            ) {
              // Get the latest profile with push token
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('push_token')
                .eq('id', appointment.profile_id)
                .single();

              if (error) throw error;

              if (profile?.push_token) {
                const barberName = appointment.barbers.name;
                const serviceName = appointment.services.name;
                const formattedTime = formatTime(appointment.appointment_time);

                console.log('SENDING TEST REMINDER NOW...');

                await sendPushNotification(
                  profile.push_token,
                  'TEST REMINDER: Appointment Soon', // Modified title for testing
                  `TEST: You have an appointment with ${barberName} for ${serviceName} at ${formattedTime}`,
                  {
                    appointmentId: appointment.id,
                    type: 'test_reminder', // Modified type for testing
                  }
                );
              }
            }
          } catch (error) {
            console.error('Error sending test reminder:', error);
          }
        }, timeUntilReminder);

        console.log(
          `TEST: Scheduled reminder for appointment ${appointment.id} at ${reminderTime}`
        );
      }
    }
  } catch (error) {
    console.error('Error scheduling test reminders:', error);
  }
};
