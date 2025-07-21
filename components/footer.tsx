"use client";

import { Facebook, Mail, Share2, Copy, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function Footer() {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://jubilee2025.vn";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full border-t border-border bg-gradient-to-r from-blue-50 via-white to-purple-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-8">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 w-full md:w-auto">
          <span className="font-bold text-lg bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">
            Đại hội Năm Thánh 2025 Tại Nhật Bản
          </span>
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            Chia sẻ trang này
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}
            aria-label="Chia sẻ Facebook">
            <Facebook className="h-5 w-5 text-blue-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.open(`mailto:?subject=Đại hội Năm Thánh 2025&body=${encodeURIComponent(shareUrl)}`)}
            aria-label="Chia sẻ Email">
            <Mail className="h-5 w-5 text-amber-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Sao chép liên kết">
            <Copy className="h-5 w-5 text-purple-600" />
            <span className="ml-1 text-xs">{copied ? "Đã sao chép!" : "Sao chép"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, "_blank")}
            aria-label="Chia sẻ Zalo">
            <Smartphone className="h-5 w-5 text-green-600" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 text-center md:text-right w-full md:w-auto">
          &copy; 2025 Đại hội Năm Thánh. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}

