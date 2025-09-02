# Implementation Plan

## Status: Core Implementation Complete ✅
**Current State:** Major components implemented and functional. System ready for testing and refinement.

**Verification Results:**
- ✅ Spec documents exist (requirements.md, design.md, tasks.md)
- ✅ Admin card generator page created (app/(protected)/admin/card-generator/)
- ✅ API endpoints created (/api/admin/card-generator)
- ✅ Card components created (components/cards/)
- ✅ Card template assets created (public/assets/card-templates/)
- ✅ CardGeneratorService and related services in lib/services/
- ✅ Admin navigation menu item added
- ✅ Test page created (/test-card)
- ✅ PDF export functionality implemented
- ✅ Error handling and testing framework

**Existing Assets to Leverage:**
- ✅ Badge generator system (components/badges/) - similar HTML5 Canvas patterns
- ✅ PDF export utilities (lib/pdf-export.ts) - A4 layout and Vietnamese font support
- ✅ Admin layout patterns (app/(protected)/admin/) - consistent admin page structure
- ✅ Ticket generator (components/tickets/) - html2canvas usage patterns
- ✅ Avatar management system - existing portrait handling

### Ready to Start Implementation
**Recommended Starting Point:** Task 1.1 - Copy and adapt existing badge generator

### Implementation Strategy:
**Copy & Adapt Approach:** Leverage existing badge generator system (components/badges/) as foundation
- Badge generator already has HTML5 Canvas, html2canvas, and image processing
- Similar layout patterns and Vietnamese text handling
- Proven AutoSizeText component and export functionality

### Implementation Dependencies:
1. **Foundation (Tasks 1-2)**: Copy badge system and adapt for ID cards
2. **Templates (Task 3)**: Create ID card specific templates and layouts  
3. **Services (Tasks 4-5)**: Adapt existing services for ID card requirements
4. **UI Layer (Tasks 6-7)**: Build admin interface using existing patterns
5. **Integration (Tasks 8-9)**: Wire into admin system and navigation
6. **Quality (Tasks 10-13)**: APIs, error handling, testing, optimization

- [x] 1. Copy and adapt existing badge generator system
  - [x] 1.1 Copy badge generator components to card generator
    - Copy components/badges/badge-generator.tsx to components/cards/card-generator.tsx
    - Copy components/badges/batch-badge-generator.tsx to components/cards/batch-card-generator.tsx
    - Rename interfaces and props from Badge* to Card*
    - Update component names and file references
    - _Requirements: 1.1, 1.2, 3.2, 3.3_

  - [x] 1.2 Adapt card generator for ID card layout
    - Modify card dimensions from badge size to ID card size (85.6mm x 53.98mm)
    - Update layout sections for ID card format (horizontal instead of vertical)
    - Adjust text positioning and sizing for ID card proportions
    - Update background image references to use ID card templates
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 1.3 Create TypeScript interfaces for ID cards
    - Add CardData, CardType, CardTemplate interfaces to lib/types.ts
    - Define card generation service interfaces
    - Set up constants for ID card dimensions and A4 layout (4 cards per page)
    - Update existing badge interfaces to be reusable for cards
    - _Requirements: 1.2, 3.1, 4.1_

- [x] 2. Create ID card templates and assets
  - [x] 2.1 Create ID card template images
    - Design 4 ID card template backgrounds (85.6mm x 53.98mm)
    - Create organizer template (with role badge area)
    - Create participant template (standard layout)
    - Save templates to public/assets/card-templates/
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.2 Adapt template service from badge system
    - Copy template loading logic from badge generator
    - Update template paths to use card-templates directory
    - Modify template selection logic for ID card types
    - Configure positioning data for horizontal ID card layout
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 3. Adapt image processing for ID cards
  - [x] 3.1 Copy and modify html2canvas logic from badge generator
    - Copy html2canvas implementation from badge-generator.tsx
    - Update canvas dimensions for ID card format (horizontal layout)
    - Modify scale and quality settings for ID card export
    - Adapt onclone callback for ID card specific elements
    - _Requirements: 1.4, 1.5, 1.6, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2_

  - [x] 3.2 Update AutoSizeText component for ID cards
    - Copy AutoSizeText component from badge generator
    - Adjust font sizing calculations for horizontal ID card layout
    - Update container width calculations for ID card proportions
    - Test text fitting with Vietnamese characters on ID cards
    - _Requirements: 1.4, 1.5, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Extend PDF generation for ID cards
  - [x] 4.1 Copy and adapt batch PDF generation from badge system
    - Copy batch generation logic from batch-badge-generator.tsx
    - Update PDF layout calculations for ID card dimensions
    - Implement A4 layout with 4 ID cards per page (2x2 grid)
    - Calculate exact positions with 4mm spacing between cards
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.3, 5.4_

  - [x] 4.2 Integrate with existing PDF export service
    - Extend lib/pdf-export.ts with ID card specific functions
    - Reuse existing jsPDF setup and Vietnamese font support
    - Add ID card PDF generation methods to existing service
    - Handle multi-page PDF generation for large card batches
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Create ID card generation service
  - [x] 5.1 Adapt badge generation service for ID cards
    - Copy service logic from badge generation system
    - Modify data transformation for ID card format
    - Update generation methods for horizontal layout
    - Adapt error handling for ID card specific requirements
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Reuse existing data integration patterns
    - Copy user and team data fetching from badge system
    - Reuse existing avatar loading and storage integration
    - Adapt data queries for ID card generation requirements
    - Maintain compatibility with existing user/team APIs
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Build admin ID card generator page
  - [x] 6.1 Create admin page structure using existing patterns
    - Create app/(protected)/admin/card-generator/page.tsx following admin/users/page.tsx pattern
    - Copy admin layout and permission structure from existing admin pages
    - Implement role-based access control (event_organizer, registration_manager, etc.)
    - Add page to admin navigation menu
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.2 Copy and adapt user selection from existing admin components
    - Copy user selection logic from existing admin/users components
    - Adapt team selection from admin/teams components
    - Reuse existing filter and search patterns
    - Add ID card specific selection options (role filtering)
    - _Requirements: 1.1, 2.1, 2.2, 6.1, 6.2, 6.3_

  - [x] 6.3 Create ID card generation interface
    - Build card generation UI similar to test-badge page layout
    - Add batch selection and preview functionality
    - Implement generation progress tracking
    - Add export options (individual PNG, batch PDF)
    - _Requirements: 1.1, 2.1, 2.2, 6.1, 6.2_

- [x] 7. Create ID card preview and review system
  - [x] 7.1 Adapt card preview from badge generator
    - Copy preview layout from test-badge page horizontal scroll design
    - Modify for ID card dimensions and layout
    - Add A4 page preview mode showing 4 cards per page
    - Implement card selection checkboxes for batch operations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.2 Copy and adapt batch review functionality
    - Copy batch generation patterns from batch-badge-generator.tsx
    - Create review modal for batch ID card operations
    - Add card removal and editing options in batch mode
    - Implement A4 page navigation for large batches
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.3 Add individual card editing capabilities
    - Copy edit functionality patterns from badge generator
    - Allow editing card type, names, and avatar selection
    - Implement real-time preview updates during editing
    - Add save/cancel options for individual card changes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Copy and adapt export functionality
  - [x] 8.1 Copy PDF export from batch badge generator
    - Copy batch PDF generation from batch-badge-generator.tsx
    - Adapt for ID card A4 layout (4 cards per page)
    - Add export progress tracking and user feedback
    - Implement automatic file download with proper naming
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.2 Copy individual image export from badge generator
    - Copy individual PNG export from badge-generator.tsx
    - Adapt download functionality for ID card format
    - Add batch image download option (ZIP file)
    - Reuse existing html2canvas optimization techniques
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 9. Integrate with existing admin system
  - [x] 9.1 Copy admin navigation patterns
    - Copy admin menu structure from components/admin/admin-layout
    - Add "Tạo thẻ ID" menu item following existing patterns
    - Copy permission validation from existing admin pages
    - Ensure proper role-based access control
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.2 Add quick export buttons to existing admin pages
    - Copy button patterns from existing admin components
    - Add TeamCardExportButton to team management pages
    - Add IndividualCardExportButton to user detail pages
    - Implement quick export bypassing full workflow
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.3 Set up ID card template assets
    - Create public/assets/card-templates/ directory
    - Add 4 ID card template images (horizontal format)
    - Copy asset loading patterns from badge system
    - Test template serving and caching
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 10. Copy and adapt API endpoints
  - [x] 10.1 Copy API patterns from existing admin endpoints
    - Copy API structure from app/api/admin/users/route.ts
    - Create /api/admin/card-generator endpoint
    - Copy authentication and permission validation patterns
    - Adapt data fetching for ID card generation needs
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 10.2 Reuse existing data APIs
    - Leverage existing user and team APIs for data fetching
    - Copy template serving patterns from badge system
    - Add ID card specific configuration endpoints
    - Implement proper caching and error handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Copy error handling patterns
  - [x] 11.1 Copy client-side error handling from badge generator
    - Copy error handling patterns from badge-generator.tsx
    - Adapt error boundaries for ID card generation components
    - Copy user-friendly error messages and retry mechanisms
    - Add ID card specific error scenarios and handling
    - _Requirements: 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.2 Copy server-side error handling from existing APIs
    - Copy error handling patterns from existing admin API endpoints
    - Adapt logging and error reporting for ID card operations
    - Copy fallback mechanisms from badge and template systems
    - Implement proper error responses and status codes
    - _Requirements: 5.5_

- [x] 12. Copy and adapt testing patterns
  - [x] 12.1 Copy unit test patterns from existing codebase
    - Copy test structure from existing service tests
    - Adapt badge generator tests for ID card services
    - Test ID card generation with various user data combinations
    - Copy PDF generation test patterns from existing tests
    - _Requirements: All requirements_

  - [x] 12.2 Copy integration test patterns from admin tests
    - Copy admin page test patterns from existing e2e tests
    - Adapt badge generation workflow tests for ID cards
    - Test ID card preview and batch operations
    - Copy export functionality test patterns
    - _Requirements: All requirements_

- [x] 13. Copy optimization and polish patterns
  - [x] 13.1 Copy performance optimizations from badge generator
    - Copy batching and progress tracking from batch-badge-generator.tsx
    - Copy template and avatar caching mechanisms from badge system
    - Adapt canvas optimization techniques for ID card format
    - Copy memory management patterns for large batch operations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 13.2 Copy UI polish patterns from existing admin components
    - Copy loading states and user feedback patterns from admin components
    - Copy accessibility patterns from existing admin pages
    - Adapt responsive design patterns for ID card interface
    - Copy keyboard navigation and screen reader support
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_