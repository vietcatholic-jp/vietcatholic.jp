# Event Scoping Implementation

This document outlines how event scoping has been implemented across the finance management system.

## Database Changes

### 1. Added event_config_id columns
- **receipts** table: Added `event_config_id uuid REFERENCES public.event_configs(id)`
- **cancel_requests** table: Added `event_config_id uuid REFERENCES public.event_configs(id)`

### 2. Data backfill
```sql
-- Backfill receipts
UPDATE public.receipts r 
SET event_config_id = reg.event_config_id 
FROM public.registrations reg 
WHERE reg.id = r.registration_id 
AND r.event_config_id IS NULL;

-- Backfill cancel_requests
UPDATE public.cancel_requests c 
SET event_config_id = reg.event_config_id 
FROM public.registrations reg 
WHERE reg.id = c.registration_id 
AND c.event_config_id IS NULL;
```

### 3. Indexes created
- `idx_receipts_event_config_id` on receipts(event_config_id)
- `idx_cancel_requests_event_config_id` on cancel_requests(event_config_id)

## API Implementation

### Cashier APIs (Event Scoped)
All cashier API endpoints require `event_config_id` and filter operations by event:

1. **Payment Confirmation**: `/api/cashier/payments/{registrationId}/confirm`
   - Requires `event_config_id` in request body
   - Only processes payments for specified event

2. **Payment Rejection**: `/api/cashier/payments/{registrationId}/reject`
   - Requires `event_config_id` in request body
   - Only processes payments for specified event

3. **Cancel Request Processing**: `/api/cashier/cancel-requests/{id}/process`
   - Requires `event_config_id` in request body
   - Only processes cancel requests for specified event

### Finance APIs (Event Scoped)

1. **Donations**: `/api/donations`
   - All donations tied to specific `event_config_id`
   - Public donor roll filtered by event
   - Admin management scoped to events

2. **Expense Requests**: `/api/expenses`
   - All expense requests tied to `event_config_id`
   - User can only see requests for events they have access to
   - Admin operations scoped by event

## Frontend Implementation

### Cashier Dashboard
- Operates on single active event (configurable)
- All payment/refund operations scoped to active event
- Event selector for different events (future enhancement)

### Registration Manager
- Payment confirmation actions removed for non-cashiers
- Cancel request processing limited to approval/rejection only
- Approved requests show "waiting for cashier" message

### Finance Management
- Donations management scoped to events
- Expense requests filtered by event access
- Public donor roll can be filtered by event

## Active Event Strategy

Currently, the system uses a mock active event ID in the frontend. In production, this should be implemented as:

1. **User Context**: Store active event in user session/context
2. **Admin Selection**: Allow admins to select which event to work on
3. **Default Event**: Use the most recent active event as default
4. **Event Switching**: Provide UI to switch between events

### Recommended Implementation:
```typescript
// Context provider for active event
export const ActiveEventProvider = ({ children }) => {
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  
  // Load user's default active event
  useEffect(() => {
    const loadActiveEvent = async () => {
      // Fetch user's active event or default to most recent
      const eventId = await fetchUserActiveEvent();
      setActiveEventId(eventId);
    };
    loadActiveEvent();
  }, []);
  
  return (
    <ActiveEventContext.Provider value={{ activeEventId, setActiveEventId }}>
      {children}
    </ActiveEventContext.Provider>
  );
};
```

## Security Considerations

1. **RLS Policies**: All new tables have RLS enabled with event-scoped policies
2. **API Validation**: All API endpoints validate event access before operations
3. **Role-Based Access**: Combined event scoping with role-based permissions
4. **Cross-Event Protection**: Users cannot access data from unauthorized events

## Migration Checklist

- [x] Database schema updates (migration file created)
- [x] API endpoints respect event scoping
- [x] Frontend components use event context
- [x] RLS policies include event scoping
- [x] Cashier role separation implemented
- [x] Registration manager actions updated
- [x] Storage bucket structure follows event scoping

## Testing Requirements

Before deployment, verify:
1. Cashiers can only access their assigned event data
2. Registration managers cannot confirm/reject payments
3. Event organizers can only create expense requests for their events
4. Admin operations are properly scoped to events
5. Public donor roll correctly filters by event
6. Storage access respects event boundaries

## Future Enhancements

1. **Multi-Event Support**: Allow users to work across multiple events
2. **Event Templates**: Reusable templates for finance setup
3. **Cross-Event Reporting**: Aggregate reporting across events
4. **Event Archival**: Archive completed events with data retention
5. **Event Permissions**: Fine-grained permissions per event per user