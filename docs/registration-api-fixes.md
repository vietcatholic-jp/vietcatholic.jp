# Registration API Route Fixes

## Issues Fixed in `/app/api/registrations/[id]/route.ts`

### 1. **Missing Registrants Handling**
**Problem**: The API assumed registrations always have registrants, but some registrations were created without any registrants.

**Fix**: 
- Added null checks for `registration.registrants`
- Only attempt to delete existing registrants if they exist
- Safely handle empty registrants arrays in ticket checking logic

### 2. **Confirmed Registration Editing**
**Problem**: The API blocked all editing of confirmed registrations, but users with missing registrants need to complete their information even if the registration is confirmed.

**Fix**:
- Allow editing of confirmed registrations IF they have no registrants (missing registrant data)
- Block editing only if tickets exist OR (registration is confirmed AND has registrants)
- This allows users to complete missing information while protecting completed registrations

### 3. **Event Config Handling**
**Problem**: API might fail if event config is missing or invalid.

**Fix**:
- Added fallback logic for missing event configs
- Try to get active event config if registration doesn't have one
- Use default pricing (6000) as ultimate fallback
- Added warning logging for missing configs

## Key Logic Changes

### Before:
```typescript
// Blocked ALL confirmed registrations
if (registration.status === 'confirmed' || hasTickets) {
  return error;
}

// Deleted registrants without checking if they exist
const { error: deleteError } = await supabase
  .from("registrants")
  .delete()
  .eq("registration_id", id);
```

### After:
```typescript
// Allow editing if no registrants exist (missing data case)
const hasNoRegistrants = !registration.registrants || registration.registrants.length === 0;

// Block only if tickets exist OR (confirmed AND has registrants)
if (hasTickets || (registration.status === 'confirmed' && !hasNoRegistrants)) {
  return error;
}

// Only delete registrants if they exist
if (registration.registrants && registration.registrants.length > 0) {
  const { error: deleteError } = await supabase
    .from("registrants")
    .delete()
    .eq("registration_id", id);
}
```

## Use Cases Now Supported

1. **Missing Registrants + Pending Status**: ✅ Can edit
2. **Missing Registrants + Confirmed Status**: ✅ Can edit (special case)
3. **Has Registrants + Pending Status**: ✅ Can edit  
4. **Has Registrants + Confirmed Status**: ❌ Cannot edit (protected)
5. **Has Tickets**: ❌ Cannot edit (protected)

## Benefits

- **Backward Compatibility**: Existing registrations continue to work
- **Data Recovery**: Users can complete missing registrant information
- **Safety**: Protects completed registrations from unwanted changes
- **Flexibility**: Handles edge cases gracefully
- **Robustness**: Fails gracefully with fallback pricing

## Testing Scenarios

1. ✅ User with missing registrants can access edit page
2. ✅ User with missing registrants can save their information
3. ✅ Confirmed registrations with complete data remain protected
4. ✅ Registrations with tickets remain protected
5. ✅ API handles missing event configs gracefully
