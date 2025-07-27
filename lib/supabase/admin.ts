import { createClient, UserIdentity } from '@supabase/supabase-js';
import { Database } from '../types';

// Admin client with service role key for server-side operations
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Helper function to get user auth identities
export async function getUserAuthIdentities(userId: string) {
  const adminClient = createAdminClient();
  
  try {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('Error fetching user auth identities:', error);
      return [];
    }

    return data.user?.identities || [];
  } catch (error) {
    console.error('Error in getUserAuthIdentities:', error);
    return [];
  }
}

// Helper function to get multiple users' auth identities
export async function getMultipleUsersAuthIdentities(userIds: string[]) {
  const adminClient = createAdminClient();
  const results: Record<string, UserIdentity[]> = {};
  
  try {
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (userId) => {
        try {
          const { data, error } = await adminClient.auth.admin.getUserById(userId);
          if (!error && data.user) {
            results[userId] = data.user.identities || [];
          } else {
            results[userId] = [];
          }
        } catch (error) {
          console.error(`Error fetching identities for user ${userId}:`, error);
          results[userId] = [];
        }
      });
      
      await Promise.all(promises);
    }
    
    return results;
  } catch (error) {
    console.error('Error in getMultipleUsersAuthIdentities:', error);
    return {};
  }
}
