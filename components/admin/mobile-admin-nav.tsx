"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  BarChart3, 
  Wrench, 
  UserCheck, 
  Settings, 
  CreditCard,
  ChevronDown
} from "lucide-react";
import { UserRole } from "@/lib/types";

interface MobileAdminNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
}

const tabConfig = {
  overview: { icon: BarChart3, label: "Tổng quan", color: "bg-blue-50 text-blue-700" },
  registrations: { icon: Users, label: "Đăng ký", color: "bg-green-50 text-green-700" },
  tools: { icon: Wrench, label: "Công cụ", color: "bg-purple-50 text-purple-700" },
  users: { icon: UserCheck, label: "Người dùng", color: "bg-orange-50 text-orange-700" },
  events: { icon: Settings, label: "Sự kiện", color: "bg-red-50 text-red-700" },
  payments: { icon: CreditCard, label: "Thanh toán", color: "bg-yellow-50 text-yellow-700" },
};

export function MobileAdminNav({ activeTab, onTabChange, userRole }: MobileAdminNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getVisibleTabs = () => {
    const tabs = ['overview', 'registrations'];
    
    if (['event_organizer', 'group_leader', 'regional_admin', 'super_admin'].includes(userRole)) {
      tabs.push('tools');
    }
    
    if (userRole === 'super_admin' || userRole === 'regional_admin') {
      tabs.push('users');
    }
    
    if (userRole === 'super_admin') {
      tabs.push('events');
    }
    
    tabs.push('payments');
    
    return tabs;
  };

  const visibleTabs = getVisibleTabs();
  const activeTabConfig = tabConfig[activeTab as keyof typeof tabConfig];
  const ActiveIcon = activeTabConfig?.icon || BarChart3;

  return (
    <div className="md:hidden mb-4">
      <Card>
        <CardContent className="p-0">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTabConfig?.color || 'bg-gray-50'}`}>
                <ActiveIcon className="h-4 w-4" />
              </div>
              <span className="font-medium">{activeTabConfig?.label || 'Chọn tab'}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isOpen && (
            <div className="border-t">
              {visibleTabs.map((tab) => {
                const config = tabConfig[tab as keyof typeof tabConfig];
                const Icon = config.icon;
                
                return (
                  <Button
                    key={tab}
                    variant="ghost"
                    className={`w-full justify-start p-4 h-auto border-b last:border-b-0 ${
                      tab === activeTab ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      onTabChange(tab);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{config.label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
