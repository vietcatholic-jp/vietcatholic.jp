/**
 * Finance System Role Gates Tests
 * Tests role-based access control for finance APIs
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock data for testing
const mockUsers = {
  super_admin: { id: 'admin-123', role: 'super_admin', full_name: 'Super Admin' },
  regional_admin: { id: 'regional-123', role: 'regional_admin', full_name: 'Regional Admin' },
  cashier: { id: 'cashier-123', role: 'cashier_role', full_name: 'Cashier User' },
  organizer: { id: 'organizer-123', role: 'event_organizer', full_name: 'Event Organizer' },
  participant: { id: 'participant-123', role: 'participant', full_name: 'Regular User' }
};

const mockEvent = { id: 'event-123', name: 'Test Event' };

const mockDonation = {
  id: 'donation-123',
  event_config_id: mockEvent.id,
  donor_name: 'Test Donor',
  amount: 10000,
  status: 'pledged',
  public_identity: false
};

const mockExpense = {
  id: 'expense-123',
  event_config_id: mockEvent.id,
  description: 'Test Expense',
  amount: 5000,
  status: 'pending',
  created_by_user: mockUsers.organizer.id
};

// Mock fetch and auth functions
let mockAuthUser: any = null;
let mockSupabaseData: any = {};

beforeEach(() => {
  // Reset mocks
  mockAuthUser = null;
  mockSupabaseData = {};
  
  // Mock global fetch
  global.fetch = jest.fn();
  
  // Mock Supabase client
  jest.doMock('@/lib/supabase/server', () => ({
    createClient: () => ({
      auth: {
        getUser: () => Promise.resolve({ 
          data: { user: mockAuthUser }, 
          error: null 
        })
      },
      from: (table: string) => ({
        select: (fields?: string) => ({
          eq: (field: string, value: any) => ({
            single: () => Promise.resolve({
              data: mockSupabaseData[table]?.[0] || null,
              error: null
            }),
            range: (start: number, end: number) => Promise.resolve({
              data: mockSupabaseData[table] || [],
              error: null
            })
          }),
          range: (start: number, end: number) => Promise.resolve({
            data: mockSupabaseData[table] || [],
            error: null
          })
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({
              data: { ...data, id: 'new-id-123' },
              error: null
            })
          })
        }),
        update: (data: any) => ({
          eq: (field: string, value: any) => ({
            select: () => ({
              single: () => Promise.resolve({
                data: { ...mockSupabaseData[table]?.[0], ...data },
                error: null
              })
            })
          })
        })
      })
    })
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Donations API Role Gates', () => {
  test('super_admin can create donations', async () => {
    mockAuthUser = mockUsers.super_admin;
    mockSupabaseData.users = [mockUsers.super_admin];
    
    const response = await fetch('/api/finance/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        donor_name: 'Test Donor',
        amount: 10000
      })
    });
    
    expect(response.status).not.toBe(403);
  });

  test('regional_admin can create donations', async () => {
    mockAuthUser = mockUsers.regional_admin;
    mockSupabaseData.users = [mockUsers.regional_admin];
    
    const response = await fetch('/api/finance/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        donor_name: 'Test Donor',
        amount: 10000
      })
    });
    
    expect(response.status).not.toBe(403);
  });

  test('cashier_role can create donations', async () => {
    mockAuthUser = mockUsers.cashier;
    mockSupabaseData.users = [mockUsers.cashier];
    
    const response = await fetch('/api/finance/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        donor_name: 'Test Donor',
        amount: 10000
      })
    });
    
    expect(response.status).not.toBe(403);
  });

  test('participant cannot create donations', async () => {
    mockAuthUser = mockUsers.participant;
    mockSupabaseData.users = [mockUsers.participant];
    
    const response = await fetch('/api/finance/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        donor_name: 'Test Donor',
        amount: 10000
      })
    });
    
    expect(response.status).toBe(403);
  });
});

describe('Expenses API Role Gates', () => {
  test('event_organizer can create expense requests', async () => {
    mockAuthUser = mockUsers.organizer;
    mockSupabaseData.users = [mockUsers.organizer];
    
    const response = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        description: 'Test Expense',
        amount: 5000,
        bank_account_holder: 'Test User',
        bank_name: 'Test Bank',
        bank_account_number: '123456789'
      })
    });
    
    expect(response.status).not.toBe(403);
  });

  test('participant cannot create expense requests', async () => {
    mockAuthUser = mockUsers.participant;
    mockSupabaseData.users = [mockUsers.participant];
    
    const response = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        description: 'Test Expense',
        amount: 5000,
        bank_account_holder: 'Test User',
        bank_name: 'Test Bank',
        bank_account_number: '123456789'
      })
    });
    
    expect(response.status).toBe(403);
  });

  test('admins can approve expense requests', async () => {
    mockAuthUser = mockUsers.super_admin;
    mockSupabaseData.users = [mockUsers.super_admin];
    mockSupabaseData.expense_requests = [mockExpense];
    
    const response = await fetch(`/api/finance/expenses/${mockExpense.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        approved_amount: 5000
      })
    });
    
    expect(response.status).not.toBe(403);
  });

  test('cashiers can mark approved requests as transferred', async () => {
    mockAuthUser = mockUsers.cashier;
    mockSupabaseData.users = [mockUsers.cashier];
    mockSupabaseData.expense_requests = [{ ...mockExpense, status: 'approved' }];
    
    const response = await fetch(`/api/finance/expenses/${mockExpense.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'transferred',
        transfer_fee: 500
      })
    });
    
    expect(response.status).not.toBe(403);
  });

  test('cashiers cannot approve expense requests', async () => {
    mockAuthUser = mockUsers.cashier;
    mockSupabaseData.users = [mockUsers.cashier];
    mockSupabaseData.expense_requests = [mockExpense];
    
    const response = await fetch(`/api/finance/expenses/${mockExpense.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        approved_amount: 5000
      })
    });
    
    expect(response.status).toBe(403);
  });

  test('organizers cannot approve their own requests', async () => {
    mockAuthUser = mockUsers.organizer;
    mockSupabaseData.users = [mockUsers.organizer];
    mockSupabaseData.expense_requests = [mockExpense];
    
    const response = await fetch(`/api/finance/expenses/${mockExpense.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        approved_amount: 5000
      })
    });
    
    expect(response.status).toBe(403);
  });
});

describe('Public Donations API', () => {
  test('anonymous users can view public donations', async () => {
    // No auth user (anonymous)
    mockSupabaseData.donations = [
      { ...mockDonation, status: 'received', public_identity: true }
    ];
    
    const response = await fetch('/api/donations/public');
    
    expect(response.status).toBe(200);
  });

  test('public donations only shows received donations with public identity', async () => {
    mockSupabaseData.donations = [
      { ...mockDonation, status: 'received', public_identity: true },
      { ...mockDonation, id: 'donation-124', status: 'pledged', public_identity: true },
      { ...mockDonation, id: 'donation-125', status: 'received', public_identity: false }
    ];
    
    const response = await fetch('/api/donations/public');
    const data = await response.json();
    
    // Should only return donations that are received AND public
    expect(data.donations).toHaveLength(1);
    expect(data.donations[0].id).toBe('donation-123');
  });
});

describe('API Validation Tests', () => {
  test('donation creation requires valid UUID for event_config_id', async () => {
    mockAuthUser = mockUsers.super_admin;
    mockSupabaseData.users = [mockUsers.super_admin];
    
    const response = await fetch('/api/finance/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: 'invalid-uuid',
        donor_name: 'Test Donor',
        amount: 10000
      })
    });
    
    expect(response.status).toBe(400);
  });

  test('donation creation requires positive amount', async () => {
    mockAuthUser = mockUsers.super_admin;
    mockSupabaseData.users = [mockUsers.super_admin];
    
    const response = await fetch('/api/finance/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        donor_name: 'Test Donor',
        amount: -1000
      })
    });
    
    expect(response.status).toBe(400);
  });

  test('expense creation requires positive amount', async () => {
    mockAuthUser = mockUsers.organizer;
    mockSupabaseData.users = [mockUsers.organizer];
    
    const response = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        description: 'Test Expense',
        amount: 0,
        bank_account_holder: 'Test User',
        bank_name: 'Test Bank',
        bank_account_number: '123456789'
      })
    });
    
    expect(response.status).toBe(400);
  });

  test('expense creation requires all required fields', async () => {
    mockAuthUser = mockUsers.organizer;
    mockSupabaseData.users = [mockUsers.organizer];
    
    const response = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_config_id: mockEvent.id,
        description: 'Test Expense',
        amount: 5000
        // Missing bank details
      })
    });
    
    expect(response.status).toBe(400);
  });
});