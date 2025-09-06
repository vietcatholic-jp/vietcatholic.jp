"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Users,
  Filter,
  Eye,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Registrant } from "@/lib/types";
import { cardGeneratorService } from "@/lib/services/card-generator-service";
import { CardImageData } from "@/lib/card-constants";

interface Team {
  id: string;
  name: string;
  member_count: number;
}

interface CardGeneratorPageState {
  // Filter options
  selectedTeams: string[];
  roleFilter: 'all' | 'organizer' | 'participant';
  searchQuery: string;
  
  // Available data
  teams: Team[];
  availableUsers: Registrant[];
  filteredUsers: Registrant[];
  
  // User selection
  selectedUsers: string[];
  
  // Card generation
  generatedCards: CardImageData[];
  isGenerating: boolean;
  generationProgress: number;
  
  // Preview
  showPreview: boolean;
  previewCards: CardImageData[];
  
  // Export
  isExporting: boolean;
  exportProgress: number;
  
  // Loading states
  isLoadingTeams: boolean;
  isLoadingUsers: boolean;
}

export default function CardGeneratorPage() {
  const [state, setState] = useState<CardGeneratorPageState>({
    selectedTeams: [],
    roleFilter: 'all',
    searchQuery: '',
    teams: [],
    availableUsers: [],
    filteredUsers: [],
    selectedUsers: [],
    generatedCards: [],
    isGenerating: false,
    generationProgress: 0,
    showPreview: false,
    previewCards: [],
    isExporting: false,
    exportProgress: 0,
    isLoadingTeams: false,
    isLoadingUsers: false
  });

  // Load teams on component mount
  useEffect(() => {
    loadTeams();
    loadUsers();
  }, []);

  // Filter users when filters change
  useEffect(() => {
    filterUsers();
  }, [state.availableUsers, state.selectedTeams, state.roleFilter, state.searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTeams = async () => {
    setState(prev => ({ ...prev, isLoadingTeams: true }));
    try {
      const response = await fetch('/api/admin/teams');
      if (response.ok) {
        const teams = await response.json();
        setState(prev => ({ ...prev, teams, isLoadingTeams: false }));
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Lỗi tải danh sách team');
      setState(prev => ({ ...prev, isLoadingTeams: false }));
    }
  };

  const loadUsers = async () => {
    setState(prev => ({ ...prev, isLoadingUsers: true }));
    try {
      const response = await fetch('/api/admin/registrants');
      if (response.ok) {
        const users = await response.json();
        setState(prev => ({ ...prev, availableUsers: users, isLoadingUsers: false }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Lỗi tải danh sách người dùng');
      setState(prev => ({ ...prev, isLoadingUsers: false }));
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(state.availableUsers) || state.availableUsers.length <= 0) {
      setState(prev => ({ ...prev, filteredUsers: [] }));
      return;
    }
    let filtered = [...state.availableUsers];

    // Filter by teams
    if (state.selectedTeams.length > 0) {
      filtered = filtered.filter(user => 
        user.event_team_id && state.selectedTeams.includes(user.event_team_id)
      );
    }

    // Filter by role
    if (state.roleFilter === 'organizer') {
      filtered = filtered.filter(user => user.event_role?.name);
    } else if (state.roleFilter === 'participant') {
      filtered = filtered.filter(user => !user.event_role?.name);
    }

    // Filter by search query
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(query) ||
        (user.saint_name && user.saint_name.toLowerCase().includes(query))
      );
    }

    setState(prev => ({ ...prev, filteredUsers: filtered }));
  };

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedTeams: checked
        ? [...prev.selectedTeams, teamId]
        : prev.selectedTeams.filter(id => id !== teamId)
    }));
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedUsers: checked
        ? [...prev.selectedUsers, userId]
        : prev.selectedUsers.filter(id => id !== userId)
    }));
  };

  const handleSelectAll = () => {
    const allUserIds = state.filteredUsers.map(user => user.id);
    setState(prev => ({ ...prev, selectedUsers: allUserIds }));
  };

  const handleDeselectAll = () => {
    setState(prev => ({ ...prev, selectedUsers: [] }));
  };

  const generatePreview = async () => {
    if (state.selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    const selectedRegistrants = state.availableUsers.filter(user =>
      state.selectedUsers.includes(user.id)
    );

    setState(prev => ({ ...prev, isGenerating: true, generationProgress: 0 }));

    try {
      const previewCards = await cardGeneratorService.getCardsPreview(
        selectedRegistrants,
        12 // Limit preview to 12 cards
      );

      setState(prev => ({
        ...prev,
        previewCards,
        showPreview: true,
        isGenerating: false,
        generationProgress: 100
      }));

      toast.success(`Đã tạo preview cho ${previewCards.length} thẻ`);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Lỗi tạo preview');
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const exportPDF = async () => {
    if (state.selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    const selectedRegistrants = state.availableUsers.filter(user =>
      state.selectedUsers.includes(user.id)
    );

    setState(prev => ({ ...prev, isExporting: true, exportProgress: 0 }));

    try {
      const result = await cardGeneratorService.generateAndExportPDF(
        selectedRegistrants,
        `the-id-cards-${new Date().toISOString().split('T')[0]}.pdf`,
        (completed, total) => {
          const progress = Math.round((completed / total) * 100);
          setState(prev => ({ ...prev, exportProgress: progress }));
        }
      );

      if (result.success) {
        toast.success(`Đã xuất PDF thành công cho ${selectedRegistrants.length} thẻ`);
      } else {
        toast.error(result.error || 'Lỗi xuất PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Lỗi xuất PDF');
    } finally {
      setState(prev => ({ ...prev, isExporting: false, exportProgress: 0 }));
    }
  };

  const cardStats = cardGeneratorService.getCardStats(
    state.availableUsers.length > 0 ? state.availableUsers.filter(user => state.selectedUsers.includes(user.id)) : []
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tạo thẻ ID</h1>
          <p className="text-muted-foreground">
            Tạo và xuất thẻ ID với layout A4 (4 thẻ/trang)
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {state.selectedUsers.length} người được chọn
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="search">Tìm kiếm theo tên</Label>
                <Input
                  id="search"
                  placeholder="Nhập tên hoặc tên thánh..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                />
              </div>

              {/* Role Filter */}
              <div>
                <Label>Vai trò</Label>
                <Select
                  value={state.roleFilter}
                  onValueChange={(value: 'all' | 'organizer' | 'participant') =>
                    setState(prev => ({ ...prev, roleFilter: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="organizer">Ban tổ chức</SelectItem>
                    <SelectItem value="participant">Tham dự viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team Filter */}
              <div>
                <Label>Team</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {state.teams.map(team => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={state.selectedTeams.includes(team.id)}
                        onCheckedChange={(checked) =>
                          handleTeamSelection(team.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`team-${team.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {team.name} ({team.member_count})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Danh sách người dùng ({state.filteredUsers.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Chọn tất cả
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Bỏ chọn tất cả
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {state.filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={state.selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) =>
                        handleUserSelection(user.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.saint_name && `(${user.saint_name}) • `}
                        {user.event_role?.name || 'Tham dự viên'}
                      </div>
                    </div>
                    {user.portrait_url && (
                      <Badge variant="secondary" className="text-xs">
                        Có ảnh
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Stats */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Tổng số thẻ:</span>
                <span className="font-medium">{cardStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Ban tổ chức:</span>
                <span className="font-medium">{cardStats.organizers}</span>
              </div>
              <div className="flex justify-between">
                <span>Tham dự viên:</span>
                <span className="font-medium">{cardStats.participants}</span>
              </div>
              <div className="flex justify-between">
                <span>Có ảnh:</span>
                <span className="font-medium">{cardStats.withPhoto}</span>
              </div>
              <div className="flex justify-between">
                <span>Không có ảnh:</span>
                <span className="font-medium">{cardStats.withoutPhoto}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Số trang PDF:</span>
                <span className="font-medium">{cardStats.estimatedPages}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={generatePreview}
                disabled={state.selectedUsers.length === 0 || state.isGenerating}
                className="w-full"
                variant="outline"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo preview...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Xem preview
                  </>
                )}
              </Button>

              <Button
                onClick={exportPDF}
                disabled={state.selectedUsers.length === 0 || state.isExporting}
                className="w-full"
              >
                {state.isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xuất PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Xuất PDF
                  </>
                )}
              </Button>

              {/* Progress bars */}
              {state.isGenerating && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Đang tạo preview...
                  </div>
                  <Progress value={state.generationProgress} />
                </div>
              )}

              {state.isExporting && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Đang xuất PDF... {state.exportProgress}%
                  </div>
                  <Progress value={state.exportProgress} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section */}
      {state.showPreview && state.previewCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview thẻ ({state.previewCards.length} thẻ đầu tiên)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {state.previewCards.map((card) => (
                <div key={card.id} className="space-y-2">
                  <div className="aspect-[3/4] border rounded-lg overflow-hidden bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.imageDataUrl}
                      alt={`Thẻ ${card.userInfo.fullName}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{card.userInfo.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {card.userInfo.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
