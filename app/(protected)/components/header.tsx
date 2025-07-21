"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { ThemeSwitcher } from "../../../components/theme-switcher";
import { ClientAuthButton } from "../../../components/client-auth-button";
import { Button } from "../../../components/ui/button";
import { useUser } from "./user-provider";
import Image from "next/image";

export function Header() {
  const { user, profile, isLoading, isAdmin } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <nav className="w-full border-b border-border bg-gradient-to-r from-blue-50 via-white to-purple-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-border bg-gradient-to-r from-blue-50 via-white to-purple-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-full">
                <Image
                  src="/logo-dh-2025.jpg"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">
                  Đại hội Năm Thánh 2025
                </span>
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Những Người Hành Hương Của Hy Vọng
                </span>
              </div>
            </Link>
            
            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-4">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg"
                >
                  Đăng ký của tôi
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-medium transition-colors hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg"
                >
                  Đăng ký mới
                </Link>
                <Link 
                  href="/guide" 
                  className="text-sm font-medium transition-colors hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg"
                >
                  Hướng dẫn
                </Link>
                <Link 
                  href="/agenda" 
                  className="text-sm font-medium transition-colors hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg"
                >
                  Chương trình
                </Link>
                {isAdmin && (
                  <Link 
                    href={profile?.role === 'registration_manager' ? '/registration-manager' : '/admin'}
                    className="text-sm font-medium transition-colors hover:text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-lg"
                  >
                    {profile?.role === 'registration_manager' ? 'Quản lý đăng ký' : 'Quản trị'}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {!user && (
                <Link 
                  href="/guide" 
                  className="text-sm font-medium transition-colors hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg"
                >
                  Hướng dẫn
                </Link>
              )}
              <ThemeSwitcher />
              <ClientAuthButton />
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-16 bg-white dark:bg-gray-900 border-b border-border shadow-lg z-50">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {user && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="flex items-center text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 px-3 py-3 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký của tôi
                  </Link>
                  <Link 
                    href="/register" 
                    className="flex items-center text-sm font-medium transition-colors hover:text-green-600 hover:bg-green-50 px-3 py-3 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký mới
                  </Link>
                  <Link 
                    href="/guide" 
                    className="flex items-center text-sm font-medium transition-colors hover:text-purple-600 hover:bg-purple-50 px-3 py-3 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hướng dẫn
                  </Link>
                  <Link 
                    href="/agenda" 
                    className="flex items-center text-sm font-medium transition-colors hover:text-purple-600 hover:bg-purple-50 px-3 py-3 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Chương trình
                  </Link>
                  {isAdmin && (
                    <Link 
                      href={profile?.role === 'registration_manager' ? '/registration-manager' : '/admin'}
                      className="flex items-center text-sm font-medium transition-colors hover:text-orange-600 hover:bg-orange-50 px-3 py-3 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {profile?.role === 'registration_manager' ? 'Quản lý đăng ký' : 'Quản trị'}
                    </Link>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between px-3">
                      <ThemeSwitcher />
                      <ClientAuthButton />
                    </div>
                  </div>
                </>
              )}
              {!user && (
                <>
                  <Link 
                    href="/guide" 
                    className="flex items-center text-sm font-medium transition-colors hover:text-purple-600 hover:bg-purple-50 px-3 py-3 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hướng dẫn
                  </Link>
                  <div className="flex items-center justify-between px-3">
                    <ThemeSwitcher />
                    <ClientAuthButton />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
