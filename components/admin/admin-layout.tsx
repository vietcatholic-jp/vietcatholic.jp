"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ExportButton } from "@/components/admin/export-button";
import { AdminProvider } from "@/components/admin/admin-context";
import { 
  Users, 
  CreditCard,
  Loader2,
  Settings,
  UserCheck,
  BarChart3,
  Wrench,
  Truck,
  Database,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/lib/hooks/use-permissions";

import { Registration, UserRole, RegionType } from "@/lib/types";

interface AdminData {
  stats: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalParticipants: number;
  };
  recentRegistrations: Registration[];
  regionalStats?: { region: string; count: number }[];
  userProfile?: {
    role: UserRole;
    region?: RegionType;
  };
  provinceStats?: { province: string; count: number }[];
  dioceseStats?: { diocese: string; count: number }[];
  roleStats?: { event_role: string; count: number }[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin');
      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load admin data</p>
        </div>
      </div>
    );
  }

  const userRole = data.userProfile?.role || 'participant';

  // Navigation items based on permissions instead of roles
  const allNavItems = [
    {
      href: '/admin',
      label: 'Tổng quan',
      icon: BarChart3,
      permissions: ['analytics.view']
    },
    {
      href: '/admin/registrations',
      label: 'Đăng ký',
      icon: Users,
      permissions: ['registrations.view_all']
    },
    {
      href: '/admin/teams-assignment',
      label: 'Phân đội',
      icon: UserCheck,
      permissions: ['teams.assign_members']
    },
    {
      href: '/admin/tools',
      label: 'Công cụ',
      icon: Wrench,
      permissions: ['registrations.view_all'] // Basic tools access
    },
    {
      href: '/admin/transportation',
      label: 'Phương tiện',
      icon: Truck,
      permissions: ['teams.manage'] // Transportation management
    },
    {
      href: '/admin/users',
      label: 'Người dùng',
      icon: UserCheck,
      permissions: ['users.assign_roles']
    },
    {
      href: '/admin/events',
      label: 'Sự kiện',
      icon: Settings,
      permissions: ['events.*']
    },
    {
      href: '/admin/payments',
      label: 'Đóng phí tham dự',
      icon: CreditCard,
      permissions: ['payments.confirm', 'payments.view']
    },
    {
      href: '/admin/backup',
      label: 'Backup',
      icon: Database,
      permissions: ['*'] // Only super admin
    },
    {
      href: '/admin/roles',
      label: 'Vai trò & Quyền',
      icon: Shield,
      permissions: ['roles.*']
    }
  ];

  // Hook to get all permissions upfront
  const { permissions } = usePermissions();

  // Function to check if user has access to a nav item
  const hasAccessToItem = (item: typeof allNavItems[0]) => {
    return item.permissions.some(permission => {
      // Check for wildcard permission
      if (permissions['*']) return true;

      // Check for exact permission match
      if (permissions[permission]) return true;

      // Check for wildcard pattern match
      for (const [key, value] of Object.entries(permissions)) {
        if (value && key.endsWith('.*')) {
          const pattern = key.replace('.*', '');
          if (permission.startsWith(pattern + '.')) {
            return true;
          }
        }
      }

      return false;
    });
  };

  // Filter nav items based on permissions
  const accessibleNavItems = allNavItems.filter(hasAccessToItem);

  // Component to render nav items
  function NavigationItem({ item }: { item: typeof allNavItems[0] }) {
    const Icon = item.icon;
    const isActive = pathname === item.href || 
      (item.href !== '/admin' && pathname.startsWith(item.href));
    
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  function MobileNavigationItem({ item }: { item: typeof allNavItems[0] }) {
    const Icon = item.icon;
    const isActive = pathname === item.href || 
      (item.href !== '/admin' && pathname.startsWith(item.href));
    
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-1 px-2 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <Icon className="h-3 w-3" />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground mt-2">
              Quản lý Đại hội Công giáo Việt Nam 2025 - {userRole === 'super_admin' ? 'Quản trị viên' : 'Quản trị viên khu vực'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExportButton registrations={data.recentRegistrations} />
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1 bg-muted p-1 rounded-lg">
            {accessibleNavItems.map((item) => (
              <NavigationItem key={item.href} item={item} />
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto space-x-1 bg-muted p-1 rounded-lg">
              {accessibleNavItems.map((item) => (
                <MobileNavigationItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <AdminProvider data={data} isLoading={isLoading} refreshData={fetchAdminData}>
          <div className="space-y-6">
            {children}
          </div>
        </AdminProvider>
      </div>
    </div>
  );
}
