import { test, expect } from '@playwright/test';

/**
 * Avatar API Integration Tests
 * Tests the avatar upload/delete API endpoints
 */

test.describe('Avatar API Endpoints', () => {
  let authToken: string;
  let registrantId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'dev.thubv@gmail.com',
        password: '123456'
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    
    // Extract auth token from response or cookies
    const cookies = await loginResponse.headerValue('set-cookie');
    authToken = cookies || '';
    
    // Get a test registrant ID
    const profileResponse = await request.get('/api/profile', {
      headers: {
        'Cookie': authToken
      }
    });
    
    const profileData = await profileResponse.json();
    registrantId = profileData.registrants?.[0]?.id || 'test-registrant-id';
  });

  test.describe('POST /api/registrants/[id]/avatar', () => {
    test('should upload avatar successfully with valid image', async ({ request }) => {
      // Create form data with image file
      const formData = new FormData();
      const imageBuffer = Buffer.from('fake-image-data');
      const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('file', imageBlob, 'avatar.jpg');

      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'avatar.jpg',
            mimeType: 'image/jpeg',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.avatarUrl).toBeDefined();
      expect(responseData.avatarUrl).toContain('http');
    });

    test('should reject invalid file types', async ({ request }) => {
      const formData = new FormData();
      const textBuffer = Buffer.from('not-an-image');
      const textBlob = new Blob([textBuffer], { type: 'text/plain' });
      formData.append('file', textBlob, 'document.txt');

      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'document.txt',
            mimeType: 'text/plain',
            buffer: textBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('định dạng không hợp lệ');
    });

    test('should reject files that are too large', async ({ request }) => {
      // Create a large file (> 5MB)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const largeBlob = new Blob([largeBuffer], { type: 'image/jpeg' });

      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'large-avatar.jpg',
            mimeType: 'image/jpeg',
            buffer: largeBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('quá lớn');
    });

    test('should require authentication', async ({ request }) => {
      const imageBuffer = Buffer.from('fake-image-data');

      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        multipart: {
          file: {
            name: 'avatar.jpg',
            mimeType: 'image/jpeg',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(401);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Unauthorized');
    });

    test('should validate registrant ownership', async ({ request }) => {
      const imageBuffer = Buffer.from('fake-image-data');
      const invalidRegistrantId = 'invalid-registrant-id';

      const response = await request.post(`/api/registrants/${invalidRegistrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'avatar.jpg',
            mimeType: 'image/jpeg',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(403);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('không có quyền');
    });

    test('should handle missing file', async ({ request }) => {
      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        data: {}
      });

      expect(response.status()).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Không có file');
    });
  });

  test.describe('PUT /api/registrants/[id]/avatar', () => {
    test('should update existing avatar', async ({ request }) => {
      // First upload an avatar
      const initialImageBuffer = Buffer.from('initial-image-data');
      await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'initial-avatar.jpg',
            mimeType: 'image/jpeg',
            buffer: initialImageBuffer
          }
        }
      });

      // Then update it
      const updatedImageBuffer = Buffer.from('updated-image-data');
      const response = await request.put(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'updated-avatar.jpg',
            mimeType: 'image/jpeg',
            buffer: updatedImageBuffer
          }
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.avatarUrl).toBeDefined();
    });
  });

  test.describe('DELETE /api/registrants/[id]/avatar', () => {
    test('should delete avatar successfully', async ({ request }) => {
      // First upload an avatar
      const imageBuffer = Buffer.from('image-to-delete');
      await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'avatar-to-delete.jpg',
            mimeType: 'image/jpeg',
            buffer: imageBuffer
          }
        }
      });

      // Then delete it
      const response = await request.delete(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
    });

    test('should handle deleting non-existent avatar', async ({ request }) => {
      const response = await request.delete(`/api/registrants/non-existent-id/avatar`, {
        headers: {
          'Cookie': authToken
        }
      });

      expect(response.status()).toBe(404);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('không tìm thấy');
    });

    test('should require authentication for deletion', async ({ request }) => {
      const response = await request.delete(`/api/registrants/${registrantId}/avatar`);

      expect(response.status()).toBe(401);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Unauthorized');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle server errors gracefully', async ({ request }) => {
      // Mock a server error by using invalid data
      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken,
          'Content-Type': 'application/json' // Wrong content type for file upload
        },
        data: { invalid: 'data' }
      });

      expect(response.status()).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toBeDefined();
    });

    test('should validate request format', async ({ request }) => {
      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        data: 'invalid-request-body'
      });

      expect(response.status()).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toBeDefined();
    });
  });

  test.describe('Performance', () => {
    test('should respond within acceptable time limits', async ({ request }) => {
      const startTime = Date.now();
      
      const imageBuffer = Buffer.from('performance-test-image');
      const response = await request.post(`/api/registrants/${registrantId}/avatar`, {
        headers: {
          'Cookie': authToken
        },
        multipart: {
          file: {
            name: 'performance-avatar.jpg',
            mimeType: 'image/jpeg',
            buffer: imageBuffer
          }
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});
