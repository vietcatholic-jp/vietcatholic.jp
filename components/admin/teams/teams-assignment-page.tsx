"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, UserPlus, Users } from "lucide-react";
import { UnassignedRegistrantsList } from "./unassigned-registrants-list";
import { TeamManagementTab } from "./team-management-tab";
import { TeamStatsOverview } from "./team-stats-overview";

export function TeamsAssignmentPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phân đội</h1>
          <p className="text-muted-foreground">
            Quản lý việc phân chia người tham dự vào các đội
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Chưa phân đội</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Quản lý đội</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <TeamStatsOverview />
        </TabsContent>

        {/* Unassigned Registrants Tab */}
        <TabsContent value="unassigned">
          <UnassignedRegistrantsList />
        </TabsContent>

        {/* Teams Management Tab */}
        <TabsContent value="teams">
          <TeamManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
