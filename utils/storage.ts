import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '@/constants/data';

// Favorites
export const toggleBarberFavorite = async (barberId: number): Promise<boolean> => {
  try {
    const favoritesString = await AsyncStorage.getItem('@favorites');
    let favorites: number[] = favoritesString ? JSON.parse(favoritesString) : [];
    
    const isCurrentlyFavorite = favorites.includes(barberId);
    
    if (isCurrentlyFavorite) {
      favorites = favorites.filter(id => id !== barberId);
    } else {
      favorites.push(barberId);
    }
    
    await AsyncStorage.setItem('@favorites', JSON.stringify(favorites));
    return !isCurrentlyFavorite; // Return new favorite state
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

export const getFavorites = async (): Promise<number[]> => {
  try {
    const favoritesString = await AsyncStorage.getItem('@favorites');
    return favoritesString ? JSON.parse(favoritesString) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Appointments
export const saveAppointment = async (appointment: Appointment): Promise<void> => {
  try {
    const appointmentsString = await AsyncStorage.getItem('@appointments');
    const appointments: Appointment[] = appointmentsString ? JSON.parse(appointmentsString) : [];
    
    appointments.push(appointment);
    
    await AsyncStorage.setItem('@appointments', JSON.stringify(appointments));
  } catch (error) {
    console.error('Error saving appointment:', error);
    throw error;
  }
};

export const getAppointments = async (): Promise<Appointment[]> => {
  try {
    const appointmentsString = await AsyncStorage.getItem('@appointments');
    return appointmentsString ? JSON.parse(appointmentsString) : [];
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
};

export const updateAppointment = async (
  appointmentId: string, 
  updates: Partial<Appointment>
): Promise<void> => {
  try {
    const appointmentsString = await AsyncStorage.getItem('@appointments');
    const appointments: Appointment[] = appointmentsString ? JSON.parse(appointmentsString) : [];
    
    const updatedAppointments = appointments.map(appointment => 
      appointment.id === appointmentId 
        ? { ...appointment, ...updates } 
        : appointment
    );
    
    await AsyncStorage.setItem('@appointments', JSON.stringify(updatedAppointments));
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Admin services
export const saveServices = async (services: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem('@services', JSON.stringify(services));
  } catch (error) {
    console.error('Error saving services:', error);
    throw error;
  }
};

export const getServices = async (): Promise<any[]> => {
  try {
    const servicesString = await AsyncStorage.getItem('@services');
    return servicesString ? JSON.parse(servicesString) : [];
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
};

// Admin barbers
export const saveBarbers = async (barbers: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem('@barbers', JSON.stringify(barbers));
  } catch (error) {
    console.error('Error saving barbers:', error);
    throw error;
  }
};

export const getBarbers = async (): Promise<any[]> => {
  try {
    const barbersString = await AsyncStorage.getItem('@barbers');
    return barbersString ? JSON.parse(barbersString) : [];
  } catch (error) {
    console.error('Error getting barbers:', error);
    return [];
  }
};

// For clearing all data (development purposes)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};