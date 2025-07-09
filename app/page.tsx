import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { EventInfo } from "@/components/event-info";

export default async function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <Hero />
        
        {/* Event Information */}
        <EventInfo />
        
        {/* Onboarding for new visitors */}
        <section className="py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Tham gia Đại hội Công giáo Việt Nam tại Nhật Bản 2025
            </h2>
            <p className="text-muted-foreground mb-8">
              Chọn khu vực và vai trò của bạn để bắt đầu đăng ký
            </p>
            <OnboardingFlow />
          </div>
        </section>
      </div>
    </main>
  );
}
