"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface FinanceStats {
  payments: {
    pending: number;
    confirmed: number;
    rejected: number;
    totalAmount: number;
  };
  donations: {
    total: number;
    received: number;
    pledged: number;
    totalAmount: number;
  };
  expenses: {
    submitted: number;
    approved: number;
    transferred: number;
    totalRequested: number;
  };
  cancelRequests: {
    pending: number;
    approved: number;
    processed: number;
    totalRefunds: number;
  };
}

interface CancelRequestLite { status: string; registration?: { total_amount?: number } }

interface RegistrationDataLite {
  stats?: { pending_payments?: number; confirmed_registrations?: number; rejected_payments?: number; confirmed_amount?: number };
  cancelRequests?: CancelRequestLite[];
}

export default function FinanceOverview({ userRole }: { userRole?: string }) {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Fetch stats from multiple API endpoints in parallel
        const [registrationResponse, donationsResponse, expensesResponse] = await Promise.all([
          fetch('/api/admin/registration-manager?limit=1'),
          fetch('/api/finance/donations?limit=1'),
          fetch('/api/finance/expenses?limit=1')
        ]);

        const registrationData: RegistrationDataLite | null = registrationResponse.ok ? await registrationResponse.json() : null;
        const donationsData: { stats?: { total_donations?: number; received_donations?: number; pledged_donations?: number; received_amount?: number } } | null = donationsResponse.ok ? await donationsResponse.json() : null;
        const expensesData: { stats?: { pending_requests?: number; approved_requests?: number; transferred_requests?: number; total_amount?: number } } | null = expensesResponse.ok ? await expensesResponse.json() : null;

        // Map the API data to our stats structure
        const financeStats: FinanceStats = {
          payments: {
            pending: registrationData?.stats?.pending_payments || 0,
            confirmed: registrationData?.stats?.confirmed_registrations || 0,
            rejected: registrationData?.stats?.rejected_payments || 0,
            totalAmount: registrationData?.stats?.confirmed_amount || 0,
          },
          donations: {
            total: donationsData?.stats?.total_donations || 0,
            received: donationsData?.stats?.received_donations || 0,
            pledged: donationsData?.stats?.pledged_donations || 0,
            totalAmount: donationsData?.stats?.received_amount || 0,
          },
          expenses: {
            submitted: expensesData?.stats?.pending_requests || 0,
            approved: expensesData?.stats?.approved_requests || 0,
            transferred: expensesData?.stats?.transferred_requests || 0,
            totalRequested: expensesData?.stats?.total_amount || 0,
          },
          cancelRequests: {
            pending: (registrationData?.cancelRequests || []).filter((req) => req.status === 'pending').length || 0,
            approved: (registrationData?.cancelRequests || []).filter((req) => req.status === 'approved').length || 0,
            processed: (registrationData?.cancelRequests || []).filter((req) => req.status === 'processed').length || 0,
            totalRefunds: (registrationData?.cancelRequests || [])
              .filter((req) => req.status === 'processed')
              .reduce((sum, req) => sum + (req.registration?.total_amount || 0), 0) || 0,
          }
        };
        
        setStats(financeStats);
      } catch (error) {
        console.error('Error loading finance stats:', error);
        // Set empty stats on error
        setStats({
          payments: { pending: 0, confirmed: 0, rejected: 0, totalAmount: 0 },
          donations: { total: 0, received: 0, pledged: 0, totalAmount: 0 },
          expenses: { submitted: 0, approved: 0, transferred: 0, totalRequested: 0 },
          cancelRequests: { pending: 0, approved: 0, processed: 0, totalRefunds: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
    
    // Auto refresh every 2 minutes
    const interval = setInterval(loadStats, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatJPY = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(amount);
  };

  type IconType = React.ComponentType<{ className?: string }>;
  type RoleCard = { title: string; value: number; description: string; icon: IconType; color: string; iconBg: string; priority?: boolean; action?: { href: string; label: string } };
  
  const getRoleSpecificCards = () => {
    if (!userRole || !stats) return [] as RoleCard[];

    const cards: RoleCard[] = [];

    // Cashier-specific cards
    if (['cashier_role', 'super_admin'].includes(userRole)) {
      cards.push(
        {
          title: "Thanh toán chờ xác nhận",
          value: stats.payments.pending,
          description: `${formatJPY(stats.payments.totalAmount)} cần xử lý`,
          icon: CreditCard,
          color: "bg-orange-50 text-orange-600",
          iconBg: "bg-orange-500",
          priority: stats.payments.pending > 0,
          action: { href: '/finance/cashier', label: 'Xử lý ngay' }
        },
        {
          title: "Hoàn tiền chờ xử lý",
          value: stats.cancelRequests.approved,
          description: `${formatJPY(stats.cancelRequests.totalRefunds)} cần chuyển khoản`,
          icon: TrendingDown,
          color: "bg-red-50 text-red-600",
          iconBg: "bg-red-500",
          priority: stats.cancelRequests.approved > 0,
          action: { href: '/finance/cashier', label: 'Xử lý hoàn tiền' }
        }
      );
    }

    // Admin-specific cards
    if (['super_admin', 'regional_admin'].includes(userRole)) {
      cards.push(
        {
          title: "Quyên góp đã nhận",
          value: stats.donations.received,
          description: `${formatJPY(stats.donations.totalAmount)} tổng số tiền`,
          icon: Heart,
          color: "bg-green-50 text-green-600",
          iconBg: "bg-green-500",
          action: { href: '/finance/donations', label: 'Quản lý' }
        },
        {
          title: "Chi tiêu chờ duyệt",
          value: stats.expenses.submitted,
          description: `${formatJPY(stats.expenses.totalRequested)} yêu cầu`,
          icon: FileText,
          color: "bg-blue-50 text-blue-600",
          iconBg: "bg-blue-500",
          priority: stats.expenses.submitted > 0,
          action: { href: '/finance/expenses', label: 'Phê duyệt' }
        }
      );
    }

    // Event organizer cards
    if (['event_organizer', 'super_admin', 'regional_admin'].includes(userRole)) {
      cards.push({
        title: "Yêu cầu chi tiêu của tôi",
        value: stats.expenses.approved,
        description: `${stats.expenses.transferred} đã được chuyển khoản`,
        icon: Receipt,
        color: "bg-purple-50 text-purple-600",
        iconBg: "bg-purple-500",
        action: { href: '/finance/expenses', label: 'Xem chi tiết' }
      });
    }

    return cards;
  };

  type GeneralStat = { title: string; value: string; description: string; icon: IconType; color?: string };
  const getGeneralStats = () => {
    if (!stats) return [] as GeneralStat[];

    return [
      {
        title: "Tổng doanh thu",
        value: formatJPY(stats.payments.totalAmount + stats.donations.totalAmount),
        description: `${stats.payments.confirmed} thanh toán + ${stats.donations.received} quyên góp`,
        icon: TrendingUp,
        color: "text-green-600"
      },
      {
        title: "Hoàn tiền đã xử lý",
        value: formatJPY(stats.cancelRequests.totalRefunds),
        description: `${stats.cancelRequests.processed} yêu cầu đã xử lý`,
        icon: AlertCircle,
      },
      {
        title: "Đang chờ xử lý",
        value: `${stats.payments.pending + stats.expenses.submitted}`,
        description: `${stats.payments.pending} thanh toán + ${stats.expenses.submitted} chi tiêu`,
        icon: Clock,
      },
      {
        title: "Đã xác nhận/đã chuyển",
        value: `${stats.payments.confirmed + stats.expenses.transferred}`,
        description: `${stats.payments.confirmed} thanh toán + ${stats.expenses.transferred} chi tiêu`,
        icon: CheckCircle,
      },
    ];
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Đang tải thống kê tài chính...</CardTitle>
          <CardDescription>Vui lòng chờ trong giây lát</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const roleCards = getRoleSpecificCards();
  const generalStats = getGeneralStats();

  return (
    <div className="space-y-6">
      {/* Role-specific overview cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roleCards.map((card, idx) => (
          <Card key={idx} className={`overflow-hidden ${card.color}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
              
              {card.action && (
                <Button variant="outline" className="py-2 mt-2" asChild>
                  <Link href={card.action.href}>{card.action.label}</Link>
                </Button>
              )}
              {card.priority && (
                <Badge className="mt-2 ml-2">Ưu tiên</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* General stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {generalStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color || ''}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}