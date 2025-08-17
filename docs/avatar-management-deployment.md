# Avatar Management System - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration

#### Supabase Setup
- [ ] Verify 'portraits' bucket exists in Supabase Storage
- [ ] Configure bucket permissions and RLS policies
- [ ] Set up CDN settings for optimal performance
- [ ] Test storage upload/delete operations

#### Environment Variables
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: [
      'your-supabase-project.supabase.co',
      // Add other image domains as needed
    ],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### 2. Database Setup

#### Required Tables
- [ ] `registrants` table has `portrait_url` field (TEXT, nullable)
- [ ] `event_logs` table exists for audit logging
- [ ] `users` table has proper role fields

#### RLS Policies
```sql
-- Example RLS policy for registrants table
CREATE POLICY "Users can view own registrants" ON registrants
  FOR SELECT USING (
    registration_id IN (
      SELECT id FROM registrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all registrants" ON registrants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('registration_manager', 'event_organizer', 'regional_admin', 'super_admin')
    )
  );
```

### 3. Performance Optimization

#### Image Optimization
- [ ] Configure Next.js Image component domains
- [ ] Set up proper image sizing and quality settings
- [ ] Enable WebP/AVIF format support
- [ ] Configure CDN caching headers

#### Bundle Optimization
- [ ] Verify lazy loading is working for avatar components
- [ ] Check bundle size impact of new components
- [ ] Ensure tree shaking is removing unused code
- [ ] Test code splitting for crop dialog components

### 4. Security Verification

#### File Upload Security
- [ ] File type validation is working
- [ ] File size limits are enforced (5MB max)
- [ ] Malicious file detection is in place
- [ ] Storage bucket has proper CORS settings

#### Authentication & Authorization
- [ ] User authentication is required for all avatar operations
- [ ] Permission checking is working correctly
- [ ] Admin privileges are properly enforced
- [ ] Rate limiting is configured and tested

### 5. Accessibility Compliance

#### WCAG 2.1 AA Compliance
- [ ] All interactive elements have proper ARIA labels
- [ ] Keyboard navigation works throughout the system
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader compatibility is verified
- [ ] Focus management is working correctly

#### Testing
- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Verify keyboard-only navigation
- [ ] Test high contrast mode compatibility
- [ ] Verify reduced motion preferences are respected

## Deployment Steps

### 1. Pre-deployment Testing

#### Unit Tests
```bash
npm run test -- __tests__/avatar/
```

#### Integration Tests
```bash
npm run test:integration
```

#### E2E Tests
```bash
npm run test:e2e -- --spec="avatar-management"
```

#### Performance Tests
```bash
npm run lighthouse:ci
```

### 2. Staging Deployment

#### Deploy to Staging
```bash
# Deploy to staging environment
npm run deploy:staging
```

#### Staging Verification
- [ ] Upload avatar workflow works end-to-end
- [ ] Crop functionality works on desktop and mobile
- [ ] Delete avatar functionality works
- [ ] Admin permissions are enforced
- [ ] Performance metrics are acceptable
- [ ] Error handling works correctly

### 3. Production Deployment

#### Database Migration
```sql
-- Ensure portrait_url column exists
ALTER TABLE registrants ADD COLUMN IF NOT EXISTS portrait_url TEXT;

-- Update existing registrants if needed
-- (This step may not be necessary if the column already exists)
```

#### Feature Flag Configuration
```javascript
// Feature flags for gradual rollout
const AVATAR_MANAGEMENT_ENABLED = process.env.AVATAR_MANAGEMENT_ENABLED === 'true';
const AVATAR_MANAGEMENT_ADMIN_ONLY = process.env.AVATAR_MANAGEMENT_ADMIN_ONLY === 'true';
```

#### Deployment Command
```bash
npm run build
npm run deploy:production
```

### 4. Post-deployment Verification

#### Smoke Tests
- [ ] Avatar upload works for regular users
- [ ] Avatar upload works for admin users
- [ ] Avatar display works across all components
- [ ] Mobile workflow functions correctly
- [ ] Desktop workflow functions correctly

#### Performance Monitoring
- [ ] Monitor Core Web Vitals
- [ ] Check image loading performance
- [ ] Verify CDN cache hit rates
- [ ] Monitor API response times

## Monitoring and Analytics

### 1. Performance Metrics

#### Key Metrics to Monitor
```javascript
// Example monitoring setup
const avatarMetrics = {
  uploadSuccessRate: 'avatar_upload_success_rate',
  uploadDuration: 'avatar_upload_duration',
  compressionRatio: 'avatar_compression_ratio',
  errorRate: 'avatar_error_rate',
  userAdoption: 'avatar_user_adoption_rate',
};
```

#### Alerts Configuration
- Upload success rate < 95%
- Average upload time > 10 seconds
- Error rate > 5%
- Storage usage growth > 10GB/day

### 2. User Analytics

#### Usage Tracking
```javascript
// Track avatar management usage
analytics.track('Avatar Upload Started', {
  userId: user.id,
  registrantId: registrant.id,
  fileSize: file.size,
  fileType: file.type,
});

analytics.track('Avatar Upload Completed', {
  userId: user.id,
  registrantId: registrant.id,
  originalSize: result.originalSize,
  compressedSize: result.compressedSize,
  compressionRatio: result.compressionRatio,
  duration: uploadDuration,
});
```

#### Key Metrics
- Avatar upload adoption rate by user role
- Average file size before/after compression
- Most common upload errors
- Device/browser usage patterns
- Geographic usage distribution

### 3. Error Monitoring

#### Error Tracking Setup
```javascript
// Sentry configuration for avatar errors
Sentry.configureScope((scope) => {
  scope.setTag('feature', 'avatar-management');
});

// Custom error boundary for avatar components
class AvatarErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, {
      tags: {
        component: 'avatar-management',
      },
      extra: errorInfo,
    });
  }
}
```

#### Common Errors to Monitor
- File upload failures
- Image compression errors
- Permission denied errors
- Network timeout errors
- Storage quota exceeded errors

## Rollback Plan

### 1. Feature Flag Rollback
```javascript
// Disable avatar management if issues occur
process.env.AVATAR_MANAGEMENT_ENABLED = 'false';
```

### 2. Component Rollback
```javascript
// Fallback to basic avatar display
const AvatarDisplay = AVATAR_MANAGEMENT_ENABLED 
  ? AvatarManager 
  : BasicAvatarPlaceholder;
```

### 3. Database Rollback
```sql
-- If needed, remove portrait_url references
-- (Generally not recommended unless critical issues)
UPDATE registrants SET portrait_url = NULL WHERE portrait_url IS NOT NULL;
```

## Maintenance

### 1. Regular Tasks

#### Weekly
- [ ] Review error logs and fix issues
- [ ] Monitor storage usage and costs
- [ ] Check performance metrics
- [ ] Review user feedback

#### Monthly
- [ ] Update dependencies
- [ ] Review and optimize performance
- [ ] Analyze usage patterns
- [ ] Plan feature improvements

#### Quarterly
- [ ] Security audit
- [ ] Accessibility compliance review
- [ ] Performance optimization review
- [ ] User experience analysis

### 2. Storage Management

#### Cleanup Tasks
```javascript
// Example cleanup script for orphaned avatars
async function cleanupOrphanedAvatars() {
  // Find avatars in storage that don't have corresponding registrants
  // Remove old avatars from deleted registrants
  // Optimize storage usage
}
```

#### Backup Strategy
- Regular backups of avatar files
- Backup retention policy (e.g., 90 days)
- Disaster recovery procedures

## Success Metrics

### 1. Technical Metrics
- Upload success rate > 98%
- Average upload time < 5 seconds
- Error rate < 2%
- Page load time impact < 100ms
- Storage cost per user < $0.01/month

### 2. User Experience Metrics
- Avatar adoption rate > 60%
- User satisfaction score > 4.5/5
- Support tickets related to avatars < 1%
- Mobile vs desktop usage balance

### 3. Business Metrics
- Increased user engagement
- Improved registration completion rates
- Enhanced event check-in experience
- Positive user feedback

## Troubleshooting Guide

### Common Issues

#### Upload Failures
1. Check file size and format
2. Verify Supabase storage permissions
3. Check network connectivity
4. Review error logs

#### Permission Errors
1. Verify user authentication
2. Check RLS policies
3. Validate user roles
4. Review admin permissions

#### Performance Issues
1. Monitor image compression times
2. Check CDN cache performance
3. Review lazy loading implementation
4. Analyze bundle size impact

#### Mobile Issues
1. Test touch gestures
2. Verify responsive design
3. Check camera integration
4. Test on various devices

For additional support, refer to the technical documentation or contact the development team.