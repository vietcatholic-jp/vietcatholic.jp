/**
 * Permission service for avatar management
 * Handles authorization for registrant avatar operations
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { UserRole } from '@/lib/types';

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Admin roles that can manage all avatars
 */
const ADMIN_ROLES: UserRole[] = [
  'registration_manager',
  'event_organizer', 
  'regional_admin',
  'super_admin'
];

/**
 * Permission service for avatar management
 */
export class PermissionService {
  /**
   * Check if user can manage avatar for a specific registrant (client-side)
   */
  static async canManageAvatar(
    userId: string,
    registrantId: string
  ): Promise<PermissionResult> {
    try {
      const supabase = createClient();

      // Get user profile to check role
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !userProfile) {
        return {
          allowed: false,
          reason: 'User not found or unauthorized'
        };
      }

      // Admin users can manage all avatars
      if (this.isAdmin(userProfile.role)) {
        return { allowed: true };
      }

      // Regular users can only manage their own registrants
      const ownerUserId = await this.getRegistrantOwner(registrantId);
      if (!ownerUserId) {
        return {
          allowed: false,
          reason: 'Registrant not found'
        };
      }

      if (ownerUserId !== userId) {
        return {
          allowed: false,
          reason: 'User does not own this registrant'
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Permission check error:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * Check if user can manage avatar for a specific registrant (server-side)
   */
  static async canManageAvatarServer(
    userId: string,
    registrantId: string
  ): Promise<PermissionResult> {
    try {
      const supabase = await createServerClient();

      // Get user profile to check role
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !userProfile) {
        return {
          allowed: false,
          reason: 'User not found or unauthorized'
        };
      }

      // Admin users can manage all avatars
      if (this.isAdmin(userProfile.role)) {
        return { allowed: true };
      }

      // Regular users can only manage their own registrants
      const ownerUserId = await this.getRegistrantOwnerServer(registrantId);
      if (!ownerUserId) {
        return {
          allowed: false,
          reason: 'Registrant not found'
        };
      }

      if (ownerUserId !== userId) {
        return {
          allowed: false,
          reason: 'User does not own this registrant'
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Permission check error:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * Check if user role is admin
   */
  static isAdmin(userRole: UserRole): boolean {
    return ADMIN_ROLES.includes(userRole);
  }

  /**
   * Get the owner user ID of a registrant (client-side)
   */
  static async getRegistrantOwner(registrantId: string): Promise<string | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('registrants')
        .select(`
          registration_id,
          registrations!inner(user_id)
        `)
        .eq('id', registrantId)
        .single();

      if (error || !data) {
        console.error('Error fetching registrant owner:', error);
        return null;
      }

      return (data.registrations as unknown as { user_id: string }).user_id;
    } catch (error) {
      console.error('Error getting registrant owner:', error);
      return null;
    }
  }

  /**
   * Get the owner user ID of a registrant (server-side)
   */
  static async getRegistrantOwnerServer(registrantId: string): Promise<string | null> {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from('registrants')
        .select(`
          registration_id,
          registrations!inner(user_id)
        `)
        .eq('id', registrantId)
        .single();

      if (error || !data) {
        console.error('Error fetching registrant owner:', error);
        return null;
      }

      return (data.registrations as unknown as { user_id: string }).user_id;
    } catch (error) {
      console.error('Error getting registrant owner:', error);
      return null;
    }
  }

  /**
   * Get registrant details with owner information (client-side)
   */
  static async getRegistrantWithOwner(registrantId: string) {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('registrants')
        .select(`
          id,
          full_name,
          portrait_url,
          registration_id,
          registrations!inner(
            user_id,
            users!inner(
              id,
              full_name,
              role
            )
          )
        `)
        .eq('id', registrantId)
        .single();

      if (error || !data) {
        console.error('Error fetching registrant with owner:', error);
        return null;
      }

      return {
        registrant: {
          id: data.id,
          full_name: data.full_name,
          portrait_url: data.portrait_url,
        },
        owner: {
          id: (data.registrations as unknown as { users: { id: string; full_name: string; role: string } }).users.id,
          full_name: (data.registrations as unknown as { users: { id: string; full_name: string; role: string } }).users.full_name,
          role: (data.registrations as unknown as { users: { id: string; full_name: string; role: string } }).users.role,
        }
      };
    } catch (error) {
      console.error('Error getting registrant with owner:', error);
      return null;
    }
  }

  /**
   * Get registrant details with owner information (server-side)
   */
  static async getRegistrantWithOwnerServer(registrantId: string) {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from('registrants')
        .select(`
          id,
          full_name,
          portrait_url,
          registration_id,
          registrations!inner(
            user_id,
            users!inner(
              id,
              full_name,
              role
            )
          )
        `)
        .eq('id', registrantId)
        .single();

      if (error || !data) {
        console.error('Error fetching registrant with owner:', error);
        return null;
      }

      return {
        registrant: {
          id: data.id,
          full_name: data.full_name,
          portrait_url: data.portrait_url,
        },
        owner: {
          id: (data.registrations as unknown as { users: { id: string; full_name: string; role: string } }).users.id,
          full_name: (data.registrations as unknown as { users: { id: string; full_name: string; role: string } }).users.full_name,
          role: (data.registrations as unknown as { users: { id: string; full_name: string; role: string } }).users.role,
        }
      };
    } catch (error) {
      console.error('Error getting registrant with owner:', error);
      return null;
    }
  }

  /**
   * Check if current user can manage a registrant (convenience method for client-side)
   */
  static async canCurrentUserManageRegistrant(registrantId: string): Promise<PermissionResult> {
    try {
      const supabase = createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return {
          allowed: false,
          reason: 'User not authenticated'
        };
      }

      return await this.canManageAvatar(user.id, registrantId);
    } catch (error) {
      console.error('Current user permission check error:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * Validate registrant exists and return basic info
   */
  static async validateRegistrant(registrantId: string, isServer: boolean = false) {
    try {
      const supabase = isServer ? await createServerClient() : createClient();

      const { data, error } = await supabase
        .from('registrants')
        .select('id, full_name, portrait_url')
        .eq('id', registrantId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Registrant validation error:', error);
      return null;
    }
  }
}