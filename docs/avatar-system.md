# Avatar Management System

Hệ thống quản lý avatar toàn diện cho Đại Hội Công Giáo Việt Nam 2025, hỗ trợ upload, crop, compress và quản lý avatar cho người tham gia.

## 📋 Tổng quan

Avatar system cung cấp:
- **Upload & Crop**: Giao diện thân thiện để upload và crop avatar
- **Responsive Design**: Tự động chuyển đổi giữa desktop và mobile workflow
- **Image Compression**: Tối ưu hóa kích thước file với chất lượng cao
- **Performance**: Lazy loading, caching và optimization
- **Accessibility**: Hỗ trợ đầy đủ cho screen readers và keyboard navigation

## 🏗️ Kiến trúc

### Component Hierarchy

```
AvatarManager (Root Component)
├── AvatarDisplay (Display Component)
│   ├── AvatarImage
│   └── AvatarPlaceholder
├── DesktopAvatarWorkflow (Desktop)
│   ├── AvatarUploadDialog
│   ├── AvatarCropDialog
│   └── AvatarCropProcessor
└── MobileAvatarWorkflow (Mobile)
    ├── MobileAvatarUploadSheet
    ├── MobileAvatarCropSheet
    └── AvatarCropProcessor
```

### Core Services

- **Image Compression**: `lib/image-compression.ts`
- **Responsive Utilities**: `lib/utils/responsive.ts`
- **Storage Service**: Supabase Storage integration
- **API Routes**: `/api/registrants/[id]/avatar`

## 🚀 Sử dụng

### Basic Usage

```tsx
import { AvatarManager } from '@/components/avatar/avatar-manager';

function ProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState<string>();

  return (
    <AvatarManager
      registrantId="user-123"
      registrantName="Nguyễn Văn A"
      currentAvatarUrl={avatarUrl}
      size="lg"
      editable={true}
      onAvatarChange={setAvatarUrl}
    />
  );
}
```

### Props Interface

```tsx
interface AvatarManagerProps {
  registrantId: string;           // ID của người tham gia
  registrantName: string;         // Tên hiển thị
  currentAvatarUrl?: string;      // URL avatar hiện tại
  size?: AvatarSize;              // 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean;             // Cho phép chỉnh sửa
  onAvatarChange?: (url: string | null) => void;
  className?: string;
  showUploadHint?: boolean;
  acceptedFormats?: string[];
  maxFileSize?: number;
  compressionQuality?: number;
}
```

### Advanced Configuration

```tsx
<AvatarManager
  registrantId="user-123"
  registrantName="Nguyễn Văn A"
  size="lg"
  editable={true}
  acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
  maxFileSize={5 * 1024 * 1024} // 5MB
  compressionQuality={0.85}
  showUploadHint={true}
  onAvatarChange={(url) => {
    console.log('Avatar updated:', url);
    // Update state or call API
  }}
/>
```

## 🎨 Responsive Design

### Breakpoints

- **Mobile**: < 768px - Sử dụng Sheet components
- **Tablet**: 768px - 1024px - Responsive dialogs
- **Desktop**: > 1024px - Full dialog experience

### Device Detection

```tsx
import { useBreakpoint, useTouchDevice } from '@/lib/utils/responsive';

function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { isTouch, hasHover } = useTouchDevice();
  
  return (
    <div>
      {isMobile ? <MobileInterface /> : <DesktopInterface />}
    </div>
  );
}
```

## 🖼️ Image Compression

### Default Settings

```tsx
// Avatar compression settings
const AVATAR_COMPRESSION = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  maxSizeKB: 200
};
```

### Custom Compression

```tsx
import { compressAvatarImage } from '@/lib/image-compression';

const result = await compressAvatarImage(file, cropData, {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.9,
  maxSizeKB: 150
});

console.log(`Compressed from ${result.originalSize} to ${result.compressedSize}`);
console.log(`Compression ratio: ${result.compressionRatio * 100}%`);
```

## 🔧 API Integration

### Upload Avatar

```http
POST /api/registrants/[id]/avatar
Content-Type: multipart/form-data

file: [image file]
```

**Response:**
```json
{
  "success": true,
  "avatarUrl": "https://storage.url/avatar.jpg",
  "metadata": {
    "originalSize": 2048000,
    "compressedSize": 204800,
    "compressionRatio": 0.9
  }
}
```

### Update Avatar

```http
PUT /api/registrants/[id]/avatar
Content-Type: multipart/form-data

file: [image file]
```

### Delete Avatar

```http
DELETE /api/registrants/[id]/avatar
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar đã được xóa thành công"
}
```

## 🎯 Performance

### Optimization Features

- **Lazy Loading**: Avatar images load on demand
- **Compression**: Automatic image optimization
- **Caching**: Browser and CDN caching
- **Bundle Splitting**: Dynamic imports for upload components

### Performance Metrics

- **Load Time**: < 2s for avatar display
- **Compression Time**: < 5s for 2MB images
- **Bundle Impact**: < 100KB additional for avatar components
- **Mobile Performance**: < 1s for mobile sheet opening

## ♿ Accessibility

### Features

- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling in dialogs
- **High Contrast**: Support for high contrast themes

### Implementation

```tsx
// Automatic accessibility props
const accessibleProps = createAccessibleAvatarProps(
  registrantName,
  hasAvatar,
  isEditable
);

<div {...accessibleProps}>
  <AvatarImage src={avatarUrl} alt={`Avatar for ${registrantName}`} />
</div>
```

## 🧪 Testing

### Test Coverage

- **Unit Tests**: Image compression utilities
- **Integration Tests**: API endpoints
- **E2E Tests**: Complete upload workflows
- **Performance Tests**: Load times and memory usage

### Running Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# All avatar tests
npm run test:avatar
```

## 🔒 Security

### File Validation

- **Type Checking**: Only image files allowed
- **Size Limits**: Maximum 5MB file size
- **Content Validation**: Verify actual image content
- **Sanitization**: Clean file names and metadata

### Storage Security

- **Access Control**: User can only modify their own avatars
- **Secure URLs**: Time-limited signed URLs
- **CORS Protection**: Proper CORS configuration
- **Rate Limiting**: Upload rate limiting

## 🚨 Error Handling

### Common Errors

```tsx
// File type validation
if (!file.type.startsWith('image/')) {
  throw new Error('Chỉ chấp nhận file hình ảnh');
}

// Size validation
if (file.size > maxFileSize) {
  throw new Error('File quá lớn. Kích thước tối đa: 5MB');
}

// Compression errors
try {
  const result = await compressAvatarImage(file);
} catch (error) {
  toast.error('Có lỗi xảy ra khi xử lý ảnh');
}
```

### Error Recovery

- **Retry Logic**: Automatic retry for network errors
- **Fallback UI**: Graceful degradation for failed loads
- **User Feedback**: Clear error messages in Vietnamese
- **Logging**: Comprehensive error logging for debugging

## 📱 Mobile Considerations

### Touch Interactions

- **Pinch to Zoom**: Native pinch gestures for cropping
- **Drag to Pan**: Touch drag for image positioning
- **Double Tap**: Fit to screen functionality
- **Haptic Feedback**: Touch feedback where supported

### Mobile Optimizations

- **Reduced Bundle Size**: Smaller mobile-specific components
- **Touch-Friendly UI**: Larger touch targets
- **Viewport Handling**: Safe area insets support
- **Network Awareness**: Optimized for mobile networks

## 🔄 Migration Guide

### From PortraitUpload to AvatarManager

```tsx
// Before (PortraitUpload)
<PortraitUpload
  registrantId={id}
  currentUrl={portraitUrl}
  onUpload={handleUpload}
/>

// After (AvatarManager)
<AvatarManager
  registrantId={id}
  registrantName={name}
  currentAvatarUrl={portraitUrl}
  editable={true}
  onAvatarChange={handleUpload}
/>
```

### Database Migration

The system uses the existing `portrait_url` field in the `registrants` table:

```sql
-- No schema changes needed
-- AvatarManager uses existing portrait_url field
SELECT portrait_url FROM registrants WHERE id = $1;
```

## 🛠️ Development

### Adding New Features

1. **Create Component**: Add to `components/avatar/`
2. **Add Types**: Update `lib/types.ts`
3. **Write Tests**: Add comprehensive tests
4. **Update Docs**: Document new features

### Code Style

```tsx
// Follow existing patterns
export function NewAvatarComponent({
  prop1,
  prop2,
}: NewAvatarComponentProps) {
  const { isMobile } = useBreakpoint();
  
  return (
    <div className={cn('base-classes', className)}>
      {/* Component content */}
    </div>
  );
}
```

## 📚 Related Documentation

- [Image Compression Guide](./image-compression.md)
- [Responsive Design System](./responsive-design.md)
- [API Documentation](./api-reference.md)
- [Testing Guide](./testing.md)
- [Performance Optimization](./performance.md)

---

**Cập nhật lần cuối**: 2025-01-07
**Phiên bản**: 1.0.0
**Tác giả**: Đại Hội Công Giáo Việt Nam 2025 Team
