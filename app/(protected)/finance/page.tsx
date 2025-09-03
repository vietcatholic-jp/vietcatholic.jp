import { getServerUserProfile } from '@/lib/auth';
import FinanceOverview from '@/components/finance/finance-overview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Heart, 
  DollarSign, 
  Receipt, 
  CreditCard,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export default async function FinancePage() {
  const profile = await getServerUserProfile();

  return (
    <div className="space-y-8">
      {/* Finance Overview Cards */}
      <FinanceOverview userRole={profile?.role} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý tài chính</CardTitle>
          <CardDescription>
            Truy cập nhanh các chức năng quản lý tài chính
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['super_admin', 'regional_admin', 'cashier_role'].includes(profile?.role || '') && (
              <Link href="/finance/cashier">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <CreditCard className="h-6 w-6" />
                  <span>Đăng ký online</span>
                </Button>
              </Link>
            )}

            {['super_admin', 'regional_admin', 'cashier_role'].includes(profile?.role || '') && (
              <Link href="/finance/donations">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Heart className="h-6 w-6" />
                  <span>Quyên góp</span>
                </Button>
              </Link>
            )}

            {['super_admin', 'regional_admin', 'cashier_role', 'event_organizer'].includes(profile?.role || '') && (
              <Link href="/finance/income-sources">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Nguồn thu</span>
                </Button>
              </Link>
            )}

            {['super_admin', 'regional_admin', 'cashier_role', 'event_organizer'].includes(profile?.role || '') && (
              <Link href="/finance/expenses">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Receipt className="h-6 w-6" />
                  <span>Chi phí</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Additional financial tools for admins */}
          {['super_admin', 'regional_admin'].includes(profile?.role || '') && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-4">Công cụ báo cáo nâng cao</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="w-full h-16 flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Báo cáo tài chính</div>
                    <div className="text-sm text-muted-foreground">Xuất báo cáo chi tiết</div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full h-16 flex items-center space-x-3">
                  <DollarSign className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Phân tích dòng tiền</div>
                    <div className="text-sm text-muted-foreground">Theo dõi dòng tiền</div>
                  </div>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}