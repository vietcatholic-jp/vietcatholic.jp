import { NextPage } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Banknote } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { headers } from 'next/headers';

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  note?: string;
  received_at: string;
  created_at: string;
  event_config?: {
    id: string;
    name: string;
  };
}

interface PublicDonationsResponse {
  success: boolean;
  data: Donation[];
  stats: {
    totalDonors: number;
    totalAmount: number;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

async function getPublicDonations(): Promise<PublicDonationsResponse> {
  try {
    // In a Server Component, fetch requires an absolute URL. Build it from headers/env.
    const h = await headers();
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    const proto = h.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const origin = envUrl || (host ? `${proto}://${host}` : 'http://localhost:3000');

    const url = `${origin}/api/donations/public?limit=100`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    // If we got redirected to an HTML page (e.g., login), avoid JSON parsing
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from public donations API', {
        status: response.status,
        redirected: response.redirected,
        preview: text.slice(0, 200),
      });
      throw new Error('Non-JSON response from API');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch donations: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching public donations:', error);
    return {
      success: false,
      data: [],
      stats: { totalDonors: 0, totalAmount: 0 },
      pagination: { total: 0, limit: 100, offset: 0, hasMore: false }
    };
  }
}

const PublicDonationsPage: NextPage = async () => {
  const donationsData = await getPublicDonations();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <Heart className="inline-block mr-2 h-8 w-8 text-red-500" />
              Danh sách nhà hảo tâm
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Cảm ơn những tấm lòng hào phóng đã đồng hành cùng Đại hội Năm Thánh 2025
            </p>
            
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto mb-8">
              <Card className="bg-white/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Tổng số nhà hảo tâm
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {donationsData.stats.totalDonors}
                  </div>
                  <p className="text-xs text-gray-600">
                    người đã đóng góp
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Tổng số tiền quyên góp
                  </CardTitle>
                  <Banknote className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(donationsData.stats.totalAmount)}
                  </div>
                  <p className="text-xs text-gray-600">
                    đã được quyên góp
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Donations List */}
          {donationsData.data.length === 0 ? (
            <Card className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Chưa có nhà hảo tâm nào công khai danh tính</p>
                  <p className="text-sm">Hãy trở thành người đầu tiên!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {donationsData.data.map((donation, index) => (
                <Card 
                  key={donation.id} 
                  className="bg-white/70 backdrop-blur-sm hover:bg-white/80 transition-all duration-200"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {donation.donor_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Quyên góp ngày {formatDate(donation.received_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="secondary" className="text-lg font-bold bg-green-100 text-green-800">
                          {formatCurrency(donation.amount)}
                        </Badge>
                      </div>
                    </div>
                    
                    {donation.note && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-700 italic">
                          &quot;{donation.note}&quot;
                        </p>
                      </div>
                    )}
                    
                    {donation.event_config && (
                      <div className="mt-3">
                        <Badge variant="outline" className="text-xs">
                          {donation.event_config.name}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Footer Message */}
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-none">
              <CardContent className="pt-6">
                <Heart className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <p className="text-lg font-medium text-gray-800 mb-2">
                  Cảm ơn tất cả các nhà hảo tâm!
                </p>
                <p className="text-sm text-gray-600">
                  Những đóng góp của quý vị sẽ giúp cho Đại hội Năm Thánh 2025 diễn ra thành công tốt đẹp,
                  mang lại nhiều ý nghĩa tinh thần cho cộng đoàn Công giáo Việt Nam tại Nhật Bản.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </main>
  );
};

export default PublicDonationsPage;