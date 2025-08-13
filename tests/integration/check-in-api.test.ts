import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Integration tests for Check-in API
test.describe('Check-in API Integration', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let testUserId: string;
  let testRegistrantId: string;
  let authToken: string;

  test.beforeEach(async () => {
    // Setup test user with registration_manager role
    const testUser = await setupTestUser();
    testUserId = testUser.id;
    authToken = testUser.token;

    // Setup test registrant
    const testRegistrant = await setupTestRegistrant();
    testRegistrantId = testRegistrant.id;
  });

  test.afterEach(async () => {
    // Cleanup test data
    await cleanupTestUser(testUserId);
    await cleanupTestRegistrant(testRegistrantId);
  });

  test('POST /api/check-in - should successfully check in valid registrant', async ({ request }) => {
    const response = await request.post('/api/check-in', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        registrantId: testRegistrantId
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.registrant.id).toBe(testRegistrantId);
    expect(data.registrant.is_checked_in).toBe(true);
    expect(data.registrant.checked_in_at).toBeTruthy();
    expect(data.message).toContain('Check-in thành công');
  });

  test('POST /api/check-in - should reject unauthorized request', async ({ request }) => {
    const response = await request.post('/api/check-in', {
      data: {
        registrantId: testRegistrantId
      }
    });

    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('Unauthorized');
  });

  test('POST /api/check-in - should reject user without proper role', async ({ request }) => {
    // Create user with participant role
    const participantUser = await setupTestUser('participant');
    
    try {
      const response = await request.post('/api/check-in', {
        headers: {
          'Authorization': `Bearer ${participantUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          registrantId: testRegistrantId
        }
      });

      expect(response.status()).toBe(403);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Forbidden');
    } finally {
      await cleanupTestUser(participantUser.id);
    }
  });

  test('POST /api/check-in - should reject invalid registrant ID', async ({ request }) => {
    const response = await request.post('/api/check-in', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        registrantId: 'invalid-id'
      }
    });

    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('Không tìm thấy thông tin');
  });

  test('POST /api/check-in - should reject already checked-in registrant', async ({ request }) => {
    // First check-in
    await request.post('/api/check-in', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        registrantId: testRegistrantId
      }
    });

    // Second check-in attempt
    const response = await request.post('/api/check-in', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        registrantId: testRegistrantId
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('đã check-in trước đó');
  });

  test('POST /api/check-in - should reject unconfirmed registration', async ({ request }) => {
    // Create registrant with pending registration
    const pendingRegistrant = await setupTestRegistrant('pending');
    
    try {
      const response = await request.post('/api/check-in', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          registrantId: pendingRegistrant.id
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('chưa được xác nhận thanh toán');
    } finally {
      await cleanupTestRegistrant(pendingRegistrant.id);
    }
  });

  test('GET /api/check-in - should return check-in statistics', async ({ request }) => {
    // Perform some check-ins first
    await request.post('/api/check-in', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        registrantId: testRegistrantId
      }
    });

    const response = await request.get('/api/check-in', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.totalConfirmed).toBeGreaterThanOrEqual(1);
    expect(data.totalCheckedIn).toBeGreaterThanOrEqual(1);
    expect(data.checkInRate).toBeTruthy();
    expect(data.todayCheckins).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(data.recentCheckins)).toBe(true);
  });

  test('GET /api/check-in - should reject unauthorized request', async ({ request }) => {
    const response = await request.get('/api/check-in');

    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });
});

// Helper functions for test setup
async function setupTestUser(role = 'registration_manager') {
  // Create test user in Supabase
  const email = `test-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // Update user role
  const { error: updateError } = await supabase
    .from('users')
    .update({ role })
    .eq('id', authData.user!.id);

  if (updateError) throw updateError;

  return {
    id: authData.user!.id,
    email,
    token: authData.session!.access_token
  };
}

async function setupTestRegistrant(registrationStatus = 'confirmed') {
  // Create test registration and registrant
  const testUserId = crypto.randomUUID();
  
  // First create a user for the registration
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: testUserId,
      email: `registrant-${Date.now()}@example.com`,
      full_name: 'Test Registrant',
      role: 'participant'
    })
    .select()
    .single();

  if (userError) throw userError;

  // Create registration
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .insert({
      user_id: testUserId,
      invoice_code: `TEST-${Date.now()}`,
      participant_count: 1,
      status: registrationStatus,
      total_amount: 50000
    })
    .select()
    .single();

  if (regError) throw regError;

  // Create registrant
  const { data: registrant, error: registrantError } = await supabase
    .from('registrants')
    .insert({
      registration_id: registration.id,
      full_name: 'Test Registrant',
      email: `registrant-${Date.now()}@example.com`,
      diocese: 'Test Diocese',
      gender: 'male',
      age_group: '18-30',
      shirt_size: 'M',
      is_primary: true
    })
    .select()
    .single();

  if (registrantError) throw registrantError;

  return registrant;
}

async function cleanupTestUser(userId: string) {
  // Clean up test user data
  await supabase.auth.admin.deleteUser(userId);
  await supabase.from('users').delete().eq('id', userId);
}

async function cleanupTestRegistrant(registrantId: string) {
  // Clean up test registrant and related data
  const { data: registrant } = await supabase
    .from('registrants')
    .select('registration:registrations(user_id)')
    .eq('id', registrantId)
    .single();

  if (registrant) {
    await supabase.from('registrants').delete().eq('id', registrantId);
    await supabase.from('registrations').delete().eq('id', (registrant as any).registration.id);
    await supabase.from('users').delete().eq('id', (registrant as any).registration.user_id);
  }
}
