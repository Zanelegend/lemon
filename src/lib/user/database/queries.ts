import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { USERS_TABLE } from '~/lib/db-tables';

/**
 * Retrieves a user from the Supabase database based on the provided user ID.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {string} userId - The ID of the user to retrieve.
 */
export function getUserById(client: SupabaseClient<Database>, userId: string) {
  return client
    .from(USERS_TABLE)
    .select(
      `
      id,
      displayName: display_name,
      photoUrl: photo_url,
      onboarded
    `,
    )
    .eq('id', userId)
    .maybeSingle();
}
