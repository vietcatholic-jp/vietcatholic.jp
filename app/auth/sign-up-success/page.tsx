import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Cảm ơn bạn đã đăng ký!
          </CardTitle>
          <CardDescription>Kiểm tra email để xác nhận</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bạn đã đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản của bạn trước khi đăng nhập.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
