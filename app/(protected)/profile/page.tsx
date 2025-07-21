import { redirect } from "next/navigation";
import { getServerUser, getServerUserProfile } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, MapPin, Shield, Facebook } from "lucide-react";

export default async function ProfilePage() {
  const user = await getServerUser();
  const profile = await getServerUserProfile();
  
  if (!user || !profile) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Hồ sơ cá nhân</h1>
            <p className="text-muted-foreground">
              Quản lý thông tin cá nhân và cài đặt tài khoản
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.avatar_url && (
                    <div className="text-center">
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full mx-auto mb-2"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.full_name || 'Chưa cập nhật tên'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                    
                    {profile.province && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.province}</span>
                      </div>
                    )}
                    
                    {profile.facebook_url && (
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={profile.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Facebook
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
                        {profile.role === 'participant' && 'Tham dự viên'}
                        {profile.role === 'event_organizer' && 'Tổ chức sự kiện'}
                        {profile.role === 'regional_admin' && 'Quản trị khu vực'}
                        {profile.role === 'super_admin' && 'Quản trị tổng'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thống kê hoạt động</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày tham gia:</span>
                      <span>{new Date(profile.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lần cập nhật cuối:</span>
                      <span>{new Date(profile.updated_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <ProfileForm user={user} profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
