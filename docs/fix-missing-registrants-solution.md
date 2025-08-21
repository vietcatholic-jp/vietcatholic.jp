# Fix Missing Registrants Solution

## Problem
Some registrations in the database were created without corresponding registrants records. This caused issues when users tried to edit their registrations, as the edit form expects at least one registrant to exist.

## Solution Overview

The solution consists of three main components:

### 1. Individual Registration Fix (User-facing)
**File: `app/(protected)/register/[id]/page.tsx`**

When a user accesses the registration edit page:
- The system checks if the registration has any registrants
- If no registrants exist, it automatically creates a default primary registrant using the user's information
- The user can then update the registrant information through the normal edit form
- Shows a helpful warning message to guide users to complete missing information

**Key Features:**
- Automatically creates primary registrant with user data
- Uses sensible defaults (gender: 'other', age_group: '18_25', shirt_size: 'M')
- Marks the registrant as requiring updates with a note
- Shows warning UI to guide user completion

### 2. Bulk Fix Tool (Admin-facing)
**File: `app/api/admin/fix-registrants/route.ts`**

Admin API endpoint that can:
- **GET**: Check how many registrations need fixing
- **POST**: Automatically create primary registrants for all registrations missing them

**Security:**
- Requires admin-level access (super_admin, admin, regional_admin)
- Only processes active registrations (excludes cancelled ones)
- Validates user permissions before execution

### 3. Registration Manager Integration
**File: `components/admin/registration-manager/QuickActions.tsx`**

Added to the Registration Manager Dashboard:
- Automatically checks for missing registrants on page load
- Shows a warning if registrations without registrants are found
- Provides one-click bulk fix functionality
- Shows success/status feedback

## Database Queries

### Check for Registrations Without Registrants
```sql
SELECT 
    r.id as registration_id,
    r.user_id,
    r.invoice_code,
    r.status,
    r.created_at,
    u.email,
    u.full_name,
    u.region,
    u.province
FROM public.registrations r
LEFT JOIN public.registrants rt ON r.id = rt.registration_id
LEFT JOIN public.users u ON r.user_id = u.id
WHERE rt.id IS NULL
AND r.status NOT IN ('cancelled', 'be_cancelled', 'cancel_accepted')
ORDER BY r.created_at;
```

### Create Missing Primary Registrants
```sql
INSERT INTO public.registrants (
    registration_id,
    email,
    full_name,
    gender,
    age_group,
    province,
    shirt_size,
    is_primary,
    facebook_link,
    notes,
    created_at,
    updated_at
)
SELECT 
    r.id as registration_id,
    u.email,
    COALESCE(NULLIF(TRIM(u.full_name), ''), 'Please Update Name') as full_name,
    'other'::gender_type as gender,
    '18_25'::age_group_type as age_group,
    u.province,
    'M'::shirt_size_type as shirt_size,
    true as is_primary,
    u.facebook_url as facebook_link,
    'Auto-created primary registrant - Please update all fields' as notes,
    r.created_at as created_at,
    NOW() as updated_at
FROM public.registrations r
LEFT JOIN public.registrants rt ON r.id = rt.registration_id
LEFT JOIN public.users u ON r.user_id = u.id
WHERE rt.id IS NULL 
AND u.id IS NOT NULL
AND r.status NOT IN ('cancelled', 'be_cancelled', 'cancel_accepted');
```

## Usage Instructions

### For Registration Managers
1. Navigate to the Registration Manager Dashboard
2. Look for the "Data Maintenance" section in Quick Actions
3. If there are registrations missing registrants, a warning will appear
4. Click "Tự động sửa chữa" (Auto Fix) to create missing registrants
5. Users can then edit their registrations normally

### For Users
1. Access your registration edit page: `/register/[registration-id]`
2. If your registration was missing registrant information, it will be automatically created
3. Look for the amber warning box indicating fields that need updating
4. Complete all required information and save

### For Direct Database Access
Use the SQL script: `supabase/production/fix-missing-registrants.sql`

## Benefits

1. **User-Friendly**: Users can immediately edit their registrations without technical intervention
2. **Admin-Friendly**: Registration managers have tools to identify and fix issues in bulk
3. **Safe**: Only creates registrants for valid, non-cancelled registrations
4. **Informative**: Clear messaging guides users to complete missing information
5. **Automatic**: Individual fixes happen seamlessly when users access edit pages

## Notes

- Created registrants will have default values that need user completion
- The note field indicates auto-created registrants for tracking
- All security checks ensure only authorized access
- The solution preserves existing registration data and relationships
