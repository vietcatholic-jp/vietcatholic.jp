# Team Download Functionality Implementation

## Summary
Successfully implemented comprehensive ticket and badge download functionality for team leaders and sub-leaders in the my-team page.

## New Components Created

### 1. TeamDownloads Component (`/components/my-team/team-downloads.tsx`)
- **Purpose**: Provides batch download functionality for tickets and badges
- **Features**:
  - Bulk selection of confirmed team members
  - ZIP download for tickets (PNG format)
  - ZIP download for badges (PNG format)  
  - PDF export for badges using cardGeneratorService
  - Search functionality to filter members
  - Progress tracking with ProgressDialog
  - Error handling and user feedback
  - Cancellation support during generation

### 2. Enhanced MemberCard Component (`/components/my-team/member-card.tsx`)
- **Purpose**: Adds individual download buttons to each member card
- **Features**:
  - Individual ticket download (PNG)
  - Individual badge download (PNG)
  - Download buttons only show for confirmed members
  - Loading states during generation
  - Toast notifications for success/error feedback

## Key Functions

### Batch Downloads (TeamDownloads)
- `handleGenerateTickets()`: Creates ZIP file with all selected member tickets
- `handleGenerateBadges()`: Creates ZIP file with all selected member badges  
- `handleGeneratePdf()`: Generates PDF file with all selected member badges
- `convertToRegistrant()`: Converts TeamMember to Registrant format for utilities

### Individual Downloads (MemberCard)
- `handleDownloadTicket()`: Downloads single member ticket
- `handleDownloadBadge()`: Downloads single member badge
- Type conversion with proper error handling

## User Interface Features

### TeamDownloads UI
- Search bar to filter members
- Select all/deselect all functionality
- Action buttons for different download types:
  - "Tải vé ZIP" - Download tickets as ZIP
  - "Tải thẻ ZIP" - Download badges as ZIP  
  - "Tải thẻ PDF" - Download badges as PDF
- Member list with checkboxes for selection
- Progress dialog with:
  - Real-time progress tracking
  - Status messages
  - Cancellation option
  - Success/error states

### MemberCard UI
- Individual download buttons for confirmed members:
  - "Vé" button with ticket icon
  - "Thẻ" button with card icon
- Loading states with spinner animations
- Only visible for members with 'confirmed' status

## Integration

### My-Team Page Updates
- Added TeamDownloads component between TeamOverview and MemberList
- Proper error boundary integration
- Type-safe member data passing

### Dependencies
- Reuses existing utilities:
  - `generateTicketImage` from `/lib/ticket-utils`
  - `generateBadgeImage` from `/lib/ticket-utils`
  - `cardGeneratorService` from `/lib/services/card-generator-service`
- Uses existing UI components:
  - ProgressDialog from `/components/badges/progress-dialog`
  - Standard UI components (Button, Card, Input, etc.)

## Permission Model
- Available to team leaders and sub-leaders only
- Only confirmed team members can have downloads generated
- Same access control as existing my-team functionality

## File Formats
- **Tickets**: PNG images with QR codes and member information
- **Badges**: PNG images with member photos and event details
- **PDF Badges**: Multi-page PDF with professional badge layout
- **ZIP Archives**: Organized with descriptive filenames

## Error Handling
- Network/generation errors are caught and displayed
- Type conversion errors handled gracefully
- User-friendly error messages via toast notifications
- Progress dialog shows error states with retry options

## Performance Considerations
- Batch processing to prevent browser hanging
- Configurable batch sizes (default: 5 concurrent generations)
- Memory management with URL cleanup
- Cancellation support for long operations

## Future Enhancements
- Could add export to Excel/CSV formats
- Bulk email sending of tickets/badges
- Print-ready layouts
- Custom badge templates per team

This implementation provides a complete download solution that enhances the team management workflow while maintaining consistency with the existing application design and architecture.
