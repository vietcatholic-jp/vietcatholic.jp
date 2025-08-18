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
  Receipt, 
  FileText, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Building,
  CreditCard,
  Upload,
  X,
  User2
} from 'lucide-react';
import { toast } from 'sonner';
import { ExpenseFormData, ExpenseRequest } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { 
  compressImages,
  formatFileSize,
  shouldCompressFile,
  DEFAULT_RECEIPT_COMPRESSION,
  type CompressionResult
} from '@/lib/image-compression';

interface EventConfigLite { id: string; is_active?: boolean }
interface ExpensesStats { total_requests: number; pending_requests: number; approved_requests: number; transferred_requests: number; closed_requests: number; total_amount: number; approved_amount: number }

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'transfer' | 'close'>('approve');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [transferFee, setTransferFee] = useState<number>(0);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    type: 'reimbursement',
    description: '',
    amount: 0,
    bank_name: '',
    bank_account_number: '',
    note: '',
    purpose: '',
    amount_requested: 0,
    bank_account_name: '',
    bank_branch: '',
    optional_invoice_url: '',
    category: '',
    team_name: ''
  });

  const supabase = createClient();
  const [eventConfig, setEventConfig] = useState<EventConfigLite | null>(null);
  const [stats, setStats] = useState<ExpensesStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [teamOptions, setTeamOptions] = useState<string[]>([]);

  // Upload state for invoice
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressionResult[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          setUserRole(profile?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [supabase]);

  const loadExpenses = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter,
      });
      
      const response = await fetch(`/api/finance/expenses?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expense requests');
      }
      
      const data: { expenses: ExpenseRequest[]; stats: ExpensesStats } = await response.json();
      //console.log('Fetched expenses:', data.expenses);
      setExpenses(data.expenses || []);
      setStats(data.stats || null);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Không thể tải danh sách yêu cầu chi tiêu');
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

  // Load unique team names for current event
  useEffect(() => {
    const fetchTeams = async () => {
      if (!eventConfig) return;
      try {
        type TeamRow = { team_name: string | null };
        const { data, error } = await supabase
          .from('event_roles')
          .select('team_name')
          .eq('event_config_id', eventConfig.id);
        if (error) {
          console.error('Failed to fetch team names:', error);
          return;
        }
        const rows = (data || []) as TeamRow[];
        const uniqueTeams = Array.from(new Set(rows.map((r) => r.team_name).filter((t): t is string => Boolean(t))));
        setTeamOptions(uniqueTeams);
      } catch (err) {
        console.error('Error loading team names:', err);
      }
    };
    fetchTeams();
  }, [eventConfig, supabase]);

  useEffect(() => {
    if (eventConfig) {
      loadExpenses(currentPage);
    }
  }, [eventConfig, searchTerm, statusFilter, currentPage, loadExpenses]);

  // Remove client-side filtering since it's now handled by the API
  const filteredExpenses = expenses;

  // File drop handler for invoice
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Một số file không hợp lệ (chỉ JPG, PNG, PDF, tối đa 10MB)');
    }
    if (validFiles.length === 0) return;

    setUploadedFiles(validFiles);
    setIsCompressing(true);
    try {
      const needsCompression = validFiles.some(f => shouldCompressFile(f));
      const results = needsCompression
        ? await compressImages(validFiles, DEFAULT_RECEIPT_COMPRESSION)
        : validFiles.map((f) => ({
            file: f,
            originalSize: f.size,
            compressedSize: f.size,
            compressionRatio: 0,
          })) as CompressionResult[];
      setCompressedFiles(results);
      toast.success('Đã thêm file. Sẵn sàng upload');
    } catch (e) {
      console.error('Compression error:', e);
      toast.error('Không thể nén file');
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  });

  const removeSelectedFile = () => {
    setUploadedFiles([]);
    setCompressedFiles([]);
    setFormData(prev => ({ ...prev, optional_invoice_url: '' }));
  };

  const uploadInvoice = async () => {
    if (compressedFiles.length === 0) {
      toast.error('Vui lòng chọn file để upload');
      return;
    }
    setIsUploadingInvoice(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Không thể xác thực người dùng');

      const originalFile = uploadedFiles[0];
      const fileToUpload = compressedFiles[0].file;
      const fileExt = originalFile.name.split('.').pop();
      const fileName = `${user.id}/expenses/${Date.now()}.${fileExt}`;

      // Reuse receipts bucket similar to payment receipt upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, fileToUpload);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(uploadData.path);

      setFormData(prev => ({ ...prev, optional_invoice_url: publicUrl }));
      toast.success('Upload hóa đơn thành công');
    } catch (error) {
      console.error('Invoice upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload');
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestData = {
        description: formData.description || formData.purpose || '',
        amount: formData.amount || formData.amount_requested || 0,
        bank_account_name: formData.bank_account_name ||'',
        bank_name: formData.bank_name || '',
        bank_account_number: formData.bank_account_number || '',
        bank_branch: formData.bank_branch || '',
        note: formData.note || '',
        event_config_id: eventConfig?.id,
        status: 'pending', // Default status for new requests
        // New fields
        category: formData.category || "",
        team_name: formData.team_name || "",
        optional_invoice_url: formData.optional_invoice_url || "",
        type: formData.type || 'reimbursement'
      };
      
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }

      const result = await response.json();
      toast.success(result.message || 'Yêu cầu chi tiêu đã được tạo thành công');
      setShowCreateDialog(false);
      resetForm();
      await loadExpenses(currentPage);
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể tạo yêu cầu chi tiêu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpenseAction = async () => {
    if (!selectedExpense) return;
    
    setIsSubmitting(true);

    try {
      const requestData: Record<string, unknown> = {
        admin_notes: actionNotes
      };

      // Map action types to status and additional fields
      switch (actionType) {
        case 'approve':
          requestData.status = 'approved';
          requestData.approved_amount = approvedAmount;
          break;
        case 'reject':
          requestData.status = 'rejected';
          break;
        case 'transfer':
          requestData.status = 'transferred';
          requestData.transfer_fee = transferFee;
          break;
        case 'close':
          requestData.status = 'closed';
          break;
      }

      const response = await fetch(`/api/finance/expenses/${selectedExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }

      const result = await response.json();
      toast.success(result.message || 'Yêu cầu đã được xử lý thành công');
      setShowActionDialog(false);
      resetActionForm();
      await loadExpenses(currentPage);
    } catch (error) {
      console.error(`Error ${actionType} expense:`, error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'reimbursement',
      description: '',
      amount: 0,
      bank_name: '',
      bank_account_number: '',
      note: '',
      // Legacy fields
      purpose: '',
      amount_requested: 0,
      bank_account_name: '',
      bank_branch: '',
      optional_invoice_url: '',
      // New fields
      category: '',
      team_name: ''
    });
    setUploadedFiles([]);
    setCompressedFiles([]);
  };

  const resetActionForm = () => {
    setActionNotes('');
    setApprovedAmount(0);
    setTransferFee(0);
    setSelectedExpense(null);
  };

  const openActionDialog = (type: 'approve' | 'reject' | 'transfer' | 'close', expense: ExpenseRequest) => {
    setActionType(type);
    setSelectedExpense(expense);
    setApprovedAmount(expense.amount || 0);
    setShowActionDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700"><Clock className="h-3 w-3 mr-1" />Chờ duyệt</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Bị từ chối</Badge>;
      case 'transferred':
        return <Badge variant="default" className="bg-purple-500"><DollarSign className="h-3 w-3 mr-1" />Đã chuyển</Badge>;
      case 'closed':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  const getStats = () => {
    // Use API stats if available, otherwise calculate from current page data
    if (stats) {
      return {
        total: stats.total_requests,
        pending: stats.pending_requests,
        approved: stats.approved_requests,
        transferred: stats.transferred_requests,
        closed: stats.closed_requests,
        totalAmount: stats.total_amount,
        approvedAmount: stats.approved_amount
      };
    }

    // Fallback if stats are not available
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const approvedAmount = expenses.reduce((sum, e) => sum + (e.approved_amount || 0), 0);

    return {
      total: expenses.length,
      pending: expenses.filter(e => e.status === 'pending').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      transferred: expenses.filter(e => e.status === 'transferred').length,
      closed: expenses.filter(e => e.status === 'closed').length,
      totalAmount,
      approvedAmount
    };
  };

  const canCreateExpense = userRole && ['cashier_role', 'super_admin', 'event_organizer'].includes(userRole);
  const canApprove = userRole && ['super_admin'].includes(userRole);
  const canTransfer = userRole && ['cashier_role'].includes(userRole);
  const displayStats = getStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(displayStats.totalAmount)} tổng yêu cầu
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{displayStats.pending}</div>
            {displayStats.pending > 0 && canApprove && (
              <Badge variant="destructive" className="mt-1 text-xs">Cần xử lý</Badge>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{displayStats.approved}</div>
            {displayStats.approved > 0 && canTransfer && (
              <Badge variant="default" className="mt-1 text-xs bg-purple-500">Cần chuyển khoản</Badge>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã chi</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{displayStats.transferred}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(displayStats.approvedAmount)} đã phê duyệt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý yêu cầu chi tiêu</CardTitle>
              <CardDescription>
                Theo dõi và xử lý các yêu cầu hoàn tiền và tạm ứng
              </CardDescription>
            </div>
            {canCreateExpense && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo yêu cầu mới
              </Button>
            )}
            {!canCreateExpense && userRole === 'event_organizer' && (
              <Link href="/payment-request">
                <Button variant="outline">
                  Yêu cầu hoàn tiền
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mục đích, người yêu cầu, ghi chú..."
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
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Bị từ chối</SelectItem>
                <SelectItem value="transferred">Đã chuyển</SelectItem>
                <SelectItem value="closed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="reimbursement">Hoàn tiền</SelectItem>
                <SelectItem value="advance">Tạm ứng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expenses List */}
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
          ) : filteredExpenses.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Không tìm thấy yêu cầu chi tiêu nào phù hợp với bộ lọc'
                  : 'Chưa có yêu cầu chi tiêu nào'
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className={
                  expense.status === 'pending' && canApprove ? 'border-l-4 border-l-blue-500' :
                  expense.status === 'approved' && canTransfer ? 'border-l-4 border-l-green-500' :
                  ''
                }>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold">{expense.description}</h3>
                            <Badge>{expense.category}</Badge>
                            {getStatusBadge(expense.status)}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{expense.created_by_user?.full_name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User2 className="h-4 w-4" />
                              <span>{expense.team_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(expense.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(expense.amount)}
                          </div>
                          {expense.approved_amount && expense.approved_amount !== expense.amount && (
                            <div className="text-sm text-green-600">
                              Duyệt: {formatCurrency(expense.approved_amount)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bank Info */}
                      {expense.bank_account_name && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Thông tin tài khoản
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tên TK:</span>
                              <span className="ml-2 font-medium">{expense.bank_account_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ngân hàng:</span>
                              <span className="ml-2">{expense.bank_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Chi nhánh:</span>
                              <span className="ml-2">{expense.bank_branch || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Số TK:</span>
                              <span className="ml-2 font-mono">{expense.bank_account_number}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transfer Info */}
                      {expense.status === 'transferred' && expense.transfer_fee && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Thông tin chuyển khoản
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Phí chuyển:</span>
                              <span className="ml-2 font-medium">{formatCurrency(expense.transfer_fee)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Thực nhận:</span>
                              <span className="ml-2 font-medium text-green-600">
                                {formatCurrency((expense.approved_amount || 0) - (expense.transfer_fee || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {expense.note && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm"><strong>Ghi chú:</strong> {expense.note}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {expense.status === 'pending' && canApprove && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openActionDialog('approve', expense)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Phê duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openActionDialog('reject', expense)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Từ chối
                            </Button>
                          </>
                        )}
                        
                        {expense.status === 'approved' && canTransfer && (
                          <Button
                            size="sm"
                            onClick={() => openActionDialog('transfer', expense)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Đã chuyển khoản
                          </Button>
                        )}
                        
                        {expense.status === 'transferred' && canApprove && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog('close', expense)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Đóng yêu cầu
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu chi tiêu mới</DialogTitle>
            <DialogDescription>
              Tạo yêu cầu hoàn tiền hoặc tạm ứng cho chi phí sự kiện
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Loại yêu cầu *</label>
              <Select 
                value={formData.type} 
                onValueChange={(value: string) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reimbursement">Hoàn tiền (đã chi trước)</SelectItem>
                  <SelectItem value="advance">Tạm ứng (sẽ chi sau)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Danh mục</label>
                <Input
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="VD: Vận chuyển, Ăn uống, Thiết bị..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tên đội/ban</label>
                <Select
                  value={formData.team_name || ''}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, team_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đội/ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamOptions.length === 0 ? (
                      <SelectItem value="">Không có dữ liệu</SelectItem>
                    ) : (
                      teamOptions.map((team) => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Mục đích chi tiêu *</label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Mô tả chi tiết mục đích sử dụng tiền..."
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Số tiền yêu cầu (JPY) *</label>
              <Input
                type="number"
                value={formData.amount_requested || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_requested: Number(e.target.value) }))}
                placeholder="0"
                min="1"
                required
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Thông tin tài khoản nhận tiền</h4>
              
              <div>
                <label className="text-sm font-medium">Tên chủ tài khoản</label>
                <Input
                  value={formData.bank_account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
                  placeholder="Họ tên trên tài khoản ngân hàng"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tên ngân hàng</label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="VD: VietcomBank"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Chi nhánh</label>
                  <Input
                    value={formData.bank_branch}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_branch: e.target.value }))}
                    placeholder="VD: Chi nhánh Tokyo"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Số tài khoản</label>
                <Input
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                  placeholder="Số tài khoản ngân hàng"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Hóa đơn/Chứng từ (tùy chọn)</label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-muted'}`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <p className="text-sm text-muted-foreground">
                    Kéo thả file vào đây, hoặc bấm để chọn (JPG, PNG, PDF, tối đa 10MB)
                  </p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <div className="text-sm">
                    <p className="font-medium">{uploadedFiles[0].name}</p>
                    {compressedFiles[0] && (
                      <p className="text-muted-foreground text-xs">
                        {formatFileSize(compressedFiles[0].originalSize)} → {formatFileSize(compressedFiles[0].compressedSize)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" onClick={uploadInvoice} disabled={isUploadingInvoice || isCompressing}>
                      {isUploadingInvoice ? 'Đang upload...' : 'Upload hóa đơn'}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={removeSelectedFile} aria-label="Xóa file">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {formData.optional_invoice_url && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
                  Đã upload: <a className="underline" href={formData.optional_invoice_url} target="_blank" rel="noreferrer">Xem hóa đơn</a>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Phê duyệt yêu cầu'}
              {actionType === 'reject' && 'Từ chối yêu cầu'}
              {actionType === 'transfer' && 'Xác nhận đã chuyển khoản'}
              {actionType === 'close' && 'Đóng yêu cầu'}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedExpense && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Số tiền yêu cầu:</span>
                  <span className="font-bold">{formatCurrency(selectedExpense.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Người yêu cầu:</span>
                  <span>{selectedExpense.created_by_user?.full_name || 'N/A'}</span>
                </div>
              </div>
            )}

            {actionType === 'approve' && (
              <div>
                <label className="text-sm font-medium">Số tiền phê duyệt (JPY) *</label>
                <Input
                  type="number"
                  value={approvedAmount || ''}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  min="1"
                  max={selectedExpense?.amount}
                  required
                />
              </div>
            )}

            {actionType === 'transfer' && (
              <div>
                <label className="text-sm font-medium">Phí chuyển khoản (JPY)</label>
                <Input
                  type="number"
                  value={transferFee || ''}
                  onChange={(e) => setTransferFee(Number(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">
                {actionType === 'reject' ? 'Lý do từ chối *' : 'Ghi chú (tùy chọn)'}
              </label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === 'reject' ? 'Nhập lý do từ chối...' :
                  actionType === 'transfer' ? 'Thông tin về việc chuyển khoản...' :
                  'Ghi chú thêm...'
                }
                required={actionType === 'reject'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowActionDialog(false);
              resetActionForm();
            }}>
              Hủy
            </Button>
            <Button 
              onClick={handleExpenseAction}
              disabled={isSubmitting || (actionType === 'reject' && !actionNotes.trim())}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}