---
applyTo: '/**'
---
Coding standards, domain knowledge, and preferences that AI should follow.

# Đại Hội Công Giáo Việt Nam 2025 - AI Development Standards

## Project Overview
Vietnamese Catholic community event management system: Next.js 15 + React 19 + TypeScript + Supabase + Tailwind CSS + shadcn/ui

## Core Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand
- **Icons**: Lucide React

## File Structure
```
app/              # Next.js pages (api/, admin/, auth/, dashboard/, etc.)
components/       # Reusable components (ui/, admin/, auth/, etc.)
lib/             # Utilities (supabase/, types.ts, utils.ts, auth.ts)
supabase/        # Database migrations & schemas
```

## Naming Conventions
- **Files**: kebab-case (`registration-form.tsx`, `cancel-requests/route.ts`)
- **Types**: PascalCase (`UserRole`, `RegistrationStatus`)
- **Functions**: camelCase (`isValidJapanesePhoneNumber`)

## TypeScript Standards
- All types in `/lib/types.ts`
- Use string literal unions, not enums
- Strict mode enabled
- Avoid `any`, use `unknown`

```typescript
// ✅ Good
export type UserRole = 'participant' | 'event_organizer' | 'super_admin';

// ❌ Bad
enum UserRole { PARTICIPANT = 'participant' }
```

## Component Structure
```typescript
"use client"; // Only for client components

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema first
const FormSchema = z.object({
  name: z.string().min(1, "Name required"),
});

type FormData = z.infer<typeof FormSchema>;

export function Component({ prop }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: FormData) => {
    // Implementation
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

## Component Patterns
- **Server Components**: Default for static content
- **Client Components**: Mark with `"use client"` only when needed
- **Always**: Loading states, error handling, proper TypeScript

## Form Validation (Zod)
```typescript
const Schema = z.object({
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string()
    .optional()
    .transform((val) => val ? cleanPhoneNumber(val) : val)
    .refine((val) => !val || isValidJapanesePhoneNumber(val), {
      message: "Số điện thoại không hợp lệ"
    }),
});
```

## API Route Pattern
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  // validation
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate & process
    const body = await request.json();
    const validatedData = RequestSchema.parse(body);

    // Business logic
    
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

## Database Query Pattern
```typescript
const { data, error } = await supabase
  .from("registrations")
  .select(`
    *,
    registrants(*),
    user:users(full_name, email)
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (error) {
  console.error("Database error:", error);
  return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
}
```

## Styling Standards
- Use `cn()` utility for conditional classes
- Semantic colors: `bg-primary`, `text-destructive`, `text-muted-foreground`
- Mobile-first responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

```typescript
<div className={cn(
  "flex items-center justify-center",
  "bg-primary text-primary-foreground",
  isActive && "bg-primary/90",
  className
)} />
```

## Language & Localization
- **Primary**: Vietnamese with proper diacritics
- **Form labels**: "Họ và tên", "Địa chỉ email", "Số điện thoại"
- **Validation**: "Trường này là bắt buộc", "Email không hợp lệ"
- **Loading**: "Đang xử lý...", Success: "Thành công!"

## Security Essentials
- **Auth**: Supabase Auth with server-side verification
- **RLS**: All tables have Row Level Security enabled
- **Validation**: Client + server validation with Zod
- **Roles**: Role-based access control

## Performance Rules
- Always show loading states: `disabled={isLoading}`
- Server components by default
- Proper error boundaries
- React.memo for expensive components

## Domain-Specific Rules
- **Registration**: Primary registrant must have Facebook link
- **Phone**: Japanese format validation (10-11 digits)
- **Payments**: Invoice codes, receipt uploads, status tracking
- **Admin**: Role-based access (`super_admin`, `event_organizer`)
- **Tickets**: QR code generation, check-in/out system

## Form Submission Pattern
```typescript
const onSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Submission failed");
    }
    
    toast.success("Thành công!");
    onSuccess?.(result);
  } catch (error) {
    console.error("Submission error:", error);
    toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
  } finally {
    setIsSubmitting(false);
  }
};
```

## Code Quality Checklist
- [ ] TypeScript strict compliance
- [ ] Proper error handling
- [ ] Form validation (Zod)
- [ ] Loading states
- [ ] Responsive design
- [ ] Vietnamese localization
- [ ] Security best practices
- [ ] Performance optimization

## Git & Deployment Standards

### 1. Commit Messages
- Use conventional commits format
- Write in English
- Be descriptive and specific
- Must include "Closes #<issue-number>" for issue linking

### 2. Branch Strategy
- `staging`: Default base branch (not main)
- `main`: Production-ready code
- `feature/<description>-issue-<number>`: New features
- `hotfix/<description>-issue-<number>`: Critical bug fixes
- `fix/<description>-issue-<number>`: Bug fixes

### 3. Deployment Process
- Test on staging environment first
- Run database migrations
- Update environment variables
- Monitor application logs
- Rollback plan prepared

## Project-Specific Workflow

### Code Style Preferences
- **Whitespace**: Avoid commits that only modify whitespace without functional changes
- **Meaningful changes**: Every commit should include functional improvements or fixes

### Task Management & Git Workflow
- **Issues**: Create detailed GitHub issues in Vietnamese for each task
- **Sequential work**: Work on tasks one by one, don't parallel multiple features
- **Branch strategy**: Create separate branches for each GitHub issue
- **Base branch**: Use `staging` as default (not `main`) - always branch from staging
- **Branch naming**: Format: `<type>/<description>-issue-<number>` (e.g., `feature/registration-form-issue-123`)

### Mandatory Pull Request Process
```bash
# 1. Create branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/new-feature-issue-123

# 2. Commit with issue reference
git commit -m "feat: add new feature - Closes #123"

# 3. Push and create PR
git push origin feature/new-feature-issue-123
```

**PR Requirements:**
- **Target**: Always staging (never main)
- **Description**: Must include "Closes #<issue-number>"
- **Reviewer**: Always assign DangHoangGeo
- **Commit messages**: Include "Closes #<issue-number>"

### Pre-PR Testing Checklist
- [ ] API endpoints return correct status and data format
- [ ] UI loads correctly without errors
- [ ] Authorization logic works properly
- [ ] No console errors
- [ ] Edge cases and scenarios tested
- [ ] Responsive design verified
- [ ] Vietnamese localization correct

### Charts & Visualizations Standards
- **Chart type**: Horizontal bar charts (preferred)
- **Sorting**: Descending order for ranking visualization
- **Labels**: Value labels at end of each bar
- **Axis**: Horizontal axis showing scale for easy comparison
- **Consistency**: Follow existing province/diocese statistics patterns

```typescript
// ✅ Chart component example
<ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={sortedData} // Always sort descending
    layout="horizontal"
    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis type="number" />
    <YAxis dataKey="name" type="category" width={100} />
    <Bar dataKey="value" fill="#8884d8">
      <LabelList dataKey="value" position="right" />
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

## Development Process
1. **Issue Creation**: Write detailed GitHub issue in Vietnamese
2. **Branch Creation**: Create from staging with proper naming
3. **Development**: Follow coding standards, test thoroughly
4. **Testing**: Complete pre-PR testing checklist
5. **Pull Request**: Create with proper description and reviewer
6. **Review**: Wait for DangHoangGeo approval
7. **Merge**: Auto-closes linked issue

---

**Remember**: Always prioritize user experience, security, and maintainability. When in doubt, refer to existing patterns in the codebase and follow established conventions.

