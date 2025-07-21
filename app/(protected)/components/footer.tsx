"use client";

import { Facebook, Mail, Share2, Copy, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { useUser } from "./user-provider";
import Link from "next/link";

export function Footer() {
  const { user, profile, isAdmin } = useUser();
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://daihoiconggiao.jp";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full border-t border-border bg-gradient-to-r from-blue-50 via-white to-purple-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Brand and Navigation */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="text-center lg:text-left">
              <h3 className="font-bold text-lg bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">
                Đại hội Năm Thánh 2025 Tại Nhật Bản
              </h3>
              <div className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1 justify-center lg:justify-start">
                <Share2 className="h-3 w-3" />
                Những Người Hành Hương Của Hy Vọng
              </div>
            </div>
            
            {/* Navigation links */}
            {user && (
              <nav className="flex flex-wrap justify-center lg:justify-start gap-2">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                >
                  Đăng ký của tôi
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-medium text-green-700 hover:text-green-900 hover:bg-green-50 px-3 py-1 rounded-md transition-colors"
                >
                  Đăng ký mới
                </Link>
                <Link 
                  href="/guide" 
                  className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-3 py-1 rounded-md transition-colors"
                >
                  Hướng dẫn
                </Link>
                <Link 
                  href="/agenda" 
                  className="text-sm font-medium text-orange-700 hover:text-orange-900 hover:bg-orange-50 px-3 py-1 rounded-md transition-colors"
                >
                  Chương trình
                </Link>
                {isAdmin && (
                  <Link 
                    href={profile?.role === 'registration_manager' ? '/registration-manager' : '/admin'}
                    className="text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                  >
                    {profile?.role === 'registration_manager' ? 'Quản lý đăng ký' : 'Quản trị'}
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Share buttons */}
          <div className="flex flex-col items-center gap-4">
            <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              Chia sẻ trang này
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}
                className="hover:bg-blue-50"
                aria-label="Chia sẻ Facebook"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open(`mailto:?subject=Đại hội Năm Thánh 2025&body=${encodeURIComponent(shareUrl)}`)}
                className="hover:bg-amber-50"
                aria-label="Chia sẻ Email"
              >
                <Mail className="h-4 w-4 text-amber-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy}
                className="hover:bg-purple-50"
                aria-label="Sao chép liên kết"
              >
                <Copy className="h-4 w-4 text-purple-600" />
                <span className="ml-1 text-xs">{copied ? "Đã sao chép!" : "Sao chép"}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, "_blank")}
                className="hover:bg-green-50"
                aria-label="Chia sẻ Zalo"
              >
                <Smartphone className="h-4 w-4 text-green-600" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-xs text-gray-500 text-center mt-6 pt-4 border-t border-gray-200">
          &copy; 2025 Đại hội Năm Thánh. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}

