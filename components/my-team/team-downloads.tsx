"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  CreditCard,
  Loader2,
  FileText,
  Users,
  Ticket
} from "lucide-react";
import { ProgressDialog } from "@/components/badges/progress-dialog";
import { generateTicketImage as generateTicketImageUtil, generateBadgeImage } from "@/lib/ticket-utils";
import { cardGeneratorService } from "@/lib/services/card-generator-service";
import { TeamMember } from "@/lib/types/team-management";
import { Registrant, ShirtSizeType } from "@/lib/types";
import JSZip from "jszip";
import { format } from "date-fns";
interface TeamDownloadsProps {
  members: TeamMember[];
  teamName: string;
}

export function TeamDownloads({ members, teamName }: TeamDownloadsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingTickets, setIsGeneratingTickets] = useState(false);
  const [isGeneratingBadges, setIsGeneratingBadges] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  // Filter confirmed members only
  const confirmedMembers = members.filter(member => 
    member.registration && ['confirmed','temp_confirmed'].includes(member.registration.status)
  );

  const filteredMembers = confirmedMembers.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.event_role?.name && member.event_role.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map(m => m.id));
    }
  };

  const handleSelectMember = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // Convert TeamMember to Registrant format for ticket/badge generation
  const convertToRegistrant = (member: TeamMember): Registrant => {
    return {
      id: member.id,
      registration_id: member.registration?.id || '',
      email: member.email,
      saint_name: undefined,
      full_name: member.full_name,
      gender: member.gender,
      age_group: member.age_group === 'under_18' ? 'under_12' : 
                 member.age_group === '18_25' ? '18_25' : 
                 member.age_group === '26_35' ? '26_35' : 
                 member.age_group === '36_50' ? '36_50' : 'over_50',
      province: member.province,
      diocese: member.diocese,
      address: undefined,
      facebook_link: member.facebook_link,
      phone: member.phone,
      shirt_size: 'M' as ShirtSizeType, // Default shirt size since it's required
      event_team_id: undefined,
      event_role_id: member.event_role?.id,
      event_role: member.event_role,
      portrait_url: member.portrait_url,
      go_with: undefined,
      second_day_only: member.second_day_only || false,
      selected_attendance_day: member.selected_attendance_day || undefined,
      notes: undefined,
      created_at: member.created_at,
      updated_at: member.updated_at,
      is_checked_in: false,
      checked_in_at: undefined,
      event_team: {
        name: teamName,
      },
    };
  };

  const handleGenerateTickets = async () => {
    if (selectedIds.length === 0) return;

    const selectedMembers = filteredMembers.filter(m => selectedIds.includes(m.id));
    setCancelGeneration(false);
    setIsGeneratingTickets(true);

    setProgressDialog({
      isOpen: true,
      title: 'Tạo vé tham dự',
      total: selectedMembers.length,
      current: 0,
      status: 'processing',
      statusText: `Đang chuẩn bị tạo ${selectedMembers.length} vé...`,
      errorMessage: ''
    });

    try {
      const zip = new JSZip();
      const ticketsFolder = zip.folder('tickets');
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedMembers.length; i++) {
        if (cancelGeneration) {
          setProgressDialog(prev => ({
            ...prev,
            status: 'error',
            statusText: 'Đã hủy tạo vé',
            errorMessage: 'Quá trình tạo vé đã được hủy bởi người dùng'
          }));
          return;
        }

        const member = selectedMembers[i];
        setProgressDialog(prev => ({
          ...prev,
          current: i,
          statusText: `Đang tạo vé ${i + 1}/${selectedMembers.length}: ${member.full_name}`
        }));

        try {
          const registrant = convertToRegistrant(member);
          const blob = await generateTicketImageUtil(registrant);
          if (blob && ticketsFolder) {
            const fileName = `${member.registration?.invoice_code || 'unknown'}-${member.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            ticketsFolder.file(fileName, blob);
          }
          successCount++;
        } catch (error) {
          console.error(`Failed to generate ticket for ${member.full_name}:`, error);
          errorCount++;
        }
      }

      setProgressDialog(prev => ({
        ...prev,
        current: selectedMembers.length,
        statusText: 'Đang tạo file ZIP...'
      }));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${teamName}-Tickets-${format(new Date(), 'yyyy-MM-dd-HHmm')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgressDialog(prev => ({
        ...prev,
        status: 'success',
        statusText: `Đã tạo thành công ${successCount} vé!${errorCount > 0 ? ` (${errorCount} lỗi)` : ''}`
      }));

    } catch (error) {
      console.error('Error generating tickets:', error);
      setProgressDialog(prev => ({
        ...prev,
        status: 'error',
        statusText: 'Có lỗi xảy ra khi tạo vé',
        errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định'
      }));
    } finally {
      setIsGeneratingTickets(false);
    }
  };

  const handleGenerateBadges = async () => {
    if (selectedIds.length === 0) return;

    const selectedMembers = filteredMembers.filter(m => selectedIds.includes(m.id));
    setCancelGeneration(false);
    setIsGeneratingBadges(true);

    setProgressDialog({
      isOpen: true,
      title: 'Tạo thẻ tham dự',
      total: selectedMembers.length,
      current: 0,
      status: 'processing',
      statusText: `Đang chuẩn bị tạo ${selectedMembers.length} thẻ...`,
      errorMessage: ''
    });

    try {
      const zip = new JSZip();
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedMembers.length; i++) {
        if (cancelGeneration) {
          setProgressDialog(prev => ({
            ...prev,
            status: 'error',
            statusText: 'Đã hủy tạo thẻ',
            errorMessage: 'Quá trình tạo thẻ đã được hủy bởi người dùng'
          }));
          return;
        }

        const member = selectedMembers[i];
        setProgressDialog(prev => ({
          ...prev,
          current: i,
          statusText: `Đang tạo thẻ ${i + 1}/${selectedMembers.length}: ${member.full_name}`
        }));

        try {
          const registrant = convertToRegistrant(member);
          const imageUrl = await generateBadgeImage(registrant);
          const imageData = imageUrl.split(',')[1];
          const fileName = `Badge-${member.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          zip.file(fileName, imageData, { base64: true });
          successCount++;
        } catch (error) {
          console.error(`Failed to generate badge for ${member.full_name}:`, error);
          errorCount++;
        }
      }

      setProgressDialog(prev => ({
        ...prev,
        current: selectedMembers.length,
        statusText: 'Đang tạo file ZIP...'
      }));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${teamName}-Badges-${format(new Date(), 'yyyy-MM-dd-HHmm')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgressDialog(prev => ({
        ...prev,
        status: 'success',
        statusText: `Đã tạo thành công ${successCount} thẻ!${errorCount > 0 ? ` (${errorCount} lỗi)` : ''}`
      }));

    } catch (error) {
      console.error('Error generating badges:', error);
      setProgressDialog(prev => ({
        ...prev,
        status: 'error',
        statusText: 'Có lỗi xảy ra khi tạo thẻ',
        errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định'
      }));
    } finally {
      setIsGeneratingBadges(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (selectedIds.length === 0) return;

    const selectedMembers = filteredMembers.filter(m => selectedIds.includes(m.id));
    setCancelGeneration(false);
    setIsGeneratingPdf(true);

    setProgressDialog({
      isOpen: true,
      title: 'Tạo PDF thẻ tham dự',
      total: selectedMembers.length,
      current: 0,
      status: 'processing',
      statusText: 'Đang chuẩn bị...',
      errorMessage: ''
    });

    try {
      const registrants = selectedMembers.map(convertToRegistrant);
      
      const result = await cardGeneratorService.generateAndExportPDF(
        registrants,
        `${teamName}-Badges-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`,
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
        setProgressDialog(prev => ({
          ...prev,
          status: 'success',
          statusText: 'Tạo PDF thành công!'
        }));

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

  if (confirmedMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Tải xuống vé và thẻ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có thành viên đã xác nhận</h3>
            <p className="text-muted-foreground">
              Không có thành viên nào đã xác nhận để tải vé và thẻ.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Tải xuống vé và thẻ ({confirmedMembers.length} thành viên)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc vai trò..."
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
                {selectedIds.length === filteredMembers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleGenerateTickets}
              disabled={selectedIds.length === 0 || isGeneratingTickets || isGeneratingBadges || isGeneratingPdf}
              size="sm"
            >
              {isGeneratingTickets ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo vé...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  Tải vé ZIP ({selectedIds.length})
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerateBadges}
              disabled={selectedIds.length === 0 || isGeneratingBadges || isGeneratingTickets || isGeneratingPdf}
              size="sm"
              variant="outline"
            >
              {isGeneratingBadges ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo thẻ...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Tải thẻ ZIP ({selectedIds.length})
                </>
              )}
            </Button>
            <Button
              onClick={handleGeneratePdf}
              disabled={selectedIds.length === 0 || isGeneratingPdf || isGeneratingTickets || isGeneratingBadges}
              size="sm"
              variant="secondary"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo PDF...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Tải thẻ PDF ({selectedIds.length})
                </>
              )}
            </Button>
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedIds.includes(member.id)}
                  onCheckedChange={() => handleSelectMember(member.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {member.registration?.invoice_code || 'N/A'}
                    </Badge>
                  </div>
                  {member.event_role?.name && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {member.event_role.name}
                    </Badge>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    {member.province} - {member.diocese}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy thành viên</h3>
              <p className="text-muted-foreground">
                Thử thay đổi từ khóa tìm kiếm.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
