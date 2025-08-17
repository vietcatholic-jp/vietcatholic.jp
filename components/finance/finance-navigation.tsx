"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  CreditCard, 
  Heart, 
  Receipt, 
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  role: string;
}

export default function FinanceNavigation() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [supabase]);

  const isActive = (path: string) => pathname === path;
  
  // Define navigation items based on roles
  const getNavigationItems = () => {
    const items = [
      {
        href: '/finance',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        description: 'Thống kê tài chính tổng thể',
        roles: ['cashier_role', 'super_admin', 'regional_admin', 'event_organizer']
      }
    ];

    // Cashier-specific items
    if (profile?.role && ['cashier_role', 'super_admin'].includes(profile.role)) {
      items.push({
        href: '/finance/cashier',
        label: 'Đăng ký',
        icon: CreditCard,
        description: 'Xác nhận thanh toán và xử lý hoàn tiền',
        roles: ['cashier_role', 'super_admin']
      });
    }

    // Admin items
    if (profile?.role && ['super_admin', 'cashier_role'].includes(profile.role)) {
      items.push(
        {
          href: '/finance/donations',
          label: 'Quyên góp',
          icon: Heart,
          description: 'Quản lý các khoản quyên góp',
          roles: ['super_admin', 'cashier_role']
        },
        {
          href: '/finance/expenses',
          label: 'Chi tiêu',
          icon: Receipt,
          description: 'Quản lý yêu cầu chi tiêu',
          roles: ['super_admin', 'cashier_role']
        }
      );
    }

    // Public items (available to all finance users)
    items.push({
      href: '/donations/public',
      label: 'Danh sách nhà hảo tâm',
      icon: Users,
      description: 'Xem danh sách công khai các nhà hảo tâm',
      roles: ['cashier_role', 'super_admin', 'regional_admin', 'event_organizer']
    });

    return items.filter(item => 
      profile?.role && item.roles.includes(profile.role)
    );
  };

  const navigationItems = getNavigationItems();

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case 'cashier_role':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Thu ngân</Badge>;
      case 'super_admin':
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700">Quản trị viên</Badge>;
      case 'regional_admin':
        return <Badge variant="secondary" className="bg-green-50 text-green-700">Quản lý khu vực</Badge>;
      case 'event_organizer':
        return <Badge variant="secondary" className="bg-orange-50 text-orange-700">Ban tổ chức</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Điều hướng tài chính</h2>
        {profile?.role && getRoleBadge(profile.role)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                isActive(item.href)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-lg p-2 ${
                    isActive(item.href)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      isActive(item.href) ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </h3>
                    <p className={`text-sm ${
                      isActive(item.href) ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {isActive(item.href) && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500" />
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}