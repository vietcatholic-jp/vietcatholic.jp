import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { RegistrationGuide } from "@/components/guide/registration-guide";

export const metadata: Metadata = {
  title: "Hướng dẫn đăng ký - Đại hội Công giáo Việt Nam tại Nhật Bản 2025",
  description: "Hướng dẫn chi tiết về quy trình đăng ký, đóng phí tham dự, quản lý và chính sách hủy đăng ký",
};

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <RegistrationGuide />
    </main>
  );
}
