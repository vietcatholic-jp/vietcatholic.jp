"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RegionType, UserRole, REGIONS, ROLES } from "@/lib/types";
import { useAppStore } from "@/lib/store";

export function OnboardingFlow() {
  const [selectedRegion, setSelectedRegion] = useState<RegionType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { setOnboardingData } = useAppStore();
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRegion && selectedRole) {
      setOnboardingData(selectedRegion, selectedRole);
      
      if (selectedRole === 'participant') {
        router.push('/register');
      } else {
        router.push('/auth/login');
      }
    }
  };

  const isValid = selectedRegion && selectedRole;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Bắt đầu đăng ký</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Region Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Chọn khu vực của bạn:</Label>
          <div className="grid grid-cols-2 gap-2">
            {REGIONS.map((region) => (
              <Button
                key={region.value}
                variant={selectedRegion === region.value ? "default" : "outline"}
                className="h-auto py-3 text-sm"
                onClick={() => setSelectedRegion(region.value)}
              >
                {region.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Vai trò của bạn:</Label>
          <div className="space-y-2">
            {ROLES.map((role) => (
              <Button
                key={role.value}
                variant={selectedRole === role.value ? "default" : "outline"}
                className="w-full h-auto py-3 text-sm justify-start"
                onClick={() => setSelectedRole(role.value)}
              >
                <div>
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {role.value === 'participant' 
                      ? 'Tham gia sự kiện' 
                      : 'Tổ chức và quản lý sự kiện'
                    }
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button 
          className="w-full" 
          size="lg"
          disabled={!isValid}
          onClick={handleContinue}
        >
          {selectedRole === 'participant' ? 'Đăng ký tham gia' : 'Đăng nhập'}
        </Button>

        {selectedRole && (
          <p className="text-xs text-muted-foreground text-center">
            {selectedRole === 'participant' 
              ? 'Bạn sẽ được chuyển đến trang đăng ký' 
              : 'Bạn cần đăng nhập để quản lý sự kiện'
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
