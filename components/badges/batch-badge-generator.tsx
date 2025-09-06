"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download,
  Search,
  CreditCard,
  Loader2,
  FileText,
  Users
} from "lucide-react";
import { BadgeGenerator } from "./badge-generator";
import { EnhancedFilterTabs } from "./enhanced-filter-tabs";
import { ProgressDialog } from "./progress-dialog";
import { getEventRoleCategory, RoleCategory } from "@/lib/role-utils";
import { cardGeneratorService } from "@/lib/services/card-generator-service";
import JSZip from "jszip";
import { generateBadgeImage } from "@/lib/ticket-utils";
import { Registrant } from "@/lib/types";


interface Team {
  id: string;
  name: string;
  member_count: number;
}

export function BatchBadgeGenerator() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory | 'all'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewRegistrant, setPreviewRegistrant] = useState<Registrant | null>(null);

  // Progress Dialog State
  const [progressDialog, setProgressDialog] = useState({
    isOpen: false,
    title: '',
    total: 0,
    current: 0,
    status: 'processing' as 'processing' | 'success' | 'error',
    statusText: '',
    errorMessage: ''
  });
  const [cancelGeneration, setCancelGeneration] = useState(false);

  useEffect(() => {
    fetchRegistrants();
    fetchTeams();
  }, []);

  const fetchRegistrants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/registrants?status=all_confirmed');
      if (!response.ok) {
        throw new Error('Failed to fetch registrants');
      }
      const data = await response.json();
      setRegistrants(data.registrants || []);
    } catch (error) {
      console.error('Error fetching registrants:', error);
      // Error handling moved to progress dialog system
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const response = await fetch('/api/admin/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const filteredRegistrants = registrants.filter(registrant => {
    // Text search filter
    const matchesSearch = registrant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (registrant.saint_name && registrant.saint_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (registrant.event_role?.name && registrant.event_role.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply filters based on which one is active
    let matchesFilter = true;

    if (selectedCategory !== 'all') {
      // Category filter is active
      matchesFilter = getEventRoleCategory(registrant.event_role?.name) === selectedCategory;
    } else if (selectedTeam !== 'all') {
      // Team filter is active
      if (selectedTeam === 'no-team') {
        // Filter for registrants without a team
        matchesFilter = !registrant.event_team_id;
      } else {
        matchesFilter = registrant.event_team_id === selectedTeam;
      }
    }

    return matchesSearch && matchesFilter;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRegistrants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrants.map(r => r.id));
    }
  };

  const handleSelectRegistrant = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // Mutual exclusive handlers
  const handleCategoryChange = (category: RoleCategory | 'all') => {
    setSelectedCategory(category);
    if (category !== 'all') {
      setSelectedTeam('all'); // Reset team filter when category is selected
    }
  };

  const handleTeamChange = (team: string | 'all') => {
    setSelectedTeam(team);
    if (team !== 'all') {
      setSelectedCategory('all'); // Reset category filter when team is selected
    }
  };

  const handleQuickSelectCategory = (category: RoleCategory | 'all') => {
    if (category === 'all') {
      setSelectedIds(registrants.map(r => r.id));
    } else {
      const categoryRegistrants = registrants.filter(registrant =>
        getEventRoleCategory(registrant.event_role?.name) === category
      );
      const categoryIds = categoryRegistrants.map(r => r.id);

      // Toggle selection: if all are selected, deselect; otherwise select all
      const allSelected = categoryIds.every(id => selectedIds.includes(id));
      if (allSelected) {
        setSelectedIds(prev => prev.filter(id => !categoryIds.includes(id)));
      } else {
        setSelectedIds(prev => [...new Set([...prev, ...categoryIds])]);
      }
    }
  };

  const handleQuickSelectTeam = (team: string | 'all') => {
    if (team === 'all') {
      setSelectedIds(registrants.map(r => r.id));
    } else {
      const teamRegistrants = registrants.filter(registrant => {
        if (team === 'no-team') {
          // Filter for registrants without a team
          return !registrant.event_team_id;
        } else {
          return registrant.event_team_id === team;
        }
      });
      const teamIds = teamRegistrants.map(r => r.id);

      // Toggle selection: if all are selected, deselect; otherwise select all
      const allSelected = teamIds.every(id => selectedIds.includes(id));
      if (allSelected) {
        setSelectedIds(prev => prev.filter(id => !teamIds.includes(id)));
      } else {
        setSelectedIds(prev => [...new Set([...prev, ...teamIds])]);
      }
    }
  };

  const handleGenerateZip = async () => {
    if (selectedIds.length === 0) return;

    const selectedRegistrants = registrants.filter(r => selectedIds.includes(r.id));
    setCancelGeneration(false);
    setIsGeneratingZip(true);

    // Initialize progress dialog
    setProgressDialog({
      isOpen: true,
      title: 'Tạo thẻ tham dự',
      total: selectedRegistrants.length,
      current: 0,
      status: 'processing',
      statusText: `Đang chuẩn bị tạo ${selectedRegistrants.length} thẻ...`,
      errorMessage: ''
    });

    try {
      const zip = new JSZip();
      let successCount = 0;
      let errorCount = 0;

      // Generate badges one by one for better progress tracking
      for (let i = 0; i < selectedRegistrants.length; i++) {
        // Check if user cancelled
        if (cancelGeneration) {
          setProgressDialog(prev => ({
            ...prev,
            status: 'error',
            statusText: 'Đã hủy tạo thẻ',
            errorMessage: 'Quá trình tạo thẻ đã được hủy bởi người dùng'
          }));
          return;
        }

        const registrant = selectedRegistrants[i];

        // Update progress
        setProgressDialog(prev => ({
          ...prev,
          current: i,
          statusText: `Đang tạo thẻ ${i + 1}/${selectedRegistrants.length}: ${registrant.full_name}`
        }));

        try {
          const imageUrl = await generateBadgeImage(registrant);
          const imageData = imageUrl.split(',')[1]; // Remove data:image/png;base64,
          const fileName = `Badge-${registrant.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          zip.file(fileName, imageData, { base64: true });
          successCount++;
        } catch (error) {
          console.error(`Failed to generate badge for ${registrant.full_name}:`, error);
          errorCount++;
        }
      }

      // Update progress for ZIP generation
      setProgressDialog(prev => ({
        ...prev,
        current: selectedRegistrants.length,
        statusText: 'Đang tạo file ZIP...'
      }));

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `DaiHoiCongGiao2025-Badges-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Success
      setProgressDialog(prev => ({
        ...prev,
        status: 'success',
        statusText: `Đã tạo thành công ${successCount} thẻ!${errorCount > 0 ? ` (${errorCount} lỗi)` : ''}`
      }));

    } catch (error) {
      console.error('Error generating ZIP:', error);
      setProgressDialog(prev => ({
        ...prev,
        status: 'error',
        statusText: 'Có lỗi xảy ra khi tạo file ZIP',
        errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định'
      }));
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (selectedIds.length === 0) return;

    const selectedRegistrants = registrants.filter(r => selectedIds.includes(r.id));
    setCancelGeneration(false);
    setIsGeneratingPdf(true);

    // Show progress dialog
    setProgressDialog({
      isOpen: true,
      title: 'Tạo PDF thẻ tham dự',
      total: selectedRegistrants.length,
      current: 0,
      status: 'processing',
      statusText: 'Đang chuẩn bị...',
      errorMessage: ''
    });

    try {
      // Generate PDF using cardGeneratorService
      const result = await cardGeneratorService.generateAndExportPDF(
        selectedRegistrants as import('@/lib/types').Registrant[], // Type cast - interface mismatch
        `DaiHoiCongGiao2025-Badges-${new Date().toISOString().split('T')[0]}.pdf`,
        (completed, total) => {
          if (cancelGeneration) return;

          setProgressDialog(prev => ({
            ...prev,
            current: completed,
            statusText: `Đang tạo thẻ ${completed}/${total}...`
          }));
        }
      );

      if (result.success) {
        // Success
        setProgressDialog(prev => ({
          ...prev,
          status: 'success',
          statusText: 'Tạo PDF thành công!'
        }));

        // Auto close after 2 seconds
        setTimeout(() => {
          setProgressDialog(prev => ({ ...prev, isOpen: false }));
        }, 2000);
      } else {
        throw new Error(result.error || 'Lỗi không xác định');
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      setProgressDialog(prev => ({
        ...prev,
        status: 'error',
        statusText: 'Có lỗi xảy ra',
        errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định'
      }));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCancelGeneration = () => {
    setCancelGeneration(true);
  };

  const handleCloseProgressDialog = () => {
    setProgressDialog(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Tạo thẻ tham dự hàng loạt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Filter Tabs */}
          <EnhancedFilterTabs
            registrants={registrants}
            selectedCategory={selectedCategory}
            selectedTeam={selectedTeam}
            selectedIds={selectedIds}
            onCategoryChange={handleCategoryChange}
            onTeamChange={handleTeamChange}
            onQuickSelectCategory={handleQuickSelectCategory}
            onQuickSelectTeam={handleQuickSelectTeam}
          />

          {/* Team Filter and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Team Filter */}
            <div className="w-full sm:w-64">
              <Select
                value={selectedTeam}
                onValueChange={(value) => {
                  setSelectedTeam(value as string | 'all');
                  // Reset category filter when selecting team
                  if (value !== 'all') {
                    setSelectedCategory('all');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đội..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tất cả đội
                    </div>
                  </SelectItem>
                  <SelectItem value="no-team">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Không chia đội
                    </div>
                  </SelectItem>
                  {isLoadingTeams ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </div>
                    </SelectItem>
                  ) : (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{team.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {team.member_count}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên, tên thánh, hoặc vai trò..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
              >
                {selectedIds.length === filteredRegistrants.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
              <Button
                onClick={handleGenerateZip}
                disabled={selectedIds.length === 0 || isGeneratingZip || isGeneratingPdf}
                size="sm"
              >
                {isGeneratingZip ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Tạo ZIP ({selectedIds.length})
                  </>
                )}
              </Button>
              <Button
                onClick={handleGeneratePdf}
                disabled={selectedIds.length === 0 || isGeneratingPdf || isGeneratingZip}
                size="sm"
                variant="outline"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Tạo PDF ({selectedIds.length})
                  </>
                )}
              </Button>
            </div>
          </div>



          {/* Registrants List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredRegistrants.map((registrant) => (
                <div
                  key={registrant.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.includes(registrant.id)}
                    onCheckedChange={() => handleSelectRegistrant(registrant.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{registrant.full_name}</span>
                      {registrant.saint_name && (
                        <span className="text-sm text-muted-foreground">({registrant.saint_name})</span>
                      )}
                    </div>
                    {registrant.event_role?.name && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {registrant.event_role?.name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewRegistrant(registrant)}
                  >
                    Xem trước
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewRegistrant && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Xem trước thẻ - {previewRegistrant.full_name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewRegistrant(null)}
              >
                Đóng
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeGenerator registrant={previewRegistrant}/>
          </CardContent>
        </Card>
      )}

      {/* Progress Dialog */}
      <ProgressDialog
        isOpen={progressDialog.isOpen}
        onClose={handleCloseProgressDialog}
        title={progressDialog.title}
        total={progressDialog.total}
        current={progressDialog.current}
        status={progressDialog.status}
        statusText={progressDialog.statusText}
        errorMessage={progressDialog.errorMessage}
        onCancel={handleCancelGeneration}
        canCancel={progressDialog.status === 'processing'}
      />
    </div>
  );
}
