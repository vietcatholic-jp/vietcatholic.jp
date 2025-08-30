"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  DollarSign,
  Edit,
  CheckCircle,
  Clock,
  Filter,
  Target,
  Gift,
  Store
} from 'lucide-react';
import { toast } from 'sonner';
import { IncomeCategory } from '@/lib/types';


export interface IncomeSource {
  id: string;
  event_config_id: string;
  category: IncomeCategory;
  title: string;
  description?: string;
  amount: number;
  expected_amount?: number;
  status: 'pending' | 'received' | 'overdue';
  contact_person?: string;
  contact_info?: string;
  due_date?: string;
  received_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface IncomeFormData {
  category: IncomeCategory;
  title: string;
  description: string;
  amount: number;
  expected_amount: number;
  status: 'pending' | 'received' | 'overdue';
  contact_person: string;
  contact_info: string;
  due_date: string;
  notes: string;
}

interface IncomeStats {
  total_sources: number;
  pending_sources: number;
  received_sources: number;
  overdue_sources: number;
  total_amount: number;
  received_amount: number;
  pending_amount: number;
}

interface EventConfigLite { 
  id: string; 
  is_active?: boolean; 
}

export default function IncomeSourcesManager() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<IncomeFormData>({
    category: 'other',
    title: '',
    description: '',
    amount: 0,
    expected_amount: 0,
    status: 'pending',
    contact_person: '',
    contact_info: '',
    due_date: '',
    notes: ''
  });

  const [eventConfig, setEventConfig] = useState<EventConfigLite | null>(null);
  const [stats, setStats] = useState<IncomeStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadIncomeSources = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
      });
      
      const response = await fetch(`/api/finance/income-sources?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch income sources');
      }
      
      const data: { sources: IncomeSource[]; stats: IncomeStats; totalPages: number } = await response.json();
      setIncomeSources(data.sources || []);
      setStats(data.stats || null);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error loading income sources:', error);
      toast.error('Không thể tải danh sách nguồn thu');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, statusFilter]);

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
      loadIncomeSources(currentPage);
    }
  }, [eventConfig, searchTerm, categoryFilter, statusFilter, currentPage, loadIncomeSources]);

  const handleCreateIncomeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint = editingSource 
        ? `/api/finance/income-sources/${editingSource.id}`
        : '/api/finance/income-sources';
      
      const method = editingSource ? 'PATCH' : 'POST';
      
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
      await loadIncomeSources(currentPage);
    } catch (error) {
      console.error('Error with income source:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsReceived = async (source: IncomeSource) => {
    try {
      const response = await fetch(`/api/finance/income-sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'received',
          received_date: new Date().toISOString(),
          amount: source.expected_amount || source.amount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update income source');
      }

      const result = await response.json();
      toast.success(result.message || 'Đã cập nhật trạng thái nhận tiền');
      await loadIncomeSources(currentPage);
    } catch (error) {
      console.error('Error updating income source:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'other',
      title: '',
      description: '',
      amount: 0,
      expected_amount: 0,
      status: 'pending',
      contact_person: '',
      contact_info: '',
      due_date: '',
      notes: ''
    });
    setEditingSource(null);
  };

  const openEditDialog = (source: IncomeSource) => {
    setFormData({
      category: source.category,
      title: source.title,
      description: source.description || '',
      amount: source.amount,
      expected_amount: source.expected_amount || 0,
      status: source.status,
      contact_person: source.contact_person || '',
      contact_info: source.contact_info || '',
      due_date: source.due_date ? source.due_date.split('T')[0] : '',
      notes: source.notes || ''
    });
    setEditingSource(source);
    setShowCreateDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(amount);
  };

  const getCategoryLabel = (category: IncomeCategory) => {
    const labels: Record<IncomeCategory, string> = {
      ticket_sales: 'Bán vé sự kiện',
      merchandise: 'Bán sản phẩm lưu niệm',
      food_beverage: 'Đồ ăn thức uống',
      other: 'Khác'
    };
    return labels[category];
  };

  const getCategoryIcon = (category: IncomeCategory) => {
    const icons: Record<IncomeCategory, React.ComponentType<{ className?: string }>> = {
      ticket_sales: Target,
      merchandise: Store,
      food_beverage: Gift,
      other: DollarSign
    };
    const Icon = icons[category];
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Đã nhận</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Đang chờ</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Quá hạn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStats = () => {
    if (stats) {
      return {
        total: stats.total_sources,
        pending: stats.pending_sources,
        received: stats.received_sources,
        overdue: stats.overdue_sources,
        totalAmount: stats.total_amount,
        receivedAmount: stats.received_amount,
        pendingAmount: stats.pending_amount
      };
    }
    
    // Fallback to calculating from current page data
    const totalAmount = incomeSources.reduce((sum, s) => sum + s.amount, 0);
    const receivedAmount = incomeSources.filter(s => s.status === 'received').reduce((sum, s) => sum + s.amount, 0);
    const pendingAmount = incomeSources.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.expected_amount || s.amount), 0);
    
    return {
      total: incomeSources.length,
      received: incomeSources.filter(s => s.status === 'received').length,
      pending: incomeSources.filter(s => s.status === 'pending').length,
      overdue: incomeSources.filter(s => s.status === 'overdue').length,
      totalAmount,
      receivedAmount,
      pendingAmount
    };
  };

  const displayStats = getStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nguồn thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{displayStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(displayStats.pendingAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{displayStats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Cần theo dõi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý nguồn thu</CardTitle>
              <CardDescription>
                Theo dõi và quản lý các nguồn thu khác ngoài phí tham gia và quyên góp
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm nguồn thu
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, liên hệ, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="ticket_sales">Bán vé sự kiện</SelectItem>
                <SelectItem value="merchandise">Bán sản phẩm lưu niệm</SelectItem>
                <SelectItem value="food_beverage">Đồ ăn thức uống</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="received">Đã nhận</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Income Sources List */}
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
          ) : incomeSources.length === 0 ? (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Không tìm thấy nguồn thu nào phù hợp với bộ lọc'
                  : 'Chưa có nguồn thu nào được ghi nhận'
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {incomeSources.map((source) => (
                <Card key={source.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(source.category)}
                          <h3 className="text-lg font-semibold">{source.title}</h3>
                          {getStatusBadge(source.status)}
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {getCategoryLabel(source.category)}
                          </Badge>
                        </div>
                        
                        {source.description && (
                          <p className="text-sm text-muted-foreground">{source.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          {source.contact_person && (
                            <div>
                              <strong>Liên hệ:</strong> {source.contact_person}
                            </div>
                          )}
                          {source.due_date && (
                            <div>
                              <strong>Hạn nhận:</strong> {new Date(source.due_date).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                          {source.received_date && (
                            <div>
                              <strong>Ngày nhận:</strong> {new Date(source.received_date).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                        
                        {source.notes && (
                          <p className="text-sm bg-gray-50 p-2 rounded">
                            <strong>Ghi chú:</strong> {source.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right space-y-2 ml-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(source.amount)}
                        </div>
                        {source.expected_amount && source.expected_amount !== source.amount && (
                          <div className="text-sm text-orange-600">
                            Dự kiến: {formatCurrency(source.expected_amount)}
                          </div>
                        )}
                        
                        <div className="space-x-2">
                          {source.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => markAsReceived(source)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Đã nhận
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(source)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSource ? 'Chỉnh sửa nguồn thu' : 'Thêm nguồn thu mới'}
            </DialogTitle>
            <DialogDescription>
              {editingSource ? 'Cập nhật thông tin nguồn thu' : 'Ghi nhận nguồn thu mới cho sự kiện'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateIncomeSource} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Danh mục *</label>
              <Select 
                value={formData.category} 
                onValueChange={(value: IncomeCategory) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="ticket_sales">Bán vé sự kiện</SelectItem>
                <SelectItem value="merchandise">Bán sản phẩm lưu niệm</SelectItem>
                <SelectItem value="food_beverage">Đồ ăn thức uống</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Tên nguồn thu *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VD: Tài trợ ABC Company"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về nguồn thu này..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Số tiền thực nhận</label>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Số tiền dự kiến</label>
                <Input
                  type="number"
                  value={formData.expected_amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_amount: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'pending' | 'received' | 'overdue') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="received">Đã nhận</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Người liên hệ</label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Tên người liên hệ"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Thông tin liên hệ</label>
                <Input
                  value={formData.contact_info}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_info: e.target.value }))}
                  placeholder="Email hoặc số điện thoại"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Hạn thu tiền</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Ghi chú</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú thêm..."
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
                {isSubmitting ? 'Đang xử lý...' : editingSource ? 'Cập nhật' : 'Tạo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
