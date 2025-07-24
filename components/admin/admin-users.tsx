"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { UserSearch } from "@/components/admin/user-role-assignment";
import { useAdminData } from "@/components/admin/admin-context";
import { useHasPermission } from "@/lib/hooks/use-permissions";

export function AdminUsers() {
  const { data, isLoading } = useAdminData();
  const canManageRoles = useHasPermission('users.assign_roles');

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';
  const userRegion = data.userProfile?.region;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
        <p className="text-muted-foreground">
          Quản lý thông tin người dùng và phân quyền hệ thống
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Danh sách người dùng</TabsTrigger>
          {canManageRoles && (
            <TabsTrigger value="roles">Quản lý vai trò</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement 
            currentUserRole={userRole}
            currentUserRegion={userRegion}
          />
        </TabsContent>

        {canManageRoles && (
          <TabsContent value="roles" className="space-y-4">
            <UserSearch />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
