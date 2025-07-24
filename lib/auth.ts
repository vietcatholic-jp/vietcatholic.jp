import { createClient } from './supabase/client';
import { createClient as createServerClient } from './supabase/server';
import { User, UserRole, RegionType } from './types';

// Client-side auth utilities
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthError(error.message, error.message);
  }

  return data;
}

export async function signUpWithEmail(
  email: string, 
  password: string, 
  fullName: string,
  region: RegionType,
  role: UserRole
) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        region,
        role,
      },
    },
  });

  if (error) {
    throw new AuthError(error.message, error.message);
  }

  return data;
}

export async function signInWithGoogle() {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new AuthError(error.message, error.message);
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new AuthError(error.message, error.message);
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });

  if (error) {
    throw new AuthError(error.message, error.message);
  }
}

export async function updatePassword(password: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new AuthError(error.message, error.message);
  }
}

export async function getCurrentUser() {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new AuthError(error.message, error.message);
  }

  return user;
}

export async function getUserProfile(userId?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from('users')
    .select('*');

  if (userId) {
    query = query.eq('id', userId);
  } else {
    const user = await getCurrentUser();
    if (!user) throw new AuthError('No authenticated user');
    query = query.eq('id', user.id);
  }

  const { data, error } = await query.single();
  
  if (error) {
    throw new AuthError(error.message, error.message);
  }

  return data;
}

export async function updateUserProfile(updates: Partial<User>) {
  const supabase = createClient();
  const user = await getCurrentUser();
  
  if (!user) throw new AuthError('No authenticated user');

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    throw new AuthError(error.message, error.message);
  }

  return data;
}

// Server-side auth utilities
export async function getServerUser() {
  const supabase = await createServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return null;
  }

  return user;
}

export async function getServerUserProfile() {
  const supabase = await createServerClient();
  const user = await getServerUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
	console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function requireAuth() {
  const user = await getServerUser();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }

  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getServerUserProfile();
  
  if (!profile) {
    throw new AuthError('Authentication required');
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new AuthError('Insufficient permissions');
  }

  return profile;
}

export async function requireRegion(region?: RegionType) {
  const profile = await getServerUserProfile();
  
  if (!profile) {
    throw new AuthError('Authentication required');
  }

  // Super admins can access any region
  if (profile.role === 'super_admin') {
    return profile;
  }

  // Regional admins can only access their own region
  if (profile.role === 'regional_admin' && region && profile.region !== region) {
    throw new AuthError('Insufficient permissions for this region');
  }

  return profile;
}

// Admin-specific functions for bypassing RLS
export async function getAdminUsers(region?: RegionType) {
  const profile = await getServerUserProfile();
  
  if (!profile || !['super_admin', 'regional_admin'].includes(profile.role)) {
    throw new AuthError('Admin access required');
  }

  const supabase = await createServerClient();
  
  let query = supabase
    .from('users')
    .select('*');

  // Super admins can see all users, regional admins only their region
  if (profile.role === 'regional_admin') {
    query = query.eq('region', profile.region);
  } else if (region) {
    query = query.eq('region', region);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching admin users:', error);
    throw new AuthError('Failed to fetch users');
  }

  return data;
}

export async function getAdminRegistrations(region?: RegionType) {
  const profile = await getServerUserProfile();
  
  if (!profile || !['super_admin', 'regional_admin'].includes(profile.role)) {
    throw new AuthError('Admin access required');
  }

  const supabase = await createServerClient();
  
  let query = supabase
    .from('registrations')
    .select(`
      *,
      users!inner(id, email, full_name, region),
      registrants(*)
    `);

  // Super admins can see all registrations, regional admins only their region
  if (profile.role === 'regional_admin') {
    query = query.eq('users.region', profile.region);
  } else if (region) {
    query = query.eq('users.region', region);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching admin registrations:', error);
    throw new AuthError('Failed to fetch registrations');
  }

  return data;
}

// New permission-based auth functions
export async function requirePermission(permissionKey: string) {
  const user = await getServerUser();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }

  const supabase = await createServerClient();
  
  // Use the database function to check permission
  const { data, error } = await supabase
    .rpc('user_has_permission', {
      user_uuid: user.id,
      permission_key: permissionKey
    });

  if (error) {
    console.error('Error checking permission:', error);
    throw new AuthError('Permission check failed');
  }

  if (!data) {
    throw new AuthError(`Insufficient permissions: ${permissionKey}`);
  }

  return user;
}

export async function hasPermission(permissionKey: string, userId?: string): Promise<boolean> {
  try {
    const user = userId ? { id: userId } : await getServerUser();
    
    if (!user) {
      return false;
    }

    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .rpc('user_has_permission', {
        user_uuid: user.id,
        permission_key: permissionKey
      });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasPermission:', error);
    return false;
  }
}

export async function getUserPermissions(userId?: string) {
  try {
    const user = userId ? { id: userId } : await getServerUser();
    
    if (!user) {
      return {};
    }

    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .rpc('get_user_permissions', {
        user_uuid: user.id
      });

    if (error) {
      console.error('Error getting user permissions:', error);
      return {};
    }

    return data || {};
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    return {};
  }
}

export async function requireAnyPermission(permissionKeys: string[]) {
  const user = await getServerUser();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }

  for (const permission of permissionKeys) {
    if (await hasPermission(permission, user.id)) {
      return user;
    }
  }

  throw new AuthError(`Insufficient permissions: requires one of [${permissionKeys.join(', ')}]`);
}

export async function requireAllPermissions(permissionKeys: string[]) {
  const user = await getServerUser();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }

  for (const permission of permissionKeys) {
    if (!(await hasPermission(permission, user.id))) {
      throw new AuthError(`Insufficient permissions: missing ${permission}`);
    }
  }

  return user;
}
