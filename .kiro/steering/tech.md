# Technology Stack & Build System

## Core Technologies
- **Framework**: Next.js (latest) with App Router
- **Language**: TypeScript throughout
- **Styling**: Tailwind CSS with shadcn/ui components ("new-york" style)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **State Management**: Zustand for client state
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives via shadcn/ui

## Key Libraries
- **Authentication**: @supabase/ssr for server-side auth
- **File Processing**: 
  - `html2canvas` + `jspdf` for PDF generation
  - `jszip` + `xlsx` for Excel exports
  - `react-dropzone` for file uploads
- **QR Codes**: `qrcode` + `html5-qrcode` for generation/scanning
- **Charts**: `recharts` for analytics dashboards
- **Notifications**: `sonner` for toast messages
- **Themes**: `next-themes` for dark/light mode

## Development Tools
- **Testing**: Jest + @testing-library/react for unit tests, Playwright for E2E
- **Linting**: ESLint with Next.js config
- **Type Safety**: Comprehensive TypeScript definitions in `lib/types.ts`

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run Jest unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:finance # Run finance-specific tests
```

## Architecture Patterns
- **Server Components**: Default for data fetching and static content
- **Client Components**: Only when interactivity needed (forms, state)
- **API Routes**: RESTful endpoints in `app/api/` following resource-based naming
- **Database**: Supabase with Row Level Security (RLS) policies
- **Authentication**: Cookie-based sessions with middleware protection
- **File Storage**: Supabase Storage with organized bucket structure

## Environment Setup
- Copy `.env.example` to `.env.local`
- Required: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Development server runs on `localhost:3000`