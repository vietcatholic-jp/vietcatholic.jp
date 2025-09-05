import { Registrant } from '@/lib/types';
import { generateBadgeImage } from '@/lib/ticket-utils';
import { generateCardsPDF, downloadCardsPDF } from '@/lib/pdf-export';
import { CardGenerationError, CardGenerationResult, CardImageData } from '@/lib/card-constants';

/**
 * Service chính để orchestrate quá trình tạo thẻ ID và ghép vào PDF A4
 * Tái sử dụng logic generateBadgeImage hiện có
 */
export class CardGeneratorService {
  private static instance: CardGeneratorService;

  private constructor() {}

  public static getInstance(): CardGeneratorService {
    if (!CardGeneratorService.instance) {
      CardGeneratorService.instance = new CardGeneratorService();
    }
    return CardGeneratorService.instance;
  }

  /**
   * Tạo thẻ cho một người dùng
   */
  public async generateSingleCard(registrant: Registrant): Promise<CardImageData | null> {
    try {
      // Sử dụng generateBadgeImage hiện có để tạo ảnh thẻ
      const imageDataUrl = await generateBadgeImage(registrant);
      
      if (!imageDataUrl) {
        throw new Error('Failed to generate badge image');
      }

      // Tạo CardImageData object
      const cardData: CardImageData = {
        id: `card-${registrant.id}`,
        userId: registrant.id,
        imageDataUrl,
        userInfo: {
          saintName: registrant.saint_name || '',
          fullName: registrant.full_name,
          role: registrant.event_role?.name || 'Tham dự viên'
        }
      };

      return cardData;
    } catch (error) {
      console.error(`Error generating card for ${registrant.full_name}:`, error);
      return null;
    }
  }

  /**
   * Tạo thẻ cho nhiều người dùng
   */
  public async generateCardsForUsers(
    registrants: Registrant[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<CardGenerationResult> {
    const cards: CardImageData[] = [];
    const errors: CardGenerationResult['errors'] = [];
    
    for (let i = 0; i < registrants.length; i++) {
      const registrant = registrants[i];
      
      try {
        const card = await this.generateSingleCard(registrant);
        
        if (card) {
          cards.push(card);
        } else {
          errors?.push({
            type: CardGenerationError.CANVAS_ERROR,
            message: `Failed to generate card for ${registrant.full_name}`,
            userId: registrant.id
          });
        }
      } catch (error) {
        errors?.push({
          type: CardGenerationError.CANVAS_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
          userId: registrant.id
        });
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, registrants.length);
      }

      // Small delay to prevent browser blocking
      if (i < registrants.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: cards.length > 0,
      cards,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Tạo thẻ cho team
   */
  public async generateTeamCards(
    teamMembers: Registrant[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<CardGenerationResult> {
    return this.generateCardsForUsers(teamMembers, onProgress);
  }

  /**
   * Tạo và xuất PDF với layout A4
   */
  public async generateAndExportPDF(
    registrants: Registrant[],
    filename?: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate cards
      const result = await this.generateCardsForUsers(registrants, onProgress);
      
      if (!result.success || !result.cards || result.cards.length === 0) {
        return {
          success: false,
          error: 'Không thể tạo thẻ nào'
        };
      }

      // Generate and download PDF
      await downloadCardsPDF(result.cards, filename);
      
      return { success: true };
    } catch (error) {
      console.error('Error generating and exporting PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  }

  /**
   * Tạo PDF blob (không download)
   */
  public async generatePDFBlob(
    registrants: Registrant[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ blob?: Blob; error?: string }> {
    try {
      // Generate cards
      const result = await this.generateCardsForUsers(registrants, onProgress);
      
      if (!result.success || !result.cards || result.cards.length === 0) {
        return {
          error: 'Không thể tạo thẻ nào'
        };
      }

      // Generate PDF blob
      const blob = await generateCardsPDF(result.cards);
      
      return { blob };
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return {
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  }

  /**
   * Lấy thông tin preview cho cards
   */
  public async getCardsPreview(
    registrants: Registrant[],
    maxCards: number = 12
  ): Promise<CardImageData[]> {
    const previewRegistrants = registrants.slice(0, maxCards);
    const result = await this.generateCardsForUsers(previewRegistrants);
    
    return result.cards || [];
  }

  /**
   * Validate registrants trước khi tạo thẻ
   */
  public validateRegistrants(registrants: Registrant[]): {
    valid: Registrant[];
    invalid: { registrant: Registrant; reason: string }[];
  } {
    const valid: Registrant[] = [];
    const invalid: { registrant: Registrant; reason: string }[] = [];

    for (const registrant of registrants) {
      if (!registrant.full_name || registrant.full_name.trim() === '') {
        invalid.push({
          registrant,
          reason: 'Thiếu họ và tên'
        });
        continue;
      }

      if (!registrant.id) {
        invalid.push({
          registrant,
          reason: 'Thiếu ID'
        });
        continue;
      }

      valid.push(registrant);
    }

    return { valid, invalid };
  }

  /**
   * Ước tính số trang PDF
   */
  public estimatePDFPages(cardCount: number): number {
    return Math.ceil(cardCount / 4); // 4 cards per page
  }

  /**
   * Lấy thống kê về cards sẽ được tạo
   */
  public getCardStats(registrants: Registrant[]): {
    total: number;
    organizers: number;
    participants: number;
    withPhoto: number;
    withoutPhoto: number;
    estimatedPages: number;
  } {
    const total = registrants.length;
    let organizers = 0;
    let participants = 0;
    let withPhoto = 0;
    let withoutPhoto = 0;

    for (const registrant of registrants) {
      if (registrant.event_role?.name) {
        organizers++;
      } else {
        participants++;
      }

      if (registrant.portrait_url) {
        withPhoto++;
      } else {
        withoutPhoto++;
      }
    }

    return {
      total,
      organizers,
      participants,
      withPhoto,
      withoutPhoto,
      estimatedPages: this.estimatePDFPages(total)
    };
  }
}

// Export singleton instance
export const cardGeneratorService = CardGeneratorService.getInstance();
