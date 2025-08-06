# Implementation Plan

- [x] 1. Extend existing image compression for avatar-specific needs
  - Extend existing `lib/image-compression.ts` với AVATAR_COMPRESSION config
  - Implement `compressAvatarImage` function với 512x512px max, quality 0.85, 200KB limit
  - Add support cho crop-then-compress workflow
  - _Requirements: 5.1_

- [x] 2. Create responsive utilities for device detection
  - Tạo `lib/utils/responsive.ts` với breakpoint detection
  - Implement `useBreakpoint` hook để detect mobile/tablet/desktop
  - Tạo `useTouchDevice` hook để detect touch capabilities
  - _Requirements: 6.1, 6.2_

- [x] 3. Create avatar storage service
  - Implement `lib/services/avatar-storage.ts` với Supabase Storage integration
  - Tạo functions: `uploadAvatar`, `deleteAvatar`, `getAvatarUrl`
  - Add error handling và retry logic
  - _Requirements: 5.3, 5.5_

- [x] 4. Implement core avatar display components
  - Tạo responsive AvatarDisplay component
  - Implement AvatarPlaceholder với initials generation
  - Tạo AvatarImage component với lazy loading
  - _Requirements: 4.1, 4.2, 4.6_

- [x] 4.1 Tạo AvatarDisplay component
  - Implement responsive sizing (sm/md/lg với mobile/desktop variants)
  - Add hover effects cho desktop, touch feedback cho mobile
  - Implement fallback placeholder với user initials
  - Add loading skeleton states
  - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 4.2 Implement AvatarPlaceholder component
  - Generate initials từ registrant full_name
  - Implement consistent color scheme based on name hash
  - Add responsive sizing và typography
  - _Requirements: 4.2_

- [x] 4.3 Tạo AvatarImage component với optimization
  - Implement lazy loading với Intersection Observer
  - Add Next.js Image optimization integration
  - Implement error handling và retry logic
  - Add progressive loading với blur placeholder
  - _Requirements: 4.1, 5.2, 5.4_

- [x] 5. Implement permission và authentication services
  - Tạo PermissionService với Supabase Auth integration
  - Implement registrant ownership validation
  - Add admin role checking logic
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 5.1 Implement PermissionService
  - Tạo `lib/services/permission.ts` với `canManageAvatar` function
  - Implement user role checking với existing UserRole types
  - Add registrant ownership validation qua registration.user_id
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 5.2 Add authentication middleware cho avatar APIs
  - Implement auth checking trong avatar API endpoints
  - Add proper error responses (401, 403, 404)
  - Implement logging cho admin actions
  - _Requirements: 8.4, 8.5, 8.6_

- [x] 6. Implement desktop avatar upload và crop functionality
  - Tạo AvatarUploadDialog component cho desktop
  - Implement drag-drop file upload với validation
  - Tạo desktop crop interface với mouse controls
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.3, 6.4_

- [x] 6.1 Tạo AvatarUploadDialog component
  - Implement modal dialog với drag-drop zone
  - Add file validation (type, size, format)
  - Implement file preview và basic info display
  - Add error handling với user-friendly messages
  - _Requirements: 1.2, 1.3_

- [x] 6.2 Implement desktop crop interface
  - Tạo CropCanvas component với mouse wheel zoom
  - Add crop controls: zoom slider, rotate, flip buttons
  - Implement grid overlay và aspect ratio lock
  - Add keyboard shortcuts (Escape, Enter, +/-, R)
  - _Requirements: 1.4, 6.3, 6.4_

- [x] 6.3 Integrate crop với compression workflow
  - Implement crop-then-compress pipeline
  - Add real-time preview của cropped result
  - Implement loading states during processing
  - Add error handling và retry capability
  - _Requirements: 1.5, 6.5, 6.6_

- [x] 7. Implement mobile avatar upload và crop functionality
  - Tạo mobile-specific upload interface với bottom sheet
  - Implement touch-friendly crop controls
  - Add gesture support (pinch-to-zoom, drag-to-pan)
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3_

- [x] 7.1 Tạo mobile upload interface
  - Implement bottom action sheet với "Chụp ảnh", "Chọn từ thư viện", "Xóa avatar"
  - Add native camera integration
  - Implement mobile file picker với proper MIME types
  - Add touch-friendly button sizing (minimum 44px)
  - _Requirements: 1.2, 1.3, 6.1, 6.2_

- [x] 7.2 Implement mobile crop interface
  - Tạo full-screen crop overlay cho mobile
  - Add pinch-to-zoom gesture support
  - Implement drag-to-pan với touch events
  - Add double-tap-to-fit functionality
  - _Requirements: 1.4, 6.1, 6.2, 6.3_

- [x] 7.3 Add mobile-specific controls và animations
  - Implement simplified crop controls (zoom slider, reset, rotate)
  - Add bottom action bar với "Hủy" và "Lưu" buttons
  - Implement smooth animations cho sheet transitions
  - Add haptic feedback cho touch interactions
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 8. Implement avatar management API endpoints
  - Tạo POST /api/registrants/[id]/avatar endpoint
  - Implement PUT /api/registrants/[id]/avatar endpoint
  - Tạo DELETE /api/registrants/[id]/avatar endpoint
  - Add GET /api/registrants/[id]/avatar endpoint
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 8.1 Implement POST avatar upload endpoint
  - Tạo `app/api/registrants/[id]/avatar/route.ts`
  - Add multipart form data handling
  - Implement permission checking và validation
  - Add image processing và Supabase Storage upload
  - Update registrants table với new portrait_url
  - _Requirements: 7.1, 7.5_

- [x] 8.2 Implement PUT avatar update endpoint
  - Add logic để update existing avatar
  - Implement old file cleanup từ storage
  - Add proper error handling và rollback
  - _Requirements: 7.2_

- [x] 8.3 Implement DELETE avatar endpoint
  - Add avatar deletion logic
  - Implement storage file cleanup
  - Update registrants table (set portrait_url = null)
  - Add admin action logging
  - _Requirements: 7.3_

- [x] 8.4 Implement GET avatar info endpoint
  - Return current avatar URL và metadata
  - Add caching headers cho performance
  - Implement proper error responses
  - _Requirements: 7.4, 7.6_

- [x] 9. Implement main AvatarManager component
  - Tạo unified AvatarManager component
  - Add device detection và conditional rendering
  - Implement state management cho upload/edit/delete flows
  - _Requirements: 1.1, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9.1 Tạo AvatarManager component
  - Implement props interface với registrantId, currentAvatarUrl, size, editable
  - Add device detection để render appropriate interface
  - Implement state management cho dialog visibility
  - Add onAvatarChange callback cho parent components
  - _Requirements: 1.1, 1.6_

- [x] 9.2 Implement edit và delete functionality
  - Add hover overlay cho desktop với edit/delete buttons
  - Implement touch-friendly edit trigger cho mobile
  - Add delete confirmation dialog
  - Implement optimistic updates với rollback capability
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 10. Integrate avatar display across existing components
  - Update RegistrationsList component để show avatars
  - Add avatar display trong registration detail views
  - Update ticket generation để include avatars
  - _Requirements: 4.1, 4.3, 4.4, 4.5_

- [x] 10.1 Update admin RegistrationsList component
  - Add avatar column trong desktop table view
  - Implement avatar display trong mobile card view
  - Add click-to-manage functionality cho admins
  - _Requirements: 3.1, 3.2, 4.3_

- [x] 10.2 Update registration detail components
  - Add avatar display trong registrant detail views
  - Implement edit capability cho own registrants
  - Add responsive sizing based on context
  - _Requirements: 4.4_

- [x] 10.3 Update ticket components
  - Integrate avatar display trong ticket generation
  - Maintain existing 80x80px sizing với 8px border radius
  - Add fallback handling cho missing avatars
  - _Requirements: 4.5_

- [x] 11. Implement accessibility và testing
  - Add comprehensive accessibility support
  - Implement keyboard navigation
  - Add screen reader support
  - Write unit và integration tests
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 11.1 Implement accessibility features
  - Add proper ARIA labels và descriptions
  - Implement keyboard navigation cho all interactive elements
  - Add focus management cho dialogs
  - Implement high contrast support
  - _Requirements: 6.1, 6.2_

- [x] 11.2 Add comprehensive testing
  - Write unit tests cho all components
  - Add integration tests cho upload/crop/delete flows
  - Implement cross-device testing scenarios
  - Add performance testing cho image processing
  - Test accessibility compliance
  - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [x] 12. Performance optimization và deployment
  - Implement lazy loading cho avatar lists
  - Add proper caching strategies
  - Optimize bundle size với code splitting
  - Add monitoring và analytics
  - _Requirements: 5.2, 5.4_

- [x] 12.1 Implement performance optimizations
  - Add lazy loading với Intersection Observer
  - Implement proper image caching strategies
  - Add code splitting cho crop dialog components
  - Optimize re-rendering với React.memo
  - _Requirements: 5.2, 5.4_

- [x] 12.2 Add monitoring và deployment preparation
  - Implement error tracking cho avatar operations
  - Add performance monitoring cho upload/crop times
  - Create deployment checklist
  - Add feature flag support cho gradual rollout
  - _Requirements: 5.1, 5.3, 5.5_