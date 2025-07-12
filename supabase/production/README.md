# Production Database Setup

This directory contains the production database schema and configurations for the Dai Hoi Cong Giao 2025 event management system.

## File Structure

```
supabase/production/
├── schema.sql      # Main database schema (tables, types, constraints)
├── functions.sql   # All database functions
├── triggers.sql    # All database triggers
├── views.sql       # All database views
├── policies.sql    # All RLS policies
├── storage.sql     # Storage buckets and indexes
├── init.sql        # Initial production setup
└── README.md       # This file
```

## Setup Instructions

### 1. Initial Database Setup

Run the files in this order:

1. **schema.sql** - Creates all tables, types, and basic structure
2. **functions.sql** - Creates all database functions
3. **triggers.sql** - Creates all triggers
4. **views.sql** - Creates all views
5. **policies.sql** - Creates all RLS policies
6. **storage.sql** - Creates storage buckets and indexes
7. **init.sql** - Sets up initial production data

### 2. Supabase CLI Setup

```bash
# Initialize Supabase in your project
supabase init

# Link to your production project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

### 3. Manual Setup via Supabase Dashboard

If using the Supabase dashboard:

1. Go to SQL Editor
2. Run each file in the order specified above
3. Update the admin email in `init.sql` before running

## Key Features

### User Management
- Multi-role system (participant, admin, organizer, etc.)
- Regional administration support
- Facebook OAuth integration

### Event Registration
- Multi-participant registration
- Payment receipt upload
- Event role assignment (participant, volunteer, organizer, etc.)
- Cancellation request system

### Transportation Management
- Regional transportation groups
- Participant assignment to transport groups
- Capacity management

### Admin Features
- Registration management
- Payment confirmation
- Statistics and reporting
- User role management

## Security Features

### Row Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data
- Admins have controlled access to all data
- Helper functions prevent RLS recursion

### Admin Roles
- **super_admin**: Full system access
- **regional_admin**: Regional management
- **registration_manager**: Registration oversight
- **event_organizer**: Event management
- **group_leader**: Group management

## Environment Variables

Make sure to set these in your production environment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth (if using Facebook)
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
```

## Database Maintenance

### Regular Tasks
- Monitor registration statistics
- Review payment confirmations
- Manage transportation capacity
- Process cancellation requests

### Performance Monitoring
- Check query performance using indexes
- Monitor storage usage
- Review RLS policy efficiency

## Backup and Recovery

Ensure regular backups of:
- Database schema and data
- Storage buckets (receipts, portraits, tickets)
- Configuration settings

## Support

For issues or questions:
1. Check the application logs
2. Review RLS policies for access issues
3. Verify user roles and permissions
4. Check storage policies for file access issues

## Migration from Development

When migrating from development:
1. Export data from development environment
2. Set up production schema using these files
3. Import data with proper transformations
4. Update admin user email in init.sql
5. Test all functionality before going live
