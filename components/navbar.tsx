import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { AuthButton } from "./auth-button";
import { getServerUser } from "@/lib/auth";

export async function Navbar() {
  const user = await getServerUser();

  return (
    <nav className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">DH</span>
              </div>
              <span className="font-semibold text-lg">Đại hội 2025</span>
            </Link>
            
            {/* Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Đăng ký
                </Link>
                <Link 
                  href="/agenda" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Chương trình
                </Link>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
