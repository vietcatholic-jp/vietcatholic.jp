import {
  CardType,
  TemplateConfig,
  TEMPLATE_CONFIGS,
  TEMPLATE_ASSETS
} from '@/lib/card-constants';

/**
 * Service for managing card templates and configurations
 * Handles template loading, validation, and configuration retrieval
 */
export class TemplateService {
  private static instance: TemplateService;
  private templateCache: Map<CardType, HTMLImageElement> = new Map();

  private constructor() {}

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Get template configuration for a specific card type
   */
  public getTemplate(cardType: CardType): TemplateConfig {
    const config = TEMPLATE_CONFIGS[cardType];
    if (!config) {
      throw new Error(`Template configuration not found for card type: ${cardType}`);
    }
    return config;
  }

  /**
   * Get asset path for a specific card type
   */
  public getAssetPath(cardType: CardType): string {
    const assetPath = TEMPLATE_ASSETS[cardType];
    if (!assetPath) {
      throw new Error(`Template asset path not found for card type: ${cardType}`);
    }
    return assetPath;
  }

  /**
   * Load and cache template image
   */
  public async loadTemplateImage(cardType: CardType): Promise<HTMLImageElement> {
    // Check cache first
    if (this.templateCache.has(cardType)) {
      return this.templateCache.get(cardType)!;
    }

    const assetPath = this.getAssetPath(cardType);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Cache the loaded image
        this.templateCache.set(cardType, img);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load template image: ${assetPath}`));
      };
      
      // Set timeout for loading
      setTimeout(() => {
        reject(new Error(`Template image loading timeout: ${assetPath}`));
      }, 10000);
      
      img.src = assetPath;
    });
  }

  /**
   * Validate template configuration
   */
  public validateTemplate(cardType: CardType): boolean {
    try {
      const config = this.getTemplate(cardType);
      const assetPath = this.getAssetPath(cardType);
      
      // Check required properties
      if (!config.backgroundAsset || !config.dimensions || !config.textPositions || !config.fontConfig) {
        return false;
      }
      
      // Check dimensions
      if (config.dimensions.width <= 0 || config.dimensions.height <= 0) {
        return false;
      }
      
      // Check text positions
      if (!config.textPositions.saintName || !config.textPositions.fullName) {
        return false;
      }
      
      // Check font configurations
      if (!config.fontConfig.saintName || !config.fontConfig.fullName) {
        return false;
      }
      
      // Check asset path
      if (!assetPath || assetPath.trim() === '') {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Template validation error:', error);
      return false;
    }
  }

  /**
   * Get all available card types
   */
  public getAvailableCardTypes(): CardType[] {
    return Object.values(CardType);
  }

  /**
   * Determine card type based on user role and avatar availability
   */
  public determineCardType(role: string, hasAvatar: boolean): CardType {
    const isOrganizer = role.toLowerCase().includes('organizer') || 
                       role.toLowerCase().includes('tổ chức') ||
                       role.toLowerCase().includes('ban tổ chức');
    
    if (isOrganizer) {
      return hasAvatar ? CardType.ORGANIZER_WITH_PHOTO : CardType.ORGANIZER_WITHOUT_PHOTO;
    } else {
      return hasAvatar ? CardType.PARTICIPANT_WITH_PHOTO : CardType.PARTICIPANT_WITHOUT_PHOTO;
    }
  }

  /**
   * Get template dimensions in different units
   */
  public getTemplateDimensions(cardType: CardType, unit: 'px' | 'mm' = 'px') {
    const config = this.getTemplate(cardType);
    const { width, height, dpi } = config.dimensions;
    
    if (unit === 'mm') {
      // Convert pixels to mm (1 inch = 25.4 mm)
      const widthMm = (width / dpi) * 25.4;
      const heightMm = (height / dpi) * 25.4;
      return { width: widthMm, height: heightMm };
    }
    
    return { width, height };
  }

  /**
   * Clear template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Preload all templates
   */
  public async preloadAllTemplates(): Promise<void> {
    const cardTypes = this.getAvailableCardTypes();
    const loadPromises = cardTypes.map(cardType => 
      this.loadTemplateImage(cardType).catch(error => {
        console.warn(`Failed to preload template ${cardType}:`, error);
        return null;
      })
    );
    
    await Promise.all(loadPromises);
  }

  /**
   * Get template info for debugging
   */
  public getTemplateInfo(cardType: CardType) {
    const config = this.getTemplate(cardType);
    const assetPath = this.getAssetPath(cardType);
    const isValid = this.validateTemplate(cardType);
    const isCached = this.templateCache.has(cardType);
    
    return {
      cardType,
      assetPath,
      isValid,
      isCached,
      dimensions: config.dimensions,
      hasAvatarPosition: !!config.avatarPosition,
      textPositions: Object.keys(config.textPositions),
      fontConfigs: Object.keys(config.fontConfig)
    };
  }
}

// Export singleton instance
export const templateService = TemplateService.getInstance();
