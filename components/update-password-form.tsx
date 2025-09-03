"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user has a valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      
      // Check if this is coming from a password reset link
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // Set the session from the URL parameters
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Session error:', error);
            setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
            setSessionValid(false);
            return;
          }
          
          setSessionValid(true);
        } catch (err) {
          console.error('Session validation error:', err);
          setError('Không thể xác thực phiên làm việc');
          setSessionValid(false);
        }
      } else {
        // Check if user already has a valid session
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          setError('Phiên làm việc không hợp lệ. Vui lòng thử đặt lại mật khẩu lại');
          setSessionValid(false);
        } else {
          setSessionValid(true);
        }
      }
    };

    checkSession();
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // Handle specific auth errors
        if (error.message.includes('session')) {
          throw new Error('Phiên làm việc đã hết hạn. Vui lòng thử đặt lại mật khẩu lại');
        }
        throw error;
      }

      // Show success message
      setSuccess(true);

      // Wait a bit to show success message, then redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: unknown) {
      console.error('Password update error:', error);
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi");
      setIsLoading(false);
    }
    // Note: Don't set isLoading(false) in finally block to keep loading state during redirect
  };

  // Show loading while checking session
  if (sessionValid === null) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Đang xác thực...</CardTitle>
            <CardDescription>
              Vui lòng đợi trong khi chúng tôi xác thực yêu cầu của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if session is invalid
  if (sessionValid === false) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Lỗi xác thực
            </CardTitle>
            <CardDescription>
              Không thể xác thực yêu cầu đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">Yêu cầu đặt lại mật khẩu mới</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Thành công!
            </CardTitle>
            <CardDescription>
              Mật khẩu của bạn đã được cập nhật thành công. Đang chuyển hướng...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
          <CardDescription>
            Vui lòng nhập mật khẩu mới của bạn bên dưới.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
