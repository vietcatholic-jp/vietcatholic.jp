# Admin Password Reset Feature

## Overview
This feature allows administrators to reset passwords for user accounts in the system. It provides a secure and controlled way for admins to help users who have forgotten their passwords or need their accounts reset.

## Features

### 1. Password Reset Button
- Added a "Đặt lại MK" (Reset Password) button in the user management interface
- Only visible to administrators with appropriate permissions
- Located next to the existing "Chỉnh sửa" (Edit) button

### 2. Permission Control
- **Super Admins**: Can reset passwords for all users except other super admins (unless it's their own account)
- **Regional Admins**: Can only reset passwords for non-admin users in their assigned region

### 3. Secure Password Generation
- Automatically generates secure 12-character passwords
- Includes uppercase, lowercase, numbers, and special characters
- Ensures at least one character from each category
- Password is shuffled for additional security

### 4. User Interface

#### Confirmation Dialog
- Shows user information (name and email) before confirming the reset
- Displays important warnings about the action
- Requires explicit confirmation before proceeding

#### Password Result Dialog
- Displays the newly generated password
- Provides a copy-to-clipboard button for easy sharing
- Shows security guidelines for password distribution
- Includes instructions for the admin on how to securely share the password

### 5. Audit Logging
- All password reset actions are logged in the `audit_logs` table
- Includes:
  - Admin who performed the reset
  - Target user information
  - Timestamp of the action
  - Action type: "admin_password_reset"

## Database Setup

### Audit Logs Table
The feature requires an `audit_logs` table for tracking password reset actions. Run the migration:

```bash
# Apply the migration
supabase db push

# Or if using CLI migration
supabase migration up
```

The migration creates:
- `audit_logs` table with proper columns and constraints
- Indexes for efficient querying
- Row Level Security (RLS) policies
- Comments for documentation

### Environment Variables
Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Technical Implementation

### API Endpoint
- **Route**: `/api/admin/users/reset-password`
- **Method**: POST
- **Authentication**: Required (admin roles only)
- **Parameters**:
  - `userId`: ID of the user whose password should be reset
  - `generatePassword`: Boolean (always true for auto-generation)
  - `customPassword`: Optional custom password (currently not used)

### Security Features
1. **Role-based Access Control**: Only admins can access the feature
2. **Regional Restrictions**: Regional admins are limited to their region
3. **Audit Trail**: All actions are logged for security monitoring
4. **Secure Password Generation**: Uses cryptographically strong password generation
5. **Protected Routes**: API endpoint validates permissions before allowing access

### Files Modified/Created

#### New Files
- `/app/api/admin/users/reset-password/route.ts` - API endpoint for password reset
- `/supabase/migrations/20250901_audit_logs_system.sql` - Database migration for audit logging
- `/docs/admin-password-reset-feature.md` - This documentation

#### Modified Files
- `/lib/supabase/admin.ts` - Added admin password reset functions and password generation
- `/components/admin/user-management.tsx` - Added UI for password reset feature

## Usage Instructions

### For Administrators
1. Navigate to the Admin Users page (`/admin/users`)
2. Find the user whose password needs to be reset
3. Click the "Đặt lại MK" (Reset Password) button
4. Review the user information in the confirmation dialog
5. Click "Đặt lại mật khẩu" (Reset Password) to confirm
6. Copy the generated password using the copy button
7. Securely share the password with the user through appropriate channels

### Security Best Practices
1. **Never share passwords via email or unsecured messaging**
2. **Use secure communication channels** (phone, encrypted messaging, in-person)
3. **Encourage users to change their password** after first login
4. **Monitor audit logs** for unusual password reset activity
5. **Verify user identity** before performing password resets

## Error Handling
- Invalid permissions result in 403 Forbidden responses
- Missing user IDs result in 400 Bad Request responses
- Non-existent users result in 404 Not Found responses
- System errors are logged and return 500 Internal Server Error responses
- UI displays user-friendly error messages via toast notifications

## Future Enhancements
- Email notification to users when their password is reset
- Temporary password expiration
- Custom password option for admins
- Bulk password reset functionality
- Integration with external password managers
