// @/utils/favorites.ts
import { supabase } from '@/lib/supabase';

export const getFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('barber_id')
    .eq('profile_id', userId);

  if (error) throw error;
  return data.map((fav) => fav.barber_id);
};

export const toggleBarberFavorite = async (
  userId: string,
  barberId: string
) => {
  // First check if favorite exists
  const { data: existing, error: checkError } = await supabase
    .from('favorites')
    .select('id')
    .eq('profile_id', userId)
    .eq('barber_id', barberId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // Ignore "no rows found" error
    throw checkError;
  }

  if (existing) {
    // Remove favorite
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (deleteError) throw deleteError;
    return false;
  } else {
    // Add favorite
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({ profile_id: userId, barber_id: barberId });

    if (insertError) throw insertError;
    return true;
  }
};

/////////////////////////////

// Get favorite barbers for a user
export const getFavoriteBarbers = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(
      `
      barber:barbers (
        id,
        name,
        image_url,
        experience,
        rating,
        about
      )
    `
    )
    .eq('profile_id', userId);

  if (error) throw error;
  return data.map((item) => item.barber);
};

// Toggle favorite status
export const toggleFavorite = async (userId: string, barberId: string) => {
  // Check if already favorited
  const { data: existing, error: checkError } = await supabase
    .from('favorites')
    .select('id')
    .eq('profile_id', userId)
    .eq('barber_id', barberId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // Ignore "no rows found" error
    throw checkError;
  }

  if (existing) {
    // Remove favorite
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (deleteError) throw deleteError;
    return false;
  } else {
    // Add favorite
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({ profile_id: userId, barber_id: barberId });

    if (insertError) throw insertError;
    return true;
  }
};
