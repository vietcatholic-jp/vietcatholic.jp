# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vietnamese Catholic Congress 2025 registration and management platform built with Next.js 15, React 19, TypeScript, Supabase, and Tailwind CSS. The application handles event registration, payment processing, user management, and ticket generation for the Vietnamese Catholic community in Japan.

## Development Commands

**Development:**
```bash
npm run dev         # Start development server with turbopack
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

**Environment Setup:**
- Copy `.env.example` to `.env.local`
- Configure Supabase URL and anon key
- Supabase handles authentication, database, and storage

## Architecture & Tech Stack

**Frontend:**
- Next.js 15 (App Router) with React 19
- TypeScript with strict mode
- Tailwind CSS + shadcn/ui components
- React Hook Form + Zod validation
- Zustand for state management

**Backend:**
- Supabase (PostgreSQL, Auth, Storage, RLS)
- API routes in `app/api/`
- Row Level Security (RLS) enabled on all tables

**Key Directories:**
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable UI components
- `lib/` - Utilities, types, Supabase clients
- `supabase/` - Database migrations and schemas

## Code Conventions

**Files & Naming:**
- Files: kebab-case (`registration-form.tsx`)
- Components: PascalCase (`RegistrationForm`)
- Types: PascalCase (`UserRole`, `RegistrationStatus`)
- Functions: camelCase (`isValidJapanesePhoneNumber`)

**TypeScript:**
- All types defined in `lib/types.ts`
- Use string literal unions instead of enums
- No `any` - use `unknown` when needed
- Strict mode enabled

**Component Structure:**
- Server components by default
- Mark client components with `"use client"`
- Always include loading states and error handling
- Use React Hook Form + Zod for forms

## Key Domain Concepts

**User Roles:**
- `participant` - Regular attendees
- `registration_manager` - Manages registrations
- `event_organizer` - Organizes events
- `group_leader` - Leads participant groups
- `regional_admin` - Regional administrator
- `super_admin` - Full system access

**Registration Flow:**
1. User registers with personal info
2. Uploads payment receipt
3. Admin confirms payment
4. Ticket generation enabled
5. Check-in/out at event

**Key Features:**
- Multi-participant registration
- Payment receipt upload/verification
- QR code ticket generation
- Admin dashboard for management
- Transportation group coordination
- Role-based access control

## Authentication & Security

- Supabase Auth with server-side verification
- Row Level Security (RLS) on all database tables
- Role-based access control throughout application
- Client + server validation with Zod schemas

## Language & Localization

Primary language is Vietnamese with proper diacritics:
- Form labels: "Họ và tên", "Địa chỉ email", "Số điện thoại"
- Validation messages: "Trường này là bắt buộc", "Email không hợp lệ"
- Status messages: "Đang xử lý...", "Thành công!"

## Git Workflow

**Branch Strategy:**
- Base branch: `staging` (not main)
- Branch naming: `<type>/<description>-issue-<number>`
- Always create PRs to staging, assign DangHoangGeo as reviewer

**Development Process:**
1. Create detailed GitHub issue in Vietnamese
2. Branch from staging: `git checkout -b feature/new-feature-issue-123`
3. Commit with issue reference: `git commit -m "feat: add feature - Closes #123"`
4. Create PR targeting staging with "Closes #<issue-number>"

## Form Patterns

**Standard Form Component:**
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const FormSchema = z.object({
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional(),
});

type FormData = z.infer<typeof FormSchema>;

export function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { full_name: "", email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed");
      
      toast.success("Thành công!");
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Gửi"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## API Route Pattern

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  // validation schema
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request
    const body = await request.json();
    const validatedData = RequestSchema.parse(body);

    // Database operations
    const { data, error } = await supabase
      .from("table")
      .insert(validatedData)
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Testing & Quality

Before creating PRs, verify:
- API endpoints return correct status and data
- UI loads without console errors
- Authorization logic works properly
- Mobile responsive design
- Vietnamese localization correct
- Loading states and error handling work

## Database Schema

Key tables include:
- `users` - User profiles and roles
- `event_configs` - Event configuration
- `registrations` - Registration records
- `registrants` - Individual participants
- `receipts` - Payment receipts
- `tickets` - Generated tickets with QR codes
- `cancel_requests` - Cancellation requests
- `transportation_groups` - Group transportation

See `lib/types.ts` for complete type definitions and `supabase/` directory for database schema and migrations.