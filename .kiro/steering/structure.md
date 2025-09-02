# Project Structure & Organization

## Root Directory Structure
```
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components
├── lib/                    # Utilities, types, and service layers
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
├── supabase/              # Database migrations and schemas
├── tests/                 # Test files (unit, integration, e2e)
├── docs/                  # Project documentation
└── .kiro/                 # Kiro configuration and steering
```

## App Directory (`app/`)
- **Route Groups**: `(protected)/` for authenticated routes
- **API Routes**: `api/` with resource-based organization
- **Layouts**: Nested layouts for different sections
- **Loading/Error**: Co-located loading and error boundaries

### Key Route Patterns
- `(protected)/admin/` - Admin dashboard and management
- `(protected)/dashboard/` - User dashboard
- `(protected)/profile/` - User profile management
- `api/admin/` - Admin API endpoints
- `api/registrations/` - Registration management APIs

## Components Directory (`components/`)
- **Domain-specific folders**: `admin/`, `finance/`, `registration/`, etc.
- **UI components**: `ui/` contains shadcn/ui components
- **Shared components**: Root level for cross-domain components

### Component Organization
```
components/
├── ui/                    # shadcn/ui components (Button, Dialog, etc.)
├── admin/                 # Admin-specific components
├── finance/               # Finance management components
├── registration/          # Registration flow components
├── avatar/                # Avatar management components
└── [shared components]    # Cross-domain components
```

## Lib Directory (`lib/`)
- **types.ts**: Comprehensive TypeScript definitions
- **supabase/**: Database client configurations
- **services/**: Business logic and external integrations
- **utils/**: Utility functions and helpers
- **hooks/**: Reusable custom hooks

### Service Layer Pattern
- `lib/services/avatar-storage.ts` - Avatar management
- `lib/services/permission.ts` - Role-based permissions
- `lib/logging/` - Event logging system

## Database Structure (`supabase/`)
- **migrations/**: SQL migration files with timestamps
- **production/**: Production-specific schemas and policies
- **dev/**: Development database configurations

## Testing Structure (`tests/`)
- **unit/**: Component and utility unit tests
- **integration/**: API and database integration tests
- **e2e/**: End-to-end Playwright tests
- **fixtures/**: Test data and mocks
- **page-objects/**: Page object models for E2E tests

## Naming Conventions
- **Files**: kebab-case for components and pages
- **Components**: PascalCase for React components
- **Types**: PascalCase for interfaces and types
- **Constants**: UPPER_SNAKE_CASE for constants
- **Database**: snake_case for tables and columns

## Import Aliases
```typescript
"@/components" → "./components"
"@/lib" → "./lib"
"@/hooks" → "./hooks"
"@/ui" → "./components/ui"
```

## File Organization Principles
- Co-locate related files (components with their tests)
- Separate concerns (UI, business logic, data access)
- Group by feature/domain rather than file type
- Keep shared utilities in `lib/`
- Use index files for clean imports