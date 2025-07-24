import { createClient } from "@/lib/supabase/server";
import { EventRole } from "@/lib/role-utils";

/**
 * Server-side function to fetch all roles from database
 */
export async function fetchRolesServer(): Promise<EventRole[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('event_roles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching roles on server:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRolesServer:', error);
    return [];
  }
}

/**
 * Server-side function to get role by ID
 */
export async function fetchRoleByIdServer(roleId: string): Promise<EventRole | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('event_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) {
      console.error('Error fetching role by ID on server:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchRoleByIdServer:', error);
    return null;
  }
}

/**
 * Server-side function to get role options for forms
 */
export async function fetchRoleOptionsServer(): Promise<Array<{value: string, label: string, description?: string}>> {
  const roles = await fetchRolesServer();
  return roles.map(role => ({
    value: role.id,
    label: role.name,
    description: role.description || undefined
  }));
}
