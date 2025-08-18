"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, X, Calendar, DollarSign, Clock, CheckCircle, XCircle, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useDropzone } from 'react-dropzone';
import { 
  compressImages,
  formatFileSize,
  shouldCompressFile,
  DEFAULT_RECEIPT_COMPRESSION,
  type CompressionResult
} from '@/lib/image-compression';

interface EventConfigLite { id: string; is_active?: boolean }

// Minimal type for listing user's own requests from /api/expenses
type UserExpenseRequest = {
  id: string;
  status: 'submitted' | 'approved' | 'rejected' | 'transferred' | 'closed';
  type: 'reimbursement' | 'advance';
  amount_requested: number;
  purpose: string | null;
  created_at: string;
  optional_invoice_url?: string | null;
  category?: string | null;
  team_name?: string | null;
};

export default function PaymentRequestForm() {
  const supabase = createClient();
  const [eventConfig, setEventConfig] = useState<EventConfigLite | null>(null);
  const [teamOptions, setTeamOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Popular categories quick-pick
  const popularCategories = [
    'Vận chuyển', 'Ăn uống', 'Thiết bị', 'Văn phòng phẩm', 'Truyền thông', 'Thuê địa điểm', 'Quà tặng'
  ];

  // List state
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [myRequests, setMyRequests] = useState<UserExpenseRequest[]>([]);

  const [formData, setFormData] = useState({
    purpose: '',
    amount_requested: 0,
    bank_account_name: '',
    bank_name: '',
    bank_branch: '',
    account_number: '',
    optional_invoice_url: '',
    category: '',
    team_name: '',
    type: 'reimbursement' as 'reimbursement' | 'advance',
  });

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressionResult[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

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

  // Load team names
  useEffect(() => {
    const fetchTeams = async () => {
      if (!eventConfig) return;
      try {
        type TeamRow = { team_name: string | null };
        const { data, error } = await supabase
          .from('event_roles')
          .select('team_name')
          .eq('event_config_id', eventConfig.id);
        if (error) return console.error('Failed to fetch team names:', error);
        const rows = (data || []) as TeamRow[];
        const uniqueTeams = Array.from(new Set(rows.map(r => r.team_name).filter((t): t is string => Boolean(t))));
        setTeamOptions(uniqueTeams);
      } catch (err) {
        console.error('Error loading team names:', err);
      }
    };
    fetchTeams();
  }, [eventConfig, supabase]);

  // Load my existing requests
  const loadMyRequests = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (eventConfig?.id) params.set('event_config_id', eventConfig.id);
      const res = await fetch(`/api/expenses?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Không thể tải danh sách');
      setMyRequests((json.data || []) as UserExpenseRequest[]);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Lỗi tải danh sách');
    } finally {
      setIsLoadingList(false);
    }
  }, [eventConfig?.id]);

  useEffect(() => {
    if (eventConfig) loadMyRequests();
  }, [eventConfig, loadMyRequests]);

  // File drop handler for invoice
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Một số file không hợp lệ (JPG, PNG, PDF, tối đa 10MB)');
    }
    if (validFiles.length === 0) return;

    setUploadedFiles(validFiles);
    setIsCompressing(true);
    try {
      const needsCompression = validFiles.some(f => shouldCompressFile(f));
      const results = needsCompression
        ? await compressImages(validFiles, DEFAULT_RECEIPT_COMPRESSION)
        : validFiles.map((f) => ({ file: f, originalSize: f.size, compressedSize: f.size, compressionRatio: 0 })) as CompressionResult[];
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
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'], 'application/pdf': ['.pdf'] }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventConfig) {
      toast.error('Không tìm thấy sự kiện đang hoạt động');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        event_config_id: eventConfig.id,
        type: formData.type,
        amount_requested: formData.amount_requested,
        purpose: formData.purpose,
		status: 'pending',
        bank_account_name: formData.bank_account_name,
        bank_name: formData.bank_name,
        bank_branch: formData.bank_branch || undefined,
        account_number: formData.account_number,
        optional_invoice_url: formData.optional_invoice_url || undefined,
        category: formData.category || undefined,
        team_name: formData.team_name || undefined,
      };

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể gửi yêu cầu');

      toast.success('Đã gửi yêu cầu hoàn tiền');
      setShowCreateDialog(false);
      // Reset
      setFormData({
        purpose: '', amount_requested: 0, bank_account_name: '', bank_name: '', bank_branch: '', account_number: '', optional_invoice_url: '', category: '', team_name: '', type: 'reimbursement'
      });
      setUploadedFiles([]);
      setCompressedFiles([]);
      // Reload list
      await loadMyRequests();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');
  const getStatusBadge = (status: UserExpenseRequest['status']) => {
    switch (status) {
      case 'submitted':
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-8">
      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn yêu cầu hoàn tiền</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Chỉ gửi yêu cầu cho chi phí liên quan sự kiện đang hoạt động.</p>
          <p>• Ghi rõ mục đích sử dụng tiền, số tiền và thông tin tài khoản nhận.</p>
          <p>• Đính kèm hóa đơn/chứng từ (ảnh hoặc PDF) để duyệt nhanh hơn.</p>
          <p>• Trạng thái yêu cầu sẽ cập nhật tại danh sách bên dưới.</p>
        </CardContent>
      </Card>

      {/* My Requests List */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Yêu cầu đã gửi</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>Tạo yêu cầu mới</Button>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : myRequests.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>Chưa có yêu cầu nào. Bấm &quot;Tạo yêu cầu mới&quot; để bắt đầu.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div key={req.id} className="border rounded-lg p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{req.purpose || 'Không có mô tả'}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(req.created_at)}</span>
                      {req.category && <span className="flex items-center gap-1">Danh mục: <Badge variant="outline">{req.category}</Badge></span>}
                      {req.team_name && <span className="flex items-center gap-1">Đội/ban: <Badge variant="outline">{req.team_name}</Badge></span>}
                      {req.optional_invoice_url && (
                        <a className="underline" href={req.optional_invoice_url} target="_blank" rel="noreferrer">Xem hóa đơn</a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-600 font-bold">{formatCurrency(Number(req.amount_requested || 0))}</div>
                    <div className="text-xs text-muted-foreground">{req.type === 'reimbursement' ? 'Hoàn tiền' : 'Tạm ứng'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog with Form */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu hoàn tiền</DialogTitle>
            <DialogDescription>Điền thông tin chi tiết bên dưới</DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">Loại yêu cầu *</label>
              <Select 
                value={formData.type}
                onValueChange={(v: 'reimbursement' | 'advance') => setFormData(prev => ({ ...prev, type: v }))}
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
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="VD: Vận chuyển, Ăn uống..."
                />
                {/* Quick picks */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {popularCategories.map(cat => (
                    <Button key={cat} type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, category: cat }))}>
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tên đội/ban</label>
                <Select
                  value={formData.team_name}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, team_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đội/ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamOptions.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
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
              <Input
                value={formData.bank_account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
                placeholder="Tên chủ tài khoản *"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="Tên ngân hàng *"
                  required
                />
                <Input
                  value={formData.bank_branch}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_branch: e.target.value }))}
                  placeholder="Chi nhánh"
                />
              </div>
              <Input
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="Số tài khoản *"
                required
              />
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
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
