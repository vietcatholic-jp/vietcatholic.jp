"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Copy, 
  CheckCircle,
  Building2,
  Hash
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentInstructionsProps {
  amount: number;
  invoiceCode: string;
}

export function PaymentInstructions({ amount, invoiceCode }: PaymentInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankInfo = {
    bankName: "ゆうちょ銀行 (Yucho Bank)",
    branchName: "二四八(ニヨンハチ）",
    accountType: "普通 (Futsu/Regular)",
    code: "12440",
    accountNumber: "35579601",
    accountName: "在日カトリックベトナム青年会",
    swiftCode: "",
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`Đã copy ${field}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Không thể copy");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Hướng dẫn thanh toán
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount */}
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Số tiền cần thanh toán</p>
          <p className="text-2xl font-bold text-primary">¥{amount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Mã đăng ký: {invoiceCode}</p>
        </div>

        {/* Bank Transfer Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4" />
            <h4 className="font-medium">Thông tin chuyển khoản</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Tên ngân hàng</p>
                <p className="font-medium">{bankInfo.bankName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankInfo.bankName, "tên ngân hàng")}
              >
                {copiedField === "tên ngân hàng" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Chi nhánh(店名:)</p>
                <p className="font-medium">{bankInfo.branchName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankInfo.branchName, "chi nhánh")}
              >
                {copiedField === "chi nhánh" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Loại tài khoản</p>
                <p className="font-medium">{bankInfo.accountType}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Mã (記号:)</p>
                <p className="font-medium font-mono">{bankInfo.code}</p>
                <p className="text-sm text-muted-foreground">Số tài khoản (番号:)</p>
                <p className="font-medium font-mono">{bankInfo.accountNumber}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankInfo.accountNumber, "số tài khoản")}
              >
                {copiedField === "số tài khoản" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Tên tài khoản</p>
                <p className="font-medium">{bankInfo.accountName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankInfo.accountName, "tên tài khoản")}
              >
                {copiedField === "tên tài khoản" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Nội dung chuyển khoản</p>
                <p className="font-medium font-mono">{invoiceCode}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(invoiceCode, "mã đăng ký")}
              >
                {copiedField === "mã đăng ký" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-900 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Lưu ý quan trọng
          </h4>
          <ul className="text-sm text-amber-800 space-y-1 ml-6 list-disc">
            <li>Vui lòng ghi chính xác mã đăng ký <strong>{invoiceCode}</strong> trong nội dung chuyển khoản</li>
            <li>Sau khi chuyển khoản, vui lòng upload hóa đơn/ảnh chụp màn hình xác nhận</li>
            <li>Đăng ký sẽ được xác nhận trong vòng 1-2 ngày làm việc sau khi nhận được thanh toán</li>
            <li>Nếu có thắc mắc, vui lòng liên hệ: support@daihoiconggiao.jp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
