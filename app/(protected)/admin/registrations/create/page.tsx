'use client';

import { RegistrationForm } from "@/components/registration/registration-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  full_name: string | null;
  role: string;
}

export default function AdminRegistrationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [targetUserData, setTargetUserData] = useState<{ name?: string; facebookUrl?: string } | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndProfile = async (user: User | null) => {
      if (user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setUser(user);
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserAndProfile(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserAndProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push('/auth/login?redirectTo=/admin/registrations/create');
        return;
      }

      // Check if user is admin
      if (!profile.role || !["super_admin", "registration_manager"].includes(profile.role)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, router]);

  const handleTargetUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserEmail) return;

    try {
      const supabase = createClient();
      const { data: userData, error } = await supabase
        .from('users')
        .select('full_name, facebook_url')
        .eq('email', targetUserEmail)
        .single();

      if (error || !userData) {
        alert('Không tìm thấy người dùng với email này');
        return;
      }

      setTargetUserData({
        name: userData.full_name || '',
        facebookUrl: userData.facebook_url || ''
      });
      setShowRegistrationForm(true);
    } catch (error) {
      console.error('Error finding user:', error);
      alert('Có lỗi xảy ra khi tìm kiếm người dùng');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !profile.role || !["super_admin", "registration_manager"].includes(profile.role)) {
    return null; // Will redirect via useEffect
  }

  if (!showRegistrationForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Tạo đăng ký cho người dùng (Admin)
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Nhập email người dùng để tạo đăng ký cho họ
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTargetUserSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="target_email">Email người dùng *</Label>
                    <Input
                      id="target_email"
                      type="email"
                      value={targetUserEmail}
                      onChange={(e) => setTargetUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push('/registration-manager')}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={!targetUserEmail}>
                      Tiếp tục
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-800">
              Tạo đăng ký cho: {targetUserEmail}
            </h1>
            <p className="text-gray-600 mt-2">
              Sử dụng form đăng ký thông thường với quyền admin
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowRegistrationForm(false)}
              className="mt-4"
            >
              ← Quay lại chọn người dùng khác
            </Button>
          </div>

          {/* Use existing RegistrationForm with admin capabilities */}
          <RegistrationForm 
            userEmail={targetUserEmail}
            userName={targetUserData?.name}
            userFacebookUrl={targetUserData?.facebookUrl}
            isAdminMode={true}
            targetUserEmail={targetUserEmail}
            onAdminSuccess={(registration) => {
              // Redirect to registration manager dashboard with success message
              router.push(`/registration-manager?success=created&invoice=${registration.invoice_code}`);
            }}
            onAdminCancel={() => {
              // Go back to user selection
              setShowRegistrationForm(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
