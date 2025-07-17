"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertCircle, 
  Heart,
  CreditCard,
  X
} from "lucide-react";
import { toast } from "sonner";

const CancelRequestSchema = z.object({
  registration_id: z.string().uuid(),
  reason: z.string().min(10, 'Lý do hủy phải có ít nhất 10 ký tự'),
  request_type: z.enum(['refund', 'donation'], {
    required_error: 'Vui lòng chọn loại yêu cầu'
  }),
  bank_account_number: z.string().optional(),
  bank_name: z.string().optional(),
  account_holder_name: z.string().optional()
}).refine((data) => {
  if (data.request_type === 'refund') {
    return data.bank_account_number && 
           data.bank_name && 
           data.account_holder_name &&
           data.bank_account_number.length >= 5 &&
           data.bank_name.length >= 2 &&
           data.account_holder_name.length >= 2;
  }
  return true;
}, {
  message: 'Thông tin ngân hàng là bắt buộc khi yêu cầu hoàn tiền',
  path: ['bank_account_number']
});

type FormData = z.infer<typeof CancelRequestSchema>;

interface CancelRequestFormProps {
  registration: {
    id: string;
    invoice_code: string;
    total_amount: number;
    participant_count: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelRequestForm({ 
  registration, 
  isOpen, 
  onClose, 
  onSuccess 
}: CancelRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(CancelRequestSchema),
    defaultValues: {
      registration_id: registration.id,
      reason: "",
      request_type: "refund"
    }
  });

  const requestType = watch("request_type");
  const isRefund = requestType === "refund";

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare submission data
      const submitData = {
        registration_id: data.registration_id,
        reason: data.reason,
		request_type: data.request_type,
        ...(data.request_type === 'refund' && {
          bank_account_number: data.bank_account_number,
          bank_name: data.bank_name,
          account_holder_name: data.account_holder_name
        })
      };

      const response = await fetch('/api/cancel-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Yêu cầu hủy đăng ký không thành công');
      }

      if (data.request_type === 'donation') {
        toast.success("Cảm ơn bạn đã quyên góp cho sự kiện! Đăng ký đã được hủy.");
      } else {
        toast.success("Yêu cầu hủy đăng ký đã được gửi! Chúng tôi sẽ xử lý trong vòng 3-5 ngày làm việc.");
      }
      
      onSuccess();
      onClose();
      reset();
      
    } catch (error) {
      console.error('Cancel request error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi gửi yêu cầu hủy đăng ký");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Yêu cầu hủy đăng ký
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Registration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin đăng ký</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã đăng ký:</span>
                <span className="font-medium">#{registration.invoice_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số người tham gia:</span>
                <span className="font-medium">{registration.participant_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng chi phí:</span>
                <span className="font-medium">¥{registration.total_amount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Request Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chọn loại yêu cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={requestType} 
                onValueChange={(value) => setValue("request_type", value as "refund" | "donation")}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="refund" id="refund" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="refund" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Yêu cầu hoàn tiền</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nhận lại số tiền đã thanh toán qua chuyển khoản ngân hàng
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="donation" id="donation" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="donation" className="flex items-center gap-2 cursor-pointer">
                      <Heart className="h-4 w-4" />
                      <span className="font-medium">Quyên góp cho sự kiện</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Không yêu cầu hoàn tiền, số tiền sẽ được dùng để hỗ trợ sự kiện
                    </p>
                  </div>
                </div>
              </RadioGroup>
              {errors.request_type && (
                <p className="text-sm text-destructive mt-2">
                  {errors.request_type.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bank Information - Only show for refund */}
          {isRefund && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin ngân hàng</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Thông tin này sẽ được sử dụng để chuyển tiền hoàn lại
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Tên ngân hàng và chi nhánh *</Label>
                  <Input
                    id="bank_name"
                    {...register("bank_name")}
                    placeholder="VD: Ngân hàng Yucho, chi nhánh 二四八(ニヨンハチ）"
                  />
                  {errors.bank_name && (
                    <p className="text-sm text-destructive">
                      {errors.bank_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_holder_name">Tên chủ tài khoản *</Label>
                  <Input
                    id="account_holder_name"
                    {...register("account_holder_name")}
                    placeholder="Tên đúng như trên sổ tài khoản"
                  />
                  {errors.account_holder_name && (
                    <p className="text-sm text-destructive">
                      {errors.account_holder_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Số tài khoản *</Label>
                  <Input
                    id="bank_account_number"
                    {...register("bank_account_number")}
                    placeholder="Số tài khoản ngân hàng"
                  />
                  {errors.bank_account_number && (
                    <p className="text-sm text-destructive">
                      {errors.bank_account_number.message}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ thông tin ngân hàng. 
                    Chúng tôi sẽ không chịu trách nhiệm nếu thông tin không chính xác.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lý do hủy đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="reason">Lý do *</Label>
                <Textarea
                  id="reason"
                  {...register("reason")}
                  placeholder="Vui lòng mô tả lý do bạn muốn hủy đăng ký..."
                  rows={4}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">
                    {errors.reason.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-medium text-orange-800">Lưu ý quan trọng:</p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Sau khi gửi yêu cầu, bạn không thể thay đổi hoặc hủy bỏ</li>
                  <li>• Thời gian xử lý hoàn tiền: 3-5 ngày làm việc</li>
                  <li>• Phí giao dịch ngân hàng (nếu có) sẽ được trừ từ số tiền hoàn lại</li>
                  <li>• Đăng ký sẽ bị hủy ngay lập tức sau khi gửi yêu cầu</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={isRefund ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isSubmitting ? "Đang gửi..." : (
                isRefund ? "Gửi yêu cầu hoàn tiền" : "Xác nhận quyên góp"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
