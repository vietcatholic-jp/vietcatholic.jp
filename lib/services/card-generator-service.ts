import { Registrant } from '@/lib/types';
import { generateBadgeImage } from '@/lib/ticket-utils';
import { generateCardsPDF, downloadCardsPDF } from '@/lib/pdf-export';
import { CardGenerationError, CardGenerationResult, CardImageData } from '@/lib/card-constants';
import JSZip from 'jszip';
import { format } from 'date-fns';

/**
 * Service chính để orchestrate quá trình tạo thẻ ID và ghép vào PDF A4
 * Tái sử dụng logic generateBadgeImage hiện có
 */
export class CardGeneratorService {
  private static instance: CardGeneratorService;
  private static readonly MAX_CARDS_PER_PDF = 12;

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
   * Tạo và xuất PDF với layout A4 - tự động split thành nhiều PDF nếu cần
   */
  public async generateAndExportPDF(
    registrants: Registrant[],
    filename?: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Nếu ít hơn hoặc bằng MAX_CARDS_PER_PDF, tạo PDF đơn lẻ
      if (registrants.length <= CardGeneratorService.MAX_CARDS_PER_PDF) {
        const result = await this.generateCardsForUsers(registrants, onProgress);
        
        if (!result.success || !result.cards || result.cards.length === 0) {
          return {
            success: false,
            error: 'Không thể tạo thẻ nào'
          };
        }

        await downloadCardsPDF(result.cards, filename);
        return { success: true };
      }

      // Nếu nhiều hơn MAX_CARDS_PER_PDF, tạo và zip nhiều PDF
      return await this.generateAndExportMultiplePDFs(registrants, filename, onProgress);
    } catch (error) {
      console.error('Error generating and exporting PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  }

  /**
   * Tạo và xuất nhiều PDF files trong một ZIP archive
   */
  public async generateAndExportMultiplePDFs(
    registrants: Registrant[],
    baseFilename?: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const batches = this.createBatches(registrants, CardGeneratorService.MAX_CARDS_PER_PDF);
      const zip = new JSZip();
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
      const zipFilename = baseFilename ? `${baseFilename}_${timestamp}.zip` : `cards_${timestamp}.zip`;

      let completedCards = 0;
      const totalCards = registrants.length;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;
        const pdfFilename = `cards_batch_${batchNumber.toString().padStart(2, '0')}.pdf`;

        // Generate cards for this batch
        const result = await this.generateCardsForUsers(batch, (batchCompleted) => {
          const totalCompleted = completedCards + batchCompleted;
          if (onProgress) {
            onProgress(totalCompleted, totalCards);
          }
        });

        if (!result.success || !result.cards || result.cards.length === 0) {
          console.warn(`Failed to generate cards for batch ${batchNumber}`);
          continue;
        }

        // Generate PDF blob for this batch
        const pdfBlob = await generateCardsPDF(result.cards);
        
        // Add PDF to ZIP
        zip.file(pdfFilename, pdfBlob);

        completedCards += batch.length;

        // Small delay between batches to prevent browser blocking
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Create download link and trigger download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error generating and exporting multiple PDFs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  }

  /**
   * Chia registrants thành các batches với kích thước tối đa
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Tạo PDF blob (không download) - hỗ trợ batching nếu quá nhiều registrants
   */
  public async generatePDFBlob(
    registrants: Registrant[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ blob?: Blob; error?: string }> {
    try {
      // Nếu ít hơn hoặc bằng MAX_CARDS_PER_PDF, tạo PDF đơn lẻ
      if (registrants.length <= CardGeneratorService.MAX_CARDS_PER_PDF) {
        const result = await this.generateCardsForUsers(registrants, onProgress);
        
        if (!result.success || !result.cards || result.cards.length === 0) {
          return {
            error: 'Không thể tạo thẻ nào'
          };
        }

        const blob = await generateCardsPDF(result.cards);
        return { blob };
      }

      // Nếu nhiều hơn MAX_CARDS_PER_PDF, cảnh báo và chỉ lấy 12 đầu tiên
      console.warn(`Too many registrants (${registrants.length}), taking only first ${CardGeneratorService.MAX_CARDS_PER_PDF} for single PDF`);
      const limitedRegistrants = registrants.slice(0, CardGeneratorService.MAX_CARDS_PER_PDF);
      
      const result = await this.generateCardsForUsers(limitedRegistrants, onProgress);
      
      if (!result.success || !result.cards || result.cards.length === 0) {
        return {
          error: 'Không thể tạo thẻ nào'
        };
      }

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
    estimatedPDFs: number;
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
      estimatedPages: this.estimatePDFPages(total),
      estimatedPDFs: Math.ceil(total / CardGeneratorService.MAX_CARDS_PER_PDF)
    };
  }

  /**
   * Kiểm tra xem có cần tạo nhiều PDF không
   */
  public requiresMultiplePDFs(registrantCount: number): boolean {
    return registrantCount > CardGeneratorService.MAX_CARDS_PER_PDF;
  }

  /**
   * Lấy số lượng PDF sẽ được tạo
   */
  public getEstimatedPDFCount(registrantCount: number): number {
    return Math.ceil(registrantCount / CardGeneratorService.MAX_CARDS_PER_PDF);
  }

  /**
   * Lấy thông tin về việc chia batch
   */
  public getBatchInfo(registrants: Registrant[]): {
    totalRegistrants: number;
    batchCount: number;
    maxCardsPerBatch: number;
    lastBatchSize: number;
    willCreateZip: boolean;
  } {
    const totalRegistrants = registrants.length;
    const batchCount = Math.ceil(totalRegistrants / CardGeneratorService.MAX_CARDS_PER_PDF);
    const lastBatchSize = totalRegistrants % CardGeneratorService.MAX_CARDS_PER_PDF || CardGeneratorService.MAX_CARDS_PER_PDF;
    
    return {
      totalRegistrants,
      batchCount,
      maxCardsPerBatch: CardGeneratorService.MAX_CARDS_PER_PDF,
      lastBatchSize,
      willCreateZip: this.requiresMultiplePDFs(totalRegistrants)
    };
  }
}

// Export singleton instance
export const cardGeneratorService = CardGeneratorService.getInstance();
