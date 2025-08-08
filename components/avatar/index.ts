// Main avatar management component
export { AvatarManager } from './avatar-manager';

// Core display components
export { AvatarDisplay } from './avatar-display';
export { AvatarImage } from './avatar-image';
export { AvatarPlaceholder } from './avatar-placeholder';

// Desktop workflow components
export { DesktopAvatarWorkflow } from './desktop-avatar-workflow';
export { AvatarUploadDialog } from './avatar-upload-dialog';
export { AvatarCropDialog } from './avatar-crop-dialog';
export { AvatarCropProcessor } from './avatar-crop-processor';

// Mobile workflow components
export { MobileAvatarWorkflow } from './mobile-avatar-workflow';
export { MobileAvatarUploadSheet } from './mobile-avatar-upload-sheet';
export { MobileAvatarCropSheet } from './mobile-avatar-crop-sheet';

// Mobile animations and utilities
export { 
  MobileAnimationWrapper,
  TouchFeedbackButton,
  MobileLoadingSpinner,
  MobileProgressIndicator,
  SwipeGesture,
  mobileAnimations
} from './mobile-avatar-animations';

// Types
export type { AvatarManagerProps } from './avatar-manager';
export type { AvatarDisplayProps } from './avatar-display';
export type { AvatarImageProps } from './avatar-image';
export type { AvatarPlaceholderProps } from './avatar-placeholder';