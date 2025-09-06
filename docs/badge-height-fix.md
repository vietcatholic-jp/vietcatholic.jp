# Badge Height Fix in PDF Export

## Problem
The badges in PDF export appeared shorter than expected, while individual badge downloads (ZIP) maintained correct proportions.

## Root Cause
The issue was in the `A4_LAYOUT` constants in `/lib/card-constants.ts`. The badge generation creates badges with dimensions of `400px x 600px` (2:3 aspect ratio), but the PDF layout was using:
- Card width: 95mm
- Card height: 130mm (aspect ratio ≈ 1.37:1)

This mismatch caused the badges to be vertically compressed when placed in the PDF.

## Solution
Updated the `A4_LAYOUT` constants to maintain the correct 2:3 aspect ratio:

```typescript
// Before
CARD_WIDTH: 95, // mm
CARD_HEIGHT: 130, // mm
MARGIN: 10, // mm
CARD_SPACING: 4 // mm

// After  
CARD_WIDTH: 90, // mm
CARD_HEIGHT: 135, // mm (maintains 2:3 aspect ratio: 90 * 1.5 = 135)
MARGIN: 8, // mm
CARD_SPACING: 3 // mm
```

## Layout Verification
- **Total height**: 8 + 135 + 3 + 135 + 8 = 289mm (fits in A4 height of 297mm)
- **Total width**: 8 + 90 + 3 + 90 + 8 = 199mm (fits in A4 width of 210mm)
- **Aspect ratio**: 90:135 = 2:3 (matches the original badge design)

## Impact
- ✅ PDF badges now maintain correct proportions
- ✅ Individual ZIP downloads remain unchanged (already correct)
- ✅ All cards still fit properly on A4 pages (4 cards per page)
- ✅ No breaking changes to existing functionality

## Files Modified
- `/lib/card-constants.ts` - Updated A4_LAYOUT dimensions

This fix ensures that badges in PDF exports will have the same proportions as individual downloads, resolving the "shorter height" issue.
