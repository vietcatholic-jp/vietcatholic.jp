"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Heart, 
  Edit,
  CheckCircle,
  Clock,
  Filter,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Donation } from '@/lib/types';

interface DonationFormData {
  donor_name: string;
  contact: string;
  amount: number;
  public_identity: boolean;
  note: string;
  status: 'pledged' | 'received';
}

interface EventConfigLite { id: string; is_active?: boolean }
interface DonationsStats { total_donations: number; received_donations: number; pledged_donations: number; total_amount: number; received_amount: number }

export default function DonationsManager() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<DonationFormData>({
    donor_name: '',
    contact: '',
    amount: 0,
    public_identity: false,
    note: '',
    status: 'pledged'
  });

  const [eventConfig, setEventConfig] = useState<EventConfigLite | null>(null);
  const [stats, setStats] = useState<DonationsStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadDonations = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter,
      });
      
      const response = await fetch(`/api/finance/donations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
      
      const data: { donations: Donation[]; stats: DonationsStats; totalPages: number } = await response.json();
      setDonations(data.donations || []);
      setStats(data.stats || null);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error loading donations:', error);
      toast.error('Không thể tải danh sách quyên góp');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  // Load event config
  useEffect(() => {
    const fetchEventConfig = async () => {
      try {
        const response = await fetch('/api/admin/events');
        if (response.ok) {
          const { events } = await response.json();
          const activeEvent = (events || []).find((event: EventConfigLite) => event.is_active);
          setEventConfig(activeEvent || events[0] || null);
        }
      } catch (error) {
        console.error('Failed to fetch event config:', error);
      }
    };

    fetchEventConfig();
  }, []);

  useEffect(() => {
    if (eventConfig) {
      loadDonations(currentPage);
    }
  }, [eventConfig, searchTerm, statusFilter, currentPage, loadDonations]);

  // Remove client-side filtering since it's now handled by the API
  const filteredDonations = donations;

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint = editingDonation 
        ? `/api/finance/donations/${editingDonation.id}`
        : '/api/finance/donations';
      
      const method = editingDonation ? 'PATCH' : 'POST';
      
      const requestData = {
        ...formData,
        event_config_id: eventConfig?.id,
      };
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }

      const result = await response.json();
      toast.success(result.message || 'Thao tác thành công');
      setShowCreateDialog(false);
      resetForm();
      await loadDonations(currentPage);
    } catch (error) {
      console.error('Error with donation:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDonation = async (donationId: string, updates: Partial<Donation>) => {
    try {
      const response = await fetch(`/api/admin/donations/${donationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update donation');
      }

      const result = await response.json();
      toast.success(result.message || 'Quyên góp đã được cập nhật');
      await loadDonations(currentPage);
    } catch (error) {
      console.error('Error updating donation:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật quyên góp');
    }
  };

  const markAsReceived = (donation: Donation) => {
    handleUpdateDonation(donation.id, {
      status: 'received',
      received_at: new Date().toISOString()
    });
  };

  const resetForm = () => {
    setFormData({
      donor_name: '',
      contact: '',
      amount: 0,
      public_identity: false,
      note: '',
      status: 'pledged'
    });
    setEditingDonation(null);
  };

  const openEditDialog = (donation: Donation) => {
    setFormData({
      donor_name: donation.donor_name,
      contact: donation.contact || '',
      amount: donation.amount,
      public_identity: donation.public_identity,
      note: donation.note || '',
      status: donation.status
    });
    setEditingDonation(donation);
    setShowCreateDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Đã nhận</Badge>;
      case 'pledged':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Đã cam kết</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStats = () => {
    // Use API stats if available, otherwise calculate from current page data
    if (stats) {
      return {
        total: stats.total_donations,
        received: stats.received_donations,
        pledged: stats.pledged_donations,
        publicDonors: donations.filter(d => d.public_identity && d.status === 'received').length,
        totalAmount: stats.total_amount,
        receivedAmount: stats.received_amount,
        pledgedAmount: stats.total_amount - stats.received_amount
      };
    }
    
    // Fallback to calculating from current page data
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const receivedAmount = donations.filter(d => d.status === 'received').reduce((sum, d) => sum + d.amount, 0);
    const pledgedAmount = donations.filter(d => d.status === 'pledged').reduce((sum, d) => sum + d.amount, 0);
    
    return {
      total: donations.length,
      received: donations.filter(d => d.status === 'received').length,
      pledged: donations.filter(d => d.status === 'pledged').length,
      publicDonors: donations.filter(d => d.public_identity && d.status === 'received').length,
      totalAmount,
      receivedAmount,
      pledgedAmount
    };
  };

  const displayStats = getStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quyên góp</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(displayStats.totalAmount)} tổng giá trị
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã nhận</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{displayStats.received}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(displayStats.receivedAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã cam kết</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{displayStats.pledged}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(displayStats.pledgedAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhà hảo tâm công khai</CardTitle>
            <Heart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{displayStats.publicDonors}</div>
            <p className="text-xs text-muted-foreground">
              Hiển thị công khai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý quyên góp</CardTitle>
              <CardDescription>
                Theo dõi và quản lý các khoản quyên góp cho sự kiện
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm quyên góp
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, liên hệ, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pledged">Đã cam kết</SelectItem>
                <SelectItem value="received">Đã nhận</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Donations List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDonations.length === 0 ? (
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Không tìm thấy quyên góp nào phù hợp với bộ lọc'
                  : 'Chưa có quyên góp nào được ghi nhận'
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredDonations.map((donation) => (
                <Card key={donation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{donation.donor_name}</h3>
                          {getStatusBadge(donation.status)}
                          {donation.public_identity && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              <Eye className="h-3 w-3 mr-1" />
                              Công khai
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>
                            <strong>Liên hệ:</strong> {donation.contact || 'Không có'}
                          </div>
                          <div>
                            <strong>Ngày tạo:</strong> {new Date(donation.created_at).toLocaleDateString('vi-VN')}
                          </div>
                          {donation.received_at && (
                            <div>
                              <strong>Ngày nhận:</strong> {new Date(donation.received_at).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                        
                        {donation.note && (
                          <p className="text-sm bg-gray-50 p-2 rounded">
                            <strong>Ghi chú:</strong> {donation.note}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right space-y-2 ml-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(donation.amount)}
                        </div>
                        
                        <div className="space-x-2">
                          {donation.status === 'pledged' && (
                            <Button
                              size="sm"
                              onClick={() => markAsReceived(donation)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Đã nhận
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(donation)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Sửa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDonation ? 'Chỉnh sửa quyên góp' : 'Thêm quyên góp mới'}
            </DialogTitle>
            <DialogDescription>
              {editingDonation ? 'Cập nhật thông tin quyên góp' : 'Ghi nhận quyên góp mới từ nhà hảo tâm'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateDonation} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên nhà hảo tâm *</label>
              <Input
                value={formData.donor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, donor_name: e.target.value }))}
                placeholder="Nhập tên người quyên góp"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Thông tin liên hệ</label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="Email hoặc số điện thoại"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Số tiền quyên góp *</label>
              <Input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'pledged' | 'received') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pledged">Đã cam kết</SelectItem>
                  <SelectItem value="received">Đã nhận</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="public"
                checked={formData.public_identity}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, public_identity: Boolean(checked) }))
                }
              />
              <label htmlFor="public" className="text-sm">
                Hiển thị tên trong danh sách nhà hảo tâm công khai
              </label>
            </div>
            
            <div>
              <label className="text-sm font-medium">Ghi chú</label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Lời nhắn từ nhà hảo tâm..."
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : editingDonation ? 'Cập nhật' : 'Tạo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}