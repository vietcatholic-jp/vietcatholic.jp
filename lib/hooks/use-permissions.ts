"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
// Note: We'll need to implement client-side getCurrentUser

export interface Permission {
  [key: string]: boolean;
}

export interface UserPermissions {
  permissions: Permission;
  roles: Array<{
    id: string;
    name: string;
    description: string;
    permissions: Permission;
  }>;
  loading: boolean;
  error: string | null;
}

export function usePermissions(): UserPermissions {
  const [permissions, setPermissions] = useState<Permission>({});
  const [roles, setRoles] = useState<UserPermissions['roles']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserPermissions() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        
        // Get current user from Supabase client
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setPermissions({});
          setRoles([]);
          return;
        }
        
        // Get user's roles and their permissions
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            role_id,
            roles!inner (
              id,
              name,
              description,
              permissions
            )
          `)
          .eq('user_id', user.id);

        if (rolesError) {
          throw new Error(rolesError.message);
        }

        // Extract roles data
        const rolesData = userRoles?.map(ur => ur.roles).filter(Boolean) || [];
        setRoles(rolesData);

        // Aggregate all permissions from all roles
        const aggregatedPermissions: Permission = {};
        
        rolesData.forEach(role => {
          if (role.permissions) {
            Object.entries(role.permissions).forEach(([key, value]) => {
              if (value === true) {
                aggregatedPermissions[key] = true;
              }
            });
          }
        });

        setPermissions(aggregatedPermissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
        setPermissions({});
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUserPermissions();
  }, []);

  return {
    permissions,
    roles,
    loading,
    error
  };
}

export function useHasPermission(permissionKey: string): boolean {
  const { permissions, loading } = usePermissions();

  if (loading) return false;

  // Check for wildcard permission
  if (permissions['*']) return true;

  // Check for exact permission match
  if (permissions[permissionKey]) return true;

  // Check for wildcard pattern match (e.g., "events.*" matches "events.edit")
  for (const [key, value] of Object.entries(permissions)) {
    if (value && key.endsWith('.*')) {
      const pattern = key.replace('.*', '');
      if (permissionKey.startsWith(pattern + '.')) {
        return true;
      }
    }
  }

  return false;
}

// Utility function to check multiple permissions (AND logic)
export function useHasAllPermissions(permissionKeys: string[]): boolean {
  const { permissions, loading } = usePermissions();

  if (loading) return false;

  return permissionKeys.every(key => {
    // Check for wildcard permission
    if (permissions['*']) return true;

    // Check for exact permission match
    if (permissions[key]) return true;

    // Check for wildcard pattern match
    for (const [permKey, value] of Object.entries(permissions)) {
      if (value && permKey.endsWith('.*')) {
        const pattern = permKey.replace('.*', '');
        if (key.startsWith(pattern + '.')) {
          return true;
        }
      }
    }

    return false;
  });
}

// Utility function to check if user has any of the given permissions (OR logic)
export function useHasAnyPermission(permissionKeys: string[]): boolean {
  const { permissions, loading } = usePermissions();

  if (loading) return false;

  return permissionKeys.some(key => {
    // Check for wildcard permission
    if (permissions['*']) return true;

    // Check for exact permission match
    if (permissions[key]) return true;

    // Check for wildcard pattern match
    for (const [permKey, value] of Object.entries(permissions)) {
      if (value && permKey.endsWith('.*')) {
        const pattern = permKey.replace('.*', '');
        if (key.startsWith(pattern + '.')) {
          return true;
        }
      }
    }

    return false;
  });
}