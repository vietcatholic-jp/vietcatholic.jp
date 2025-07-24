"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventRole } from "@/lib/role-utils";

interface UseRolesReturn {
  roles: EventRole[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all event roles from the database
 */
export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<EventRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('event_roles')
        .select('*')
        .order('name');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setRoles(data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    isLoading,
    error,
    refetch: fetchRoles
  };
}

/**
 * Hook to get role options for form selects
 */
export function useRoleOptions() {
  const { roles, isLoading, error } = useRoles();

  const roleOptions = roles.map(role => ({
    value: role.id,
    label: role.name,
    description: role.description
  }));

  return {
    roleOptions,
    isLoading,
    error
  };
}

/**
 * Hook to find a specific role by ID
 */
export function useRole(roleId: string | null | undefined): {
  role: EventRole | null;
  isLoading: boolean;
  error: string | null;
} {
  const { roles, isLoading, error } = useRoles();

  const role = roleId ? roles.find(r => r.id === roleId) || null : null;

  return {
    role,
    isLoading,
    error
  };
}

// Server-side functions moved to separate file to avoid import issues
