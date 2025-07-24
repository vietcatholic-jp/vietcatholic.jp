-- Migration: Create Dynamic Roles System
-- Date: 2025-07-25
-- Purpose: Replace static user_role enum with flexible roles table

-- Step 1: Create the new roles table
CREATE TABLE public.roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'Dynamic roles table to replace static user_role enum';
COMMENT ON COLUMN public.roles.permissions IS 'Defines granular permissions, e.g., {"registrations.view": true, "events.edit": false}';

-- Step 2: Create user_roles junction table for role assignments
CREATE TABLE public.user_roles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES public.users(id),
  PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE public.user_roles IS 'Junction table linking users to their assigned roles';

-- Step 3: Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for roles table
-- Only super admins can manage roles
CREATE POLICY "Super admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Users can view roles to understand permissions
CREATE POLICY "Users can view roles" ON public.roles
  FOR SELECT USING (true);

-- Step 5: Create RLS policies for user_roles table
-- Users can view their own role assignments
CREATE POLICY "Users can view own role assignments" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Super admins can manage all role assignments
CREATE POLICY "Super admins can manage role assignments" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Step 6: Create default roles with permissions
INSERT INTO public.roles (name, description, permissions) VALUES 
(
  'Super Admin',
  'Unrestricted access to all features',
  '{"*": true}'::jsonb
),
(
  'Organizer',
  'Full control over event setup and user management',
  '{
    "events.*": true,
    "teams.*": true,
    "roles.*": true,
    "users.assign_roles": true,
    "registrations.view_all": true,
    "analytics.view": true,
    "admin.dashboard.view": true
  }'::jsonb
),
(
  'Treasurer',
  'Manages financial aspects of registrations',
  '{
    "registrations.view_all": true,
    "payments.confirm": true,
    "refunds.manage": true,
    "admin.dashboard.view": true,
    "payments.view": true
  }'::jsonb
),
(
  'Secretary',
  'Manages registrant data and team assignments',
  '{
    "registrations.view_all": true,
    "registrations.edit": true,
    "teams.assign_members": true,
    "admin.dashboard.view": true,
    "registrants.manage": true
  }'::jsonb
),
(
  'Team Leader',
  'Manages their own team roster',
  '{
    "teams.view_own_roster": true,
    "registrations.view_own_team": true
  }'::jsonb
),
(
  'Viewer',
  'Read-only access to high-level data',
  '{
    "registrations.view_all": true,
    "analytics.view": true,
    "admin.dashboard.view": true
  }'::jsonb
),
(
  'Participant',
  'No admin access - regular user',
  '{}'::jsonb
);

-- Step 7: Migrate existing users to new role system
-- This will map old enum values to new role IDs
WITH role_mapping AS (
  SELECT 
    u.id as user_id,
    u.role as old_role,
    r.id as role_id
  FROM public.users u
  JOIN public.roles r ON (
    CASE 
      WHEN u.role = 'super_admin' THEN r.name = 'Super Admin'
      WHEN u.role = 'event_organizer' THEN r.name = 'Organizer'
      WHEN u.role = 'registration_manager' THEN r.name = 'Secretary'
      WHEN u.role = 'regional_admin' THEN r.name = 'Viewer'
      WHEN u.role = 'group_leader' THEN r.name = 'Team Leader'
      ELSE r.name = 'Participant'
    END
  )
)
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
SELECT 
  rm.user_id,
  rm.role_id,
  (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1) -- Assign migration to first super admin
FROM role_mapping rm;

-- Step 8: Create function to check user permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_permissions JSONB;
  role_permissions JSONB;
BEGIN
  -- Get all permissions for the user by aggregating from all their roles
  SELECT COALESCE(jsonb_agg(r.permissions), '{}'::jsonb)
  INTO user_permissions
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_uuid;

  -- Check if user has wildcard permission
  IF user_permissions ? '*' AND (user_permissions->>'*')::boolean THEN
    RETURN TRUE;
  END IF;

  -- Check for exact permission match
  IF user_permissions ? permission_key AND (user_permissions->>permission_key)::boolean THEN
    RETURN TRUE;
  END IF;

  -- Check for wildcard pattern match (e.g., "events.*" matches "events.edit")
  FOR role_permissions IN SELECT jsonb_array_elements(
    CASE 
      WHEN jsonb_typeof(user_permissions) = 'array' 
      THEN user_permissions 
      ELSE jsonb_build_array(user_permissions)
    END
  )
  LOOP
    DECLARE
      perm_key TEXT;
      perm_value BOOLEAN;
    BEGIN
      FOR perm_key, perm_value IN SELECT * FROM jsonb_each_text(role_permissions)
      LOOP
        IF perm_value::boolean AND (
          perm_key = permission_key OR
          (perm_key LIKE '%.*' AND permission_key LIKE REPLACE(perm_key, '*', '%'))
        ) THEN
          RETURN TRUE;
        END IF;
      END LOOP;
    END;
  END LOOP;

  RETURN FALSE;
END;
$$;

-- Step 9: Create helper function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{}'::jsonb;
  role_perms JSONB;
BEGIN
  -- Aggregate all permissions from user's roles
  FOR role_perms IN 
    SELECT r.permissions
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
  LOOP
    result := result || role_perms;
  END LOOP;

  RETURN result;
END;
$$;

-- Step 10: Create updated trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON public.roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();