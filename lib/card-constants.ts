// Card Generation Constants
// Based on design.md specifications

// Card Types
export enum CardType {
  ORGANIZER_WITH_PHOTO = 'organizer_with_photo',
  ORGANIZER_WITHOUT_PHOTO = 'organizer_without_photo', 
  PARTICIPANT_WITH_PHOTO = 'participant_with_photo',
  PARTICIPANT_WITHOUT_PHOTO = 'participant_without_photo'
}

// Card Dimensions (in pixels at 300 DPI)
export const CARD_DIMENSIONS = {
  width: 1122, // pixels
  height: 1535, // pixels
  dpi: 300
} as const;

// A4 PDF Layout Constants (in mm)
export const A4_LAYOUT = {
  PAGE_WIDTH: 210, // mm
  PAGE_HEIGHT: 297, // mm
  MARGIN: 8, // mm 
  CARD_WIDTH: 90, // mm (slightly reduced to maintain aspect ratio)
  CARD_HEIGHT: 135, // mm (maintains 2:3 aspect ratio: 90 * 1.5 = 135)
  CARD_SPACING: 3 // mm between cards
} as const;

// Calculate positions for 4 cards on A4
export const CARD_POSITIONS = [
  { 
    x: A4_LAYOUT.MARGIN, 
    y: A4_LAYOUT.MARGIN 
  }, // Top left
  { 
    x: A4_LAYOUT.MARGIN + A4_LAYOUT.CARD_WIDTH + A4_LAYOUT.CARD_SPACING, 
    y: A4_LAYOUT.MARGIN 
  }, // Top right
  { 
    x: A4_LAYOUT.MARGIN, 
    y: A4_LAYOUT.MARGIN + A4_LAYOUT.CARD_HEIGHT + A4_LAYOUT.CARD_SPACING 
  }, // Bottom left
  { 
    x: A4_LAYOUT.MARGIN + A4_LAYOUT.CARD_WIDTH + A4_LAYOUT.CARD_SPACING, 
    y: A4_LAYOUT.MARGIN + A4_LAYOUT.CARD_HEIGHT + A4_LAYOUT.CARD_SPACING 
  } // Bottom right
] as const;

// Template Asset Paths
export const TEMPLATE_ASSETS = {
  [CardType.ORGANIZER_WITH_PHOTO]: '/assets/card-templates/organizer-with-photo.png',
  [CardType.ORGANIZER_WITHOUT_PHOTO]: '/assets/card-templates/organizer-without-photo.png',
  [CardType.PARTICIPANT_WITH_PHOTO]: '/assets/card-templates/participant-with-photo.png',
  [CardType.PARTICIPANT_WITHOUT_PHOTO]: '/assets/card-templates/participant-without-photo.png'
} as const;

// Text Position Interface
export interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
}

// Font Configuration Interface
export interface FontConfig {
  family: string;
  size: number;
  color: string;
  weight: string;
}

// Template Configuration Interface
export interface TemplateConfig {
  backgroundAsset: string;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
  };
  textPositions: {
    saintName: Position;
    fullName: Position;
    role?: Position;
  };
  avatarPosition?: Position;
  fontConfig: {
    saintName: FontConfig;
    fullName: FontConfig;
    role?: FontConfig;
  };
}

// Default Template Configurations
export const TEMPLATE_CONFIGS: Record<CardType, TemplateConfig> = {
  [CardType.ORGANIZER_WITH_PHOTO]: {
    backgroundAsset: TEMPLATE_ASSETS[CardType.ORGANIZER_WITH_PHOTO],
    dimensions: CARD_DIMENSIONS,
    textPositions: {
      saintName: { x: 561, y: 1200, align: 'center' },
      fullName: { x: 561, y: 1280, align: 'center' },
      role: { x: 561, y: 1360, align: 'center' }
    },
    avatarPosition: { x: 411, y: 800, width: 300, height: 300 },
    fontConfig: {
      saintName: { family: 'Arial', size: 32, color: '#666666', weight: 'normal' },
      fullName: { family: 'Arial', size: 40, color: '#000000', weight: 'bold' },
      role: { family: 'Arial', size: 28, color: '#0066cc', weight: 'normal' }
    }
  },
  [CardType.ORGANIZER_WITHOUT_PHOTO]: {
    backgroundAsset: TEMPLATE_ASSETS[CardType.ORGANIZER_WITHOUT_PHOTO],
    dimensions: CARD_DIMENSIONS,
    textPositions: {
      saintName: { x: 561, y: 1000, align: 'center' },
      fullName: { x: 561, y: 1100, align: 'center' },
      role: { x: 561, y: 1200, align: 'center' }
    },
    fontConfig: {
      saintName: { family: 'Arial', size: 36, color: '#666666', weight: 'normal' },
      fullName: { family: 'Arial', size: 48, color: '#000000', weight: 'bold' },
      role: { family: 'Arial', size: 32, color: '#0066cc', weight: 'normal' }
    }
  },
  [CardType.PARTICIPANT_WITH_PHOTO]: {
    backgroundAsset: TEMPLATE_ASSETS[CardType.PARTICIPANT_WITH_PHOTO],
    dimensions: CARD_DIMENSIONS,
    textPositions: {
      saintName: { x: 561, y: 1200, align: 'center' },
      fullName: { x: 561, y: 1280, align: 'center' }
    },
    avatarPosition: { x: 411, y: 800, width: 300, height: 300 },
    fontConfig: {
      saintName: { family: 'Arial', size: 32, color: '#666666', weight: 'normal' },
      fullName: { family: 'Arial', size: 40, color: '#000000', weight: 'bold' }
    }
  },
  [CardType.PARTICIPANT_WITHOUT_PHOTO]: {
    backgroundAsset: TEMPLATE_ASSETS[CardType.PARTICIPANT_WITHOUT_PHOTO],
    dimensions: CARD_DIMENSIONS,
    textPositions: {
      saintName: { x: 561, y: 1000, align: 'center' },
      fullName: { x: 561, y: 1100, align: 'center' }
    },
    fontConfig: {
      saintName: { family: 'Arial', size: 36, color: '#666666', weight: 'normal' },
      fullName: { family: 'Arial', size: 48, color: '#000000', weight: 'bold' }
    }
  }
};

// Card Data Interface
export interface CardData {
  id: string;
  userId: string;
  cardType: CardType;
  imageBlob: Blob;
  userInfo: UserInfo;
}

// User Info Interface for Card Generation
export interface UserInfo {
  saintName: string;
  fullName: string;
  role: string;
  avatar?: string;
  cardType: CardType;
}

// Card Image Data Interface (for PDF generation)
export interface CardImageData {
  id: string;
  userId: string;
  imageDataUrl: string;
  userInfo: {
    saintName: string;
    fullName: string;
    role?: string;
  };
}

// A4 Card Page Interface
export interface A4CardPage {
  cards: CardImageData[]; // Maximum 4 cards per page
  layout: CardLayout[];
}

// Card Layout Interface
export interface CardLayout {
  card: CardImageData;
  position: {
    x: number; // mm
    y: number; // mm
  };
}

// Error Types
export enum CardGenerationError {
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  AVATAR_LOAD_FAILED = 'AVATAR_LOAD_FAILED',
  CANVAS_ERROR = 'CANVAS_ERROR',
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED'
}

// Card Generation Result Interface
export interface CardGenerationResult {
  success: boolean;
  cards?: CardImageData[];
  errors?: {
    type: CardGenerationError;
    message: string;
    userId?: string;
  }[];
}
