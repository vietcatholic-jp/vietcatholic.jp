# Avatar System Migration Guide

Hướng dẫn chi tiết để migrate từ hệ thống PortraitUpload cũ sang AvatarManager mới.

## 📋 Tổng quan Migration

### Lý do Migration

1. **Unified System**: Thống nhất giao diện và trải nghiệm người dùng
2. **Responsive Design**: Hỗ trợ tốt hơn cho mobile và tablet
3. **Performance**: Tối ưu hóa hiệu suất và bundle size
4. **Maintainability**: Code dễ bảo trì và mở rộng hơn
5. **Accessibility**: Hỗ trợ đầy đủ cho accessibility

### Thay đổi chính

- **Component Name**: `PortraitUpload` → `AvatarManager`
- **Props Interface**: Cập nhật và mở rộng props
- **Responsive Workflow**: Tự động chuyển đổi desktop/mobile
- **Compression**: Cải thiện thuật toán nén ảnh
- **Error Handling**: Xử lý lỗi tốt hơn

## 🔄 Component Migration

### Before: PortraitUpload

```tsx
// components/portrait/portrait-upload.tsx
import { PortraitUpload } from '@/components/portrait/portrait-upload';

function TicketPage() {
  const [portraitUrl, setPortraitUrl] = useState<string>();

  return (
    <PortraitUpload
      registrantId={registrant.id}
      currentUrl={portraitUrl}
      onUpload={(url) => setPortraitUrl(url)}
      size="large"
      showHint={true}
    />
  );
}
```

### After: AvatarManager

```tsx
// components/avatar/avatar-manager.tsx
import { AvatarManager } from '@/components/avatar/avatar-manager';

function TicketPage() {
  const [avatarUrl, setAvatarUrl] = useState<string>();

  return (
    <AvatarManager
      registrantId={registrant.id}
      registrantName={registrant.full_name}
      currentAvatarUrl={avatarUrl}
      size="lg"
      editable={true}
      showUploadHint={true}
      onAvatarChange={(url) => setAvatarUrl(url)}
    />
  );
}
```

## 📝 Props Mapping

### PortraitUpload Props → AvatarManager Props

| PortraitUpload | AvatarManager | Notes |
|----------------|---------------|-------|
| `registrantId` | `registrantId` | Không thay đổi |
| `currentUrl` | `currentAvatarUrl` | Đổi tên prop |
| `onUpload` | `onAvatarChange` | Đổi tên callback |
| `size` | `size` | Mapping values (xem bảng dưới) |
| `showHint` | `showUploadHint` | Đổi tên prop |
| - | `registrantName` | **Mới**: Bắt buộc cho accessibility |
| - | `editable` | **Mới**: Control edit permissions |
| - | `className` | **Mới**: Custom styling |
| - | `acceptedFormats` | **Mới**: File type restrictions |
| - | `maxFileSize` | **Mới**: Size limits |
| - | `compressionQuality` | **Mới**: Compression settings |

### Size Value Mapping

| PortraitUpload | AvatarManager | Pixel Size |
|----------------|---------------|------------|
| `small` | `sm` | 32px - 40px |
| `medium` | `md` | 64px - 80px |
| `large` | `lg` | 96px - 120px |
| `xlarge` | `xl` | 128px - 160px |

## 🗂️ File Structure Changes

### Old Structure

```
components/
├── portrait/
│   ├── portrait-upload.tsx
│   ├── portrait-display.tsx
│   └── portrait-crop.tsx
```

### New Structure

```
components/
├── avatar/
│   ├── avatar-manager.tsx          # Main component
│   ├── avatar-display.tsx          # Display component
│   ├── desktop-avatar-workflow.tsx # Desktop workflow
│   ├── mobile-avatar-workflow.tsx  # Mobile workflow
│   ├── avatar-upload-dialog.tsx    # Upload dialog
│   ├── avatar-crop-dialog.tsx      # Crop dialog
│   └── avatar-crop-processor.tsx   # Processing component
```

## 🔧 API Changes

### Endpoint Compatibility

API endpoints remain the same for backward compatibility:

```http
POST /api/registrants/[id]/avatar
PUT /api/registrants/[id]/avatar
DELETE /api/registrants/[id]/avatar
```

### Database Schema

Không có thay đổi database schema. AvatarManager sử dụng field `portrait_url` hiện có:

```sql
-- Existing field, no changes needed
ALTER TABLE registrants 
-- No changes required
```

## 📱 Responsive Behavior

### Old Behavior

PortraitUpload sử dụng cùng một giao diện cho tất cả devices:

```tsx
// Always shows desktop dialog
<PortraitUpload ... />
```

### New Behavior

AvatarManager tự động detect device và chọn workflow phù hợp:

```tsx
// Automatically chooses desktop dialog or mobile sheet
<AvatarManager ... />

// Desktop: Dialog-based workflow
// Mobile: Sheet-based workflow with touch gestures
```

## 🎨 Styling Migration

### CSS Classes

```css
/* Old classes */
.portrait-upload { }
.portrait-display { }
.portrait-crop { }

/* New classes */
.avatar-manager { }
.avatar-display { }
.avatar-crop { }
```

### Tailwind Classes

```tsx
// Old styling approach
<div className="portrait-container w-24 h-24 rounded-full">

// New styling approach  
<div className="avatar-container w-24 h-24 rounded-full">
```

## 🧪 Testing Migration

### Test File Updates

```bash
# Old test files
tests/portrait/portrait-upload.spec.ts
tests/portrait/portrait-crop.spec.ts

# New test files
tests/avatar/avatar-upload.spec.ts
tests/avatar/avatar-crop.spec.ts
tests/avatar/avatar-performance.spec.ts
```

### Test Selectors

```tsx
// Old selectors
await page.locator('[data-testid="portrait-upload"]').click();
await page.locator('[data-testid="portrait-crop"]').click();

// New selectors
await page.locator('[data-testid="avatar-edit-button"]').click();
await page.locator('[data-testid="avatar-crop-dialog"]').click();
```

## 🚀 Step-by-Step Migration

### Step 1: Install Dependencies

```bash
# No new dependencies needed
# AvatarManager uses existing packages
```

### Step 2: Update Imports

```tsx
// Replace old imports
- import { PortraitUpload } from '@/components/portrait/portrait-upload';

// With new imports
+ import { AvatarManager } from '@/components/avatar/avatar-manager';
```

### Step 3: Update Component Usage

```tsx
// Update component props
<AvatarManager
  registrantId={registrant.id}
  registrantName={registrant.full_name} // Add this
  currentAvatarUrl={portraitUrl}        // Rename from currentUrl
  size="lg"                             // Update size value
  editable={true}                       // Add this
  onAvatarChange={handleAvatarChange}   // Rename from onUpload
/>
```

### Step 4: Update Event Handlers

```tsx
// Old handler
const handleUpload = (url: string) => {
  setPortraitUrl(url);
};

// New handler
const handleAvatarChange = (url: string | null) => {
  setAvatarUrl(url);
  // Handle null case for avatar deletion
};
```

### Step 5: Update Tests

```tsx
// Update test selectors and expectations
test('should upload avatar', async ({ page }) => {
  await page.locator('[data-testid="avatar-edit-button"]').click();
  // ... rest of test
});
```

### Step 6: Remove Old Components

```bash
# After migration is complete and tested
rm -rf components/portrait/
```

## ⚠️ Breaking Changes

### Required Props

```tsx
// These props are now required
registrantName: string;  // New required prop
editable: boolean;       // New required prop
```

### Callback Signature

```tsx
// Old callback
onUpload: (url: string) => void;

// New callback (supports deletion)
onAvatarChange: (url: string | null) => void;
```

### Size Values

```tsx
// Old size values no longer supported
size="small"   // ❌ Not supported
size="medium"  // ❌ Not supported
size="large"   // ❌ Not supported

// Use new size values
size="sm"      // ✅ Supported
size="md"      // ✅ Supported  
size="lg"      // ✅ Supported
size="xl"      // ✅ Supported
```

## 🔍 Validation Checklist

### Pre-Migration

- [ ] Identify all PortraitUpload usages
- [ ] Review current props and callbacks
- [ ] Check existing tests
- [ ] Backup current implementation

### During Migration

- [ ] Update component imports
- [ ] Map old props to new props
- [ ] Add required new props
- [ ] Update callback signatures
- [ ] Update test selectors

### Post-Migration

- [ ] Test upload functionality
- [ ] Test crop functionality
- [ ] Test responsive behavior
- [ ] Test error handling
- [ ] Verify accessibility
- [ ] Check performance
- [ ] Remove old components

## 🐛 Common Issues

### Issue 1: Missing registrantName

```tsx
// Error: registrantName is required
<AvatarManager registrantId="123" />

// Fix: Add registrantName
<AvatarManager 
  registrantId="123" 
  registrantName="Nguyễn Văn A" 
/>
```

### Issue 2: Callback not handling null

```tsx
// Error: Type error with null
const handleChange = (url: string) => setUrl(url);

// Fix: Handle null case
const handleChange = (url: string | null) => {
  if (url) {
    setUrl(url);
  } else {
    setUrl(undefined); // Avatar deleted
  }
};
```

### Issue 3: Size value not recognized

```tsx
// Error: Invalid size value
<AvatarManager size="large" />

// Fix: Use new size values
<AvatarManager size="lg" />
```

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:

1. **Check Documentation**: Xem lại docs này và avatar-system.md
2. **Review Examples**: Xem các usage examples trong codebase
3. **Run Tests**: Chạy test suite để verify functionality
4. **Ask Team**: Liên hệ team development để được hỗ trợ

---

**Cập nhật lần cuối**: 2025-01-07  
**Phiên bản**: 1.0.0
