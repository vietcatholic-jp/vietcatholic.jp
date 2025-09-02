# Design Document

## Overview

Hệ thống tạo thẻ ID sẽ là một trang riêng trong admin dashboard, cho phép quản trị viên chọn người dùng theo đội/nhóm hoặc theo vai trò (ban tổ chức/tham dự viên) để tạo thẻ hàng loạt. Hệ thống bao gồm màn hình review để xem trước, chỉnh sửa từng thẻ trước khi xuất PDF. Hệ thống sử dụng dữ liệu người dùng đã có trong database để tạo thẻ với 4 loại khác nhau, sử dụng HTML5 Canvas để đè thông tin lên các template asset có sẵn, sau đó xuất ra PDF với layout 4 thẻ/trang A4.

## User Flow

```
1. Admin chọn filter (Teams/Role) 
   ↓
2. Chọn users từ danh sách
   ↓  
3. Click "Tạo thẻ" → Generate cards
   ↓
4. Màn hình Review:
   - Xem preview tất cả thẻ
   - Edit từng thẻ (tên, loại thẻ, avatar)
   - Remove thẻ không cần
   - Xem layout A4 (4 thẻ/trang)
   ↓
5. Click "Xuất PDF" → Download file
```

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │────│  Card Generator │────│   PDF Export    │
│   Components    │    │    Service      │    │    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Data     │    │  Template       │    │   File System   │
│   Database      │    │  Assets         │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

```
Frontend Layer:
├── AdminCardGeneratorPage (Main admin page)
│   ├── TeamSelector (Select teams/groups)
│   ├── RoleFilter (Filter by organizer/participant)
│   ├── UserList (Display filtered users)
│   ├── CardPreview (Preview generated cards)
│   └── ExportControls (Export options and buttons)
├── TeamCardExportButton (Quick export from team pages)
├── IndividualCardExportButton (Quick export from user pages)
└── PDFExportDialog (Export progress and download)

Service Layer:
├── CardGeneratorService (Main business logic)
├── TemplateService (Template management)
├── ImageProcessingService (Canvas/image manipulation)
└── PDFGenerationService (PDF creation)

Data Layer:
├── UserRepository (User data access)
├── TeamRepository (Team data access)
└── AssetRepository (Template assets)
```

## Components and Interfaces

### Reusable Components from Existing Codebase

**1. Tái sử dụng từ TicketGenerator:**
- `html2canvas` để capture HTML element thành image
- Pattern tạo QR code và xử lý image
- Download functionality

**2. Tái sử dụng từ PDF Export Service:**
- `jsPDF` library đã có sẵn
- A4 layout constants và helper functions
- Vietnamese font support
- Page management và header/footer

**3. Tái sử dụng từ Admin Components:**
- Admin layout và navigation pattern
- User/Team selection components từ `admin/teams/`
- Filter và search functionality
- Loading states và error handling

### 1. CardGeneratorService (New)

**Purpose:** Orchestrate the card generation process, extend từ pattern của TicketGenerator

**Key Methods:**
```typescript
interface CardGeneratorService {
  generateSingleCard(userId: string, cardType: CardType): Promise<CardData>
  generateTeamCards(teamId: string): Promise<CardData[]>
  generateCardsForUsers(userIds: string[]): Promise<CardData[]>
}

interface CardData {
  id: string
  userId: string
  cardType: CardType
  imageBlob: Blob
  userInfo: UserInfo
}

enum CardType {
  ORGANIZER_WITH_PHOTO = 'organizer_with_photo',
  ORGANIZER_WITHOUT_PHOTO = 'organizer_without_photo',
  PARTICIPANT_WITH_PHOTO = 'participant_with_photo',
  PARTICIPANT_WITHOUT_PHOTO = 'participant_without_photo'
}
```

### 2. TemplateService

**Purpose:** Manage card templates and positioning

**Key Methods:**
```typescript
interface TemplateService {
  getTemplate(cardType: CardType): Promise<TemplateConfig>
  getAssetPath(cardType: CardType): string
}

interface TemplateConfig {
  backgroundAsset: string
  dimensions: {
    width: number // 1122px
    height: number // 1535px
    dpi: number // 300
  }
  textPositions: {
    saintName: Position
    fullName: Position
    role?: Position
  }
  avatarPosition?: Position
  fontConfig: FontConfig
}

interface Position {
  x: number
  y: number
  width?: number
  height?: number
  align?: 'left' | 'center' | 'right'
}

interface FontConfig {
  saintName: {
    family: string
    size: number
    color: string
    weight: string
  }
  fullName: {
    family: string
    size: number
    color: string
    weight: string
  }
  role?: {
    family: string
    size: number
    color: string
    weight: string
  }
}
```

### 3. ImageProcessingService

**Purpose:** Handle image manipulation and canvas operations

**Key Methods:**
```typescript
interface ImageProcessingService {
  createCardImage(
    template: TemplateConfig,
    userInfo: UserInfo,
    avatar?: Blob
  ): Promise<Blob>
  
  resizeAvatar(
    avatar: Blob,
    targetWidth: number,
    targetHeight: number
  ): Promise<Blob>
  
  overlayTextOnImage(
    baseImage: HTMLImageElement,
    text: string,
    position: Position,
    fontConfig: FontConfig
  ): void
}

interface UserInfo {
  saintName: string
  fullName: string
  role: string
  avatar?: string
  cardType: CardType
}
```

### 4. PDFGenerationService (Extend existing lib/pdf-export.ts)

**Purpose:** Extend existing PDF service để support card layout

**Reuse from existing:**
- `jsPDF` instance creation
- Vietnamese font support
- Page management functions
- A4 constants (PAGE_WIDTH, PAGE_HEIGHT, MARGIN)

**New Methods:**
```typescript
interface CardPDFService extends PDFExportService {
  generateCardsPDF(cards: CardData[]): Promise<Blob>
  createA4CardLayout(cards: CardData[]): A4CardPage[]
  addCardToPage(doc: jsPDF, card: CardData, x: number, y: number): void
}

interface A4CardPage {
  cards: CardData[] // Maximum 4 cards per page
  layout: CardLayout[]
}

interface CardLayout {
  card: CardData
  position: {
    x: number // mm
    y: number // mm
  }
}

// Card Layout Constants (extend existing constants)
const CARD_DIMENSIONS = {
  width: 95, // mm
  height: 130, // mm
}

const CARD_SPACING = 4 // mm between cards

// Positions for 4 cards on A4
const CARD_POSITIONS = [
  { x: MARGIN, y: MARGIN }, // Top left
  { x: MARGIN + CARD_DIMENSIONS.width + CARD_SPACING, y: MARGIN }, // Top right
  { x: MARGIN, y: MARGIN + CARD_DIMENSIONS.height + CARD_SPACING }, // Bottom left
  { x: MARGIN + CARD_DIMENSIONS.width + CARD_SPACING, y: MARGIN + CARD_DIMENSIONS.height + CARD_SPACING } // Bottom right
]
```

### 5. Frontend Components (Reuse existing patterns)

**AdminCardGeneratorPage (Extend admin layout pattern):**
```typescript
// Reuse admin layout từ components/admin/
interface AdminCardGeneratorPageProps {
  // No props needed - standalone admin page
}

interface AdminCardGeneratorPageState {
  // Filter options (reuse pattern từ admin/teams/)
  selectedTeams: Team[]
  roleFilter: 'all' | 'organizer' | 'participant'
  
  // User selection (reuse từ UnassignedRegistrantsList)
  availableUsers: User[]
  selectedUsers: User[]
  
  // Card generation (pattern từ TicketGenerator)
  generatedCards: CardData[]
  isGenerating: boolean
  
  // Review and preview
  showReviewModal: boolean
  previewMode: 'cards' | 'a4'
  currentA4Page: number
  
  // Edit functionality
  showEditDialog: boolean
  editingCard: CardData | null
  
  // Export
  showExportDialog: boolean
  isExporting: boolean
}
```

**Reusable Components:**

**TeamSelector (Adapt từ admin/teams/assign-team-dialog.tsx):**
```typescript
interface TeamSelectorProps {
  teams: Team[]
  selectedTeams: Team[]
  onTeamSelectionChange: (teams: Team[]) => void
}
// Reuse team fetching logic từ /api/admin/teams
```

**UserList (Adapt từ admin/teams/unassigned-registrants-list.tsx):**
```typescript
interface UserListProps {
  users: User[]
  selectedUsers: User[]
  onUserSelectionChange: (users: User[]) => void
  showSelectAll?: boolean
}
// Reuse user search và filter logic
```

**CardPreview (Extend từ TicketGenerator pattern):**
```typescript
interface CardPreviewProps {
  cards: CardData[]
  previewMode: 'cards' | 'a4'
  currentPage: number
  onPageChange: (page: number) => void
  onCardEdit?: (cardId: string) => void
  onCardRemove?: (cardId: string) => void
}
// Reuse html2canvas pattern từ TicketGenerator
```

**CardReviewModal (New - Review screen):**
```typescript
interface CardReviewModalProps {
  cards: CardData[]
  isOpen: boolean
  onClose: () => void
  onConfirmExport: () => void
  onEditCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
}

interface CardReviewState {
  selectedCards: string[]
  previewMode: 'grid' | 'a4'
  currentA4Page: number
  totalA4Pages: number
}
```

**CardEditDialog (New - Edit individual card):**
```typescript
interface CardEditDialogProps {
  card: CardData
  isOpen: boolean
  onClose: () => void
  onSave: (updatedCard: CardData) => void
}

interface EditableCardData {
  cardType: CardType
  saintName: string
  fullName: string
  useAvatar: boolean
  customText?: string
}
```

**Integration Buttons (Add to existing admin pages):**
```typescript
// For team management pages
interface TeamCardExportButtonProps {
  team: Team
  onExportComplete?: (pdfBlob: Blob) => void
}

// For user management pages  
interface IndividualCardExportButtonProps {
  user: User
  onExportComplete?: (pdfBlob: Blob) => void
}
```

## Data Models

### User Data Structure
```typescript
interface User {
  id: string
  saintName: string
  firstName: string
  lastName: string
  fullName: string // computed: firstName + lastName
  avatar?: string
  role: UserRole
  teamId?: string
}

enum UserRole {
  ORGANIZER = 'organizer',
  PARTICIPANT = 'participant'
}
```

### Template Assets Structure
```
public/assets/card-templates/
├── organizer-with-photo.png     // Base template for organizers with photo
├── organizer-without-photo.png  // Base template for organizers without photo
├── participant-with-photo.png   // Base template for participants with photo
└── participant-without-photo.png // Base template for participants without photo
```

## Error Handling

### Error Types
```typescript
enum CardGenerationError {
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  AVATAR_LOAD_FAILED = 'AVATAR_LOAD_FAILED',
  CANVAS_ERROR = 'CANVAS_ERROR',
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED'
}

interface CardGenerationResult {
  success: boolean
  cards?: CardData[]
  errors?: {
    type: CardGenerationError
    message: string
    userId?: string
  }[]
}
```

### Error Recovery Strategies
1. **Template Loading Failure:** Fallback to default template
2. **Avatar Loading Failure:** Use no-photo template variant
3. **Canvas Errors:** Retry with simplified rendering
4. **PDF Generation Failure:** Offer individual card downloads

## Testing Strategy

### Unit Tests
- TemplateService: Template loading and configuration
- ImageProcessingService: Canvas operations and image manipulation
- PDFGenerationService: Layout calculations and PDF generation
- CardGeneratorService: Business logic and error handling

### Integration Tests
- End-to-end card generation flow
- Database integration for user data
- File system integration for assets
- PDF output validation

### Visual Tests
- Template positioning accuracy
- Font rendering consistency
- A4 layout correctness
- Print quality validation

## Performance Considerations

### Optimization Strategies
1. **Template Caching:** Cache loaded templates in memory
2. **Avatar Preprocessing:** Resize and cache avatars on upload
3. **Batch Processing:** Process multiple cards in parallel
4. **Progressive Loading:** Show preview while generating PDF
5. **Memory Management:** Clean up canvas contexts after use

### Performance Metrics
- Single card generation: < 2 seconds
- Team cards (20 users): < 10 seconds
- PDF generation: < 5 seconds for 100 cards
- Memory usage: < 100MB for 100 cards

## Security Considerations

### Access Control
- Only admin users can access card generation
- Validate user permissions before generating cards
- Sanitize user input for text overlay

### Data Protection
- Don't store generated card images permanently
- Secure avatar file access
- Validate file types for templates

## Deployment Considerations

### Dependencies
- Canvas API support (or node-canvas for server-side)
- PDF generation library (jsPDF or similar)
- Image processing capabilities
- Font loading for text rendering

### Navigation and Routing (Reuse existing admin structure)

**Admin Dashboard Integration:**
```typescript
// Add to existing admin routes in app/(protected)/admin/
// Follow pattern của admin/teams/, admin/users/, etc.

// New route: app/(protected)/admin/card-generator/page.tsx
// Reuse admin layout từ app/(protected)/admin/layout.tsx
```

**Page Structure (Follow existing admin pattern):**
```
app/(protected)/admin/
├── layout.tsx (existing - reuse)
├── page.tsx (existing admin dashboard)
├── teams/ (existing)
├── users/ (existing) 
└── card-generator/ (new)
    ├── page.tsx (AdminCardGeneratorPage)
    └── components/ (card-specific components)
```

**Navigation Menu Integration:**
```typescript
// Add to existing admin navigation
// Reuse pattern từ components/admin/admin-layout.tsx
const newMenuItem = {
  title: 'Tạo thẻ ID',
  href: '/admin/card-generator',
  icon: 'id-card'
}
```

### Browser Compatibility
- Modern browsers with Canvas support
- Progressive enhancement for older browsers
- Mobile responsiveness for preview

### Server Requirements
- Sufficient memory for image processing
- Fast file system access for templates
- PDF generation capabilities