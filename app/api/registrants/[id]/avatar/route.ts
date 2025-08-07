import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  authenticateAndAuthorize,
  createErrorResponse,
  createSuccessResponse,
  validateAvatarFile,
  logAvatarAction,
  checkRateLimit
} from '@/lib/services/avatar-auth';
import { uploadAvatarWithRetry } from '@/lib/services/avatar-storage';


// Validation schema for avatar upload
const AvatarUploadSchema = z.object({
  cropData: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    scale: z.number(),
  }).optional(),
});

/**
 * POST /api/registrants/[id]/avatar
 * Upload and process avatar for a registrant
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const registrantId = params.id;

    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id, 5, 60000); // 5 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Too many requests. Please try again later.'
      }, { status: 429 });
    }

    // Verify user can access this registrant
    const { data: registrant, error: registrantError } = await supabase
      .from('registrants')
      .select('id, registration_id, registrations!inner(user_id)')
      .eq('id', registrantId)
      .single();

    if (registrantError || !registrant) {
      return NextResponse.json({ error: "Registrant not found" }, { status: 404 });
    }

    // Type assertion for registrations relationship
    const registration = registrant.registrations as unknown as { user_id: string };
    if (registration.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const fileValidation = validateAvatarFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json({
        error: fileValidation.error || 'Invalid file'
      }, { status: 400 });
    }

    // Note: Crop data is processed on client side, server just handles upload

    // Upload to storage (file is already compressed on client side)
    const uploadResult = await uploadAvatarWithRetry(
      user.id,
      registrantId,
      file,
      true // server-side
    );

    if (!uploadResult.success || !uploadResult.avatarUrl) {
      return NextResponse.json({
        error: uploadResult.error || 'Upload failed'
      }, { status: 500 });
    }

    // Update registrant record
    const { error: updateError } = await supabase
      .from('registrants')
      .update({
        portrait_url: uploadResult.avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrantId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update registrant record'
      }, { status: 500 });
    }

    // Log the action
    await logAvatarAction(
      'avatar_uploaded',
      user.id,
      user.email || '',
      'participant', // Default role, could be enhanced with actual role lookup
      registrantId,
      {
        file_size: file.size,
        file_type: file.type,
        admin_action: false,
        registrant_owner: user.id,
      }
    );

    return NextResponse.json({
      success: true,
      avatarUrl: uploadResult.avatarUrl,
    }, { status: 201 });

  } catch (error) {
    console.error('Avatar upload error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed",
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/registrants/[id]/avatar
 * Update existing avatar for a registrant
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const registrantId = params.id;
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id, 3, 60000); // 3 updates per minute
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Too many requests. Please try again later.'
      }, { status: 429 });
    }

    // Verify user can access this registrant
    const { data: registrant, error: registrantError } = await supabase
      .from('registrants')
      .select('id, registration_id, registrations!inner(user_id)')
      .eq('id', registrantId)
      .single();

    if (registrantError || !registrant) {
      return NextResponse.json({ error: "Registrant not found" }, { status: 404 });
    }

    // Type assertion for registrations relationship
    const registration = registrant.registrations as unknown as { user_id: string };
    if (registration.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const cropDataStr = formData.get('cropData') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const fileValidation = validateAvatarFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json({
        error: fileValidation.error || 'Invalid file'
      }, { status: 400 });
    }

    // Parse crop data if provided
    let cropData: CropData | undefined;
    if (cropDataStr) {
      try {
        cropData = AvatarUploadSchema.parse({ cropData: JSON.parse(cropDataStr) }).cropData;
      } catch (error) {
        console.error('Crop data validation error:', error);
        return NextResponse.json({
          error: 'Invalid crop data format',
          details: error instanceof z.ZodError ? error.errors : undefined
        }, { status: 400 });
      }
    }

    // Process image (crop and compress)
    const compressionResult = await compressAvatarImage(file, cropData);

    // Upload to storage (this will replace the existing file)
    const uploadResult = await uploadAvatarWithRetry(
      user.id,
      registrantId,
      compressionResult.file,
      true // server-side
    );

    if (!uploadResult.success || !uploadResult.avatarUrl) {
      return NextResponse.json({
        error: uploadResult.error || 'Upload failed'
      }, { status: 500 });
    }

    // Update registrant record
    const { error: updateError } = await supabase
      .from('registrants')
      .update({
        portrait_url: uploadResult.avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrantId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update registrant record'
      }, { status: 500 });
    }

    // Log the action
    await logAvatarAction(
      'avatar_updated',
      user.id,
      user.email || '',
      'participant',
      registrantId,
      {
        file_size: compressionResult.compressedSize,
        file_type: compressionResult.file.type,
        admin_action: false,
        registrant_owner: user.id,
        compression_ratio: compressionResult.compressionRatio,
        original_size: compressionResult.originalSize,
      }
    );

    return NextResponse.json({
      success: true,
      avatarUrl: uploadResult.avatarUrl,
      metadata: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
      }
    });

  } catch (error) {
    console.error('Avatar update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed",
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/registrants/[id]/avatar
 * Delete avatar for a registrant
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const registrantId = params.id;
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id, 5, 60000); // 5 deletes per minute
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Too many requests. Please try again later.'
      }, { status: 429 });
    }

    // Verify user can access this registrant and get current avatar URL
    const { data: registrant, error: registrantError } = await supabase
      .from('registrants')
      .select('id, portrait_url, registration_id, registrations!inner(user_id)')
      .eq('id', registrantId)
      .single();

    if (registrantError || !registrant) {
      return NextResponse.json({ error: "Registrant not found" }, { status: 404 });
    }

    // Type assertion for registrations relationship
    const registration = registrant.registrations as unknown as { user_id: string };
    if (registration.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Delete from storage if avatar exists
    if (registrant.portrait_url) {
      const { deleteAvatarWithRetry } = await import('@/lib/services/avatar-storage');
      const deleteResult = await deleteAvatarWithRetry(
        user.id,
        registrantId,
        true // server-side
      );

      if (!deleteResult.success) {
        console.error('Storage deletion failed:', deleteResult.error);
        // Continue with database update even if storage deletion fails
      }
    }

    // Update registrant record
    const { error: updateError } = await supabase
      .from('registrants')
      .update({ 
        portrait_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrantId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update registrant record'
      }, { status: 500 });
    }

    // Log the action
    await logAvatarAction(
      'avatar_deleted',
      user.id,
      user.email || '',
      'participant',
      registrantId,
      {
        admin_action: false,
        registrant_owner: user.id,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully'
    });

  } catch (error) {
    console.error('Avatar deletion error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/registrants/[id]/avatar
 * Get avatar information for a registrant
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const registrantId = params.id;

  try {
    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, registrantId);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(
        authResult.error || 'Authentication failed',
        authResult.statusCode || 401
      );
    }

    // Get registrant avatar info
    const supabase = await createClient();
    const { data: registrant, error: fetchError } = await supabase
      .from('registrants')
      .select('portrait_url, updated_at, full_name')
      .eq('id', registrantId)
      .single();

    if (fetchError) {
      return createErrorResponse('Registrant not found', 404);
    }

    return createSuccessResponse({
      avatarUrl: registrant.portrait_url,
      lastModified: registrant.updated_at,
      registrantName: registrant.full_name,
      hasAvatar: !!registrant.portrait_url,
    });

  } catch (error) {
    console.error('Avatar info error:', error);
    return createErrorResponse(
      'Internal server error',
      500
    );
  }
}