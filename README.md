<a href="https://daihoiconggiao.jp/">
  <img alt="Dai Hoi Cong Giao Nhat Ban 2025" src="public/Jubilee2025.png">
  <h1 align="center">ĐẠI HỘI CÔNG GIÁO VIỆT NAM TẠI NHẬT NĂM THÁNH 2025</h1>
</a>

<p align="center">
 Registration and Information Website for the Vietnamese Catholic Congress in Japan 2025.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
</p>
<br/>

## Features

### Core Technology Stack
- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Middleware
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

### Event Management Features
- **Registration System**: Complete registration flow with payment tracking
- **Role Management**: Advanced role-based participant categorization
  - 4 role categories: Tham gia, Tình nguyện, Tổ chức, Đặc biệt
  - Role-based filtering and statistics
  - Vietnamese role labels in all exports
- **Team Assignment**: Intelligent team assignment with role consideration
- **Export & Reporting**: CSV exports with comprehensive role information
- **Admin Dashboard**: Real-time statistics and role distribution analytics
- **Multi-language Support**: Vietnamese and Japanese interface

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Clone the repository:
   ```bash
   git clone https://github.com/danghoanggeo/daihoiconggiao.jp.git
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd daihoiconggiao.jp
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Rename `.env.example` to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   ```

   Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

6. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Vietcatholic.jp](https://github.com/vietcatholic-jp/vietcatholic.jp/issues/new).
# Test production workflow - Thu Jul 31 14:51:13 JST 2025
