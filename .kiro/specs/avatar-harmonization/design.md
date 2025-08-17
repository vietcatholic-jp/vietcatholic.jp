# Avatar System Harmonization Design

## Architecture Overview

### Current State Analysis
```
Current Codebase:
├── components/tickets/portrait-upload.tsx (OLD - Direct Supabase upload)
├── components/avatar/* (NEW - Advanced avatar system)
├── lib/types.ts (Registrant.portrait_url field)
├── lib/supabase/client.ts (Existing Supabase patterns)
└── API routes (Existing patterns)

Issues:
- Duplicate upload logic
- Inconsistent UI patterns
- Different error handling approaches
- Mixed storage strategies
```

### Target Architecture
```
Harmonized System:
├── components/avatar/avatar-manager.tsx (UNIFIED - Single avatar component)
├── lib/services/avatar-storage.ts (ENHANCED - Consistent with existing patterns)
├── app/api/registrants/[id]/avatar/route.ts (ALIGNED - Follow existing API patterns)
├── lib/types.ts (EXTENDED - Avatar-specific types)
└── Updated components using consistent patterns
```

## Component Design

### 1. Enhanced AvatarManager Component

```typescript
interface AvatarManagerProps {
  registrantId: string;
  registrantName: string;
  currentAvatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onAvatarChange?: (newUrl: string | null) => void;
  className?: string;
  // New props for harmonization
  showUploadHint?: boolean;
  acceptedFormats?: string[];
  maxFileSize?: number;
}
```

**Key Enhancements:**
- Consistent props interface
- Better error handling alignment
- Integration với existing toast system
- Proper loading states

### 2. Unified Storage Service

```typescript
// Enhanced avatar-storage.ts
export interface AvatarStorageConfig {
  bucket: string;
  maxFileSize: number;
  allowedTypes: string[];
  compressionQuality: number;
}

export class AvatarStorageService {
  // Align với existing Supabase patterns
  private supabase = createClient();
  
  // Use existing error handling patterns
  async uploadAvatar(params: UploadParams): Promise<Result<string>>
  async deleteAvatar(params: DeleteParams): Promise<Result<void>>
  async getAvatarUrl(params: GetParams): Promise<string>
}
```

### 3. API Route Harmonization

```typescript
// app/api/registrants/[id]/avatar/route.ts
// Follow existing API patterns from other routes

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Use existing auth middleware patterns
  // Use existing error response format
  // Use existing logging patterns
}
```

## Database Integration

### Schema Alignment
```sql
-- Existing schema (no changes needed)
registrants table:
  - portrait_url: text (already exists)
  
-- Avatar system will use this field consistently
```

### Data Migration Strategy
```typescript
// No database migration needed
// Avatar system will:
// 1. Read from existing portrait_url field
// 2. Update portrait_url field on changes
// 3. Maintain backward compatibility
```

## Component Integration Plan

### 1. Replace PortraitUpload Component

**Before:**
```typescript
// components/tickets/portrait-upload.tsx
<PortraitUpload 
  registrantId={id}
  onUploadComplete={() => refresh()}
/>
```

**After:**
```typescript
// Use AvatarManager instead
<AvatarManager
  registrantId={id}
  registrantName={name}
  currentAvatarUrl={portraitUrl}
  size="lg"
  editable={true}
  onAvatarChange={(url) => handleAvatarChange(url)}
  showUploadHint={true}
/>
```

### 2. Standardize Existing Usage

**Current Usage in registration-card.tsx:**
```typescript
<AvatarManager
  registrantId={registrant.id}
  registrantName={registrant.full_name}
  currentAvatarUrl={registrant.portrait_url}
  size="md"
  editable={true}
  className="w-12 h-12"
/>
```

**Standardized Usage:**
```typescript
<AvatarManager
  registrantId={registrant.id}
  registrantName={registrant.full_name}
  currentAvatarUrl={registrant.portrait_url}
  size="md"
  editable={canEditAvatar}
  onAvatarChange={handleAvatarUpdate}
  className="w-12 h-12"
/>
```

## API Design

### Endpoint Structure
```
Following existing API patterns:

POST   /api/registrants/[id]/avatar     - Upload new avatar
PUT    /api/registrants/[id]/avatar     - Update existing avatar  
DELETE /api/registrants/[id]/avatar     - Delete avatar
GET    /api/registrants/[id]/avatar     - Get avatar info (optional)
```

### Request/Response Format
```typescript
// Follow existing API response patterns
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Avatar upload response
interface AvatarUploadResponse {
  avatarUrl: string;
  compressionRatio: number;
  fileSize: number;
}
```

### Error Handling
```typescript
// Use existing error handling patterns
try {
  const result = await uploadAvatar(params);
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Avatar upload error:', error);
  return NextResponse.json(
    { success: false, error: 'Upload failed' },
    { status: 500 }
  );
}
```

## Type System Integration

### Enhanced Type Definitions
```typescript
// Extend existing types in lib/types.ts
export interface AvatarMetadata {
  url: string;
  uploadedAt: string;
  fileSize: number;
  compressionRatio: number;
}

// Extend Registrant interface if needed
export interface Registrant {
  // ... existing fields
  portrait_url?: string;
  avatar_metadata?: AvatarMetadata; // Optional enhancement
}
```

### Component Props Standardization
```typescript
// Standardized avatar props across components
export interface StandardAvatarProps {
  registrantId: string;
  registrantName: string;
  currentAvatarUrl?: string;
  size: 'sm' | 'md' | 'lg';
  editable: boolean;
  onAvatarChange?: (url: string | null) => void;
}
```

## Performance Optimization

### Image Compression Integration
```typescript
// Use existing compression utilities
import { compressAvatarImage } from '@/lib/image-compression';

// Enhanced compression with existing patterns
const compressedResult = await compressAvatarImage(file, {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  maxSizeKB: 200
});
```

### Lazy Loading Strategy
```typescript
// Follow existing lazy loading patterns
const AvatarManager = lazy(() => import('./avatar-manager'));

// Use existing Suspense patterns
<Suspense fallback={<AvatarSkeleton />}>
  <AvatarManager {...props} />
</Suspense>
```

## Security Integration

### Authentication Alignment
```typescript
// Use existing auth patterns
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Continue with existing auth patterns...
}
```

### File Validation
```typescript
// Enhanced validation following existing patterns
const validateAvatarFile = (file: File): ValidationResult => {
  // Use existing validation utilities
  if (!isValidImageType(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > MAX_AVATAR_SIZE) {
    return { valid: false, error: 'File too large' };
  }
  
  return { valid: true };
};
```

## Testing Strategy

### Component Testing
```typescript
// Follow existing testing patterns
describe('AvatarManager', () => {
  it('should render with existing avatar', () => {
    render(
      <AvatarManager
        registrantId="test-id"
        registrantName="Test User"
        currentAvatarUrl="https://example.com/avatar.jpg"
        size="md"
        editable={true}
      />
    );
    
    expect(screen.getByAltText('Avatar for Test User')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// Test API integration
describe('Avatar API', () => {
  it('should upload avatar successfully', async () => {
    const formData = new FormData();
    formData.append('file', mockImageFile);
    
    const response = await fetch('/api/registrants/test-id/avatar', {
      method: 'POST',
      body: formData,
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.avatarUrl).toBeDefined();
  });
});
```

## Migration Plan

### Phase 1: Core Harmonization
1. Update AvatarManager component for consistency
2. Enhance avatar-storage service
3. Align API endpoints với existing patterns
4. Update type definitions

### Phase 2: Component Replacement
1. Replace PortraitUpload với AvatarManager
2. Update ticket generation workflow
3. Test backward compatibility
4. Update documentation

### Phase 3: Optimization
1. Performance testing và optimization
2. Accessibility improvements
3. Error handling enhancements
4. Final testing và validation

## Rollback Strategy

### Safe Deployment
1. Feature flags for new avatar system
2. Gradual rollout to user segments
3. Monitoring và alerting
4. Quick rollback capability

### Data Safety
1. Preserve existing portrait_url data
2. Backup strategy for storage files
3. Database transaction safety
4. Recovery procedures

## Success Metrics

### Technical Metrics
- Code duplication reduction: >50%
- Bundle size impact: <50KB increase
- Performance improvement: >20% faster loading
- Error rate reduction: >30%

### User Experience Metrics
- Upload success rate: >95%
- User satisfaction scores
- Accessibility compliance: WCAG 2.1 AA
- Cross-browser compatibility: >98%