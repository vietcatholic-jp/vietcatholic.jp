-- Fix registrations without registrants
-- This script creates primary registrants for registrations that don't have any registrants

-- First, let's see how many registrations are affected
SELECT 
    COUNT(*) as total_registrations_without_registrants
FROM public.registrations r
LEFT JOIN public.registrants rt ON r.id = rt.registration_id
WHERE rt.id IS NULL;

-- Show the affected registrations with user info
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

-- Create primary registrants for registrations without any registrants
-- Only for active registrations (not cancelled)
INSERT INTO public.registrants (
    registration_id,
    email,
    full_name,
    gender,
    age_group,
    province,
    diocese,
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
    NULL as diocese, -- Will need to be filled later
    'M'::shirt_size_type as shirt_size,
    true as is_primary,
    u.facebook_url as facebook_link,
    'Auto-created primary registrant - Please update all fields' as notes,
    r.created_at as created_at, -- Use registration creation time
    NOW() as updated_at
FROM public.registrations r
LEFT JOIN public.registrants rt ON r.id = rt.registration_id
LEFT JOIN public.users u ON r.user_id = u.id
WHERE rt.id IS NULL 
AND u.id IS NOT NULL
AND r.status NOT IN ('cancelled', 'be_cancelled', 'cancel_accepted'); -- Only for active registrations

-- Verify the results
SELECT 
    'Fixed registrations count:' as message,
    COUNT(*) as count
FROM public.registrants 
WHERE notes = 'Auto-created primary registrant - Please update all fields'
AND created_at >= NOW() - INTERVAL '1 hour';

-- Show updated registrations
SELECT 
    r.id as registration_id,
    r.invoice_code,
    r.status,
    rt.id as registrant_id,
    rt.full_name,
    rt.email,
    rt.is_primary,
    rt.notes
FROM public.registrations r
JOIN public.registrants rt ON r.id = rt.registration_id
WHERE rt.notes = 'Auto-created primary registrant - Please update all fields'
AND rt.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY rt.created_at DESC;

-- Final verification: check that no registrations are left without registrants
SELECT 
    COUNT(*) as remaining_registrations_without_registrants
FROM public.registrations r
LEFT JOIN public.registrants rt ON r.id = rt.registration_id
WHERE rt.id IS NULL
AND r.status NOT IN ('cancelled', 'be_cancelled', 'cancel_accepted');
