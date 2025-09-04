"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  CreditCard,
  Loader2
} from "lucide-react";
import { BadgeGenerator } from "./badge-generator";
import { EnhancedFilterTabs } from "./enhanced-filter-tabs";
import { ProgressDialog } from "./progress-dialog";
import { getEventRoleCategory, RoleCategory } from "@/lib/role-utils";
import JSZip from "jszip";

interface Registrant {
  id: string;
  full_name: string;
  saint_name?: string;
  portrait_url?: string;
  event_role?: {
    name: string;
    description?: string;
  };
  registration?: {
    status: string;
    invoice_code: string;
  };
  event_team_id?: string;
}

export function BatchBadgeGenerator() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory | 'all'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
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
  }, []);

  const fetchRegistrants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/registrants?status=confirmed');
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
      matchesFilter = registrant.event_team_id === selectedTeam;
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
      const teamRegistrants = registrants.filter(registrant =>
        registrant.event_team_id === team
      );
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

  const generateBadgeImage = async (registrant: Registrant): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Tạo element tạm thời để render badge
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '400px';
        tempDiv.style.height = '600px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';

        // Determine background type - SAME AS BadgeGenerator
        const isOrganizer = registrant.event_role?.name;
        const backgroundImage = isOrganizer
          ? '/assets/organizer-with-photo.png'
          : '/assets/no-organizer.png';

        // Create EXACT same structure as BadgeGenerator
        tempDiv.innerHTML = `
          <div style="position: relative; width: 400px; height: 600px; font-family: Arial, sans-serif;">
            <!-- Background Image -->
            <img src="${backgroundImage}" alt="Badge background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" crossorigin="anonymous" />

            <!-- Content overlay -->
            <div style="height: 100%; display: flex; flex-direction: column; position: relative; z-index: 10;">
              <!-- Section 1: Top 1/3 (200px) - Text Information -->
              <div style="display: flex; flex-direction: column; align-items: center; padding: 0 24px; text-align: center; height: 200px;">
                ${isOrganizer ? `
                  <!-- Organizer layout với spacing đều nhau -->
                  <div style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                    <!-- Saint name - phần trên -->
                    <div style="color: #1e40af; font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 24px; height: 60px;">
                      ${registrant.saint_name || '\u00A0'}
                    </div>

                    <!-- Full name - phần giữa -->
                    <div style="color: #1e40af; font-weight: bold; line-height: 1.2; display: flex; align-items: center; justify-content: center; font-size: 28px; height: 60px;">
                      ${registrant.full_name.toUpperCase()}
                    </div>

                    <!-- Role - phần dưới, aligned to right -->
                    <div style="height: 60px; width: 100%; display: flex; align-items: center;">
                      <!-- Div trống bên trái chiếm hết chiều ngang -->
                      <div style="flex: 1;"></div>
                      <!-- Badge bên phải -->
                      ${registrant.event_role?.name ? `
                        <div data-role-badge style="background-color: white; border: 2px solid #16a34a; border-radius: 9999px; padding: 0 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center; text-align: center; height: 40px; white-space: nowrap; color: #15803d; font-weight: bold; font-size: 16px; line-height: 1;">
                          ${registrant.event_role.name.toUpperCase()}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : `
                  <!-- Regular participant layout -->
                  <!-- Team name section temporarily disabled for build -->

                  <!-- Saint name - always reserve space -->
                  <div style="color: #1e40af; font-weight: bold; margin-bottom: 12px; height: 25%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                    ${registrant.saint_name || '\u00A0'}
                  </div>

                  <!-- Full name -->
                  <div style="color: #1e40af; font-weight: bold; line-height: 1.2; margin-bottom: 12px; height: 25%; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                    ${registrant.full_name.toUpperCase()}
                  </div>

                  <!-- Participant badge - aligned to right -->
                  <div style="width: 100%; display: flex;">
                    <!-- Div trống bên trái chiếm hết chiều ngang -->
                    <div style="flex: 1;"></div>
                    <!-- Badge bên phải -->
                    <div data-role-badge style="background-color: white; border: 2px solid #16a34a; border-radius: 9999px; padding: 0 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center; text-align: center; height: 40px; white-space: nowrap; color: #15803d; font-weight: bold; font-size: 16px; line-height: 1;">
                      THAM DỰ VIÊN
                    </div>
                  </div>
                `}
              </div>

              <!-- Section 2: Middle 1/2 (300px) - Avatar or Logo -->
              <div style="display: flex; align-items: center; justify-content: center; padding: 0 24px; height: 300px;">
                ${registrant.portrait_url ? `
                  <!-- Avatar - circular, 60% width of card (240px) -->
                  <div style="width: 240px; height: 240px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative;">
                    <img src="${registrant.portrait_url}" alt="${registrant.full_name} portrait" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;" />
                  </div>
                ` : `
                  <!-- Fallback Logo - circular, 60% width of card (240px) -->
                  <div style="width: 240px; height: 240px; border-radius: 50%; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative;">
                    <img src="/logo-dh-2025.jpg" alt="Logo Đại hội Năm Thánh 2025" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;" />
                  </div>
                `}
              </div>

              <!-- Section 3: Bottom 1/6 (100px) - Empty (background only) -->
              <div style="height: 100px;">
                <!-- Empty section - only background image visible -->
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(tempDiv);

        // Wait for images to load - SAME AS BadgeGenerator
        const images = tempDiv.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map((img) => {
            return new Promise((resolve, reject) => {
              if (img.complete) {
                resolve(img);
              } else {
                img.onload = () => resolve(img);
                img.onerror = reject;
                // Timeout sau 10s
                setTimeout(() => resolve(img), 10000);
              }
            });
          })
        );

        // Capture with html2canvas - SAME SETTINGS AS BadgeGenerator
        const html2canvas = (await import('html2canvas')).default;
        const canvasResult = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
          scale: 4,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          imageTimeout: 30000,
          logging: false,
          // Cải thiện quality cho ảnh
          foreignObjectRendering: false,
          removeContainer: true,
          // Đảm bảo font và ảnh được load đúng
          onclone: (clonedDoc) => {
            // Đảm bảo font family được áp dụng đúng
            const clonedElement = clonedDoc.querySelector('[data-badge-content]') as HTMLElement;
            if (clonedElement) {
              clonedElement.style.fontFamily = 'Arial, sans-serif';
            }

            // Đảm bảo tất cả ảnh có crossOrigin và object-fit
            const images = clonedDoc.querySelectorAll('img');
            images.forEach((img) => {
              img.crossOrigin = 'anonymous';
              if (img.style.objectFit === 'cover') {
                img.style.objectFit = 'cover';
                img.style.objectPosition = 'center';
              }
            });

            // CRITICAL: Role badge SVG rendering
            const roleBadges = clonedDoc.querySelectorAll('[data-role-badge]');

            roleBadges.forEach((badge) => {
              const badgeElement = badge as HTMLElement;
              const w = badgeElement.offsetWidth;
              const h = badgeElement.offsetHeight || 40;
              const label = (badgeElement.textContent || '').trim();

              // Clear HTML content and setup for SVG
              badgeElement.style.display = 'block';
              badgeElement.style.alignItems = '';
              badgeElement.style.justifyContent = '';
              badgeElement.style.textAlign = '';
              badgeElement.style.height = h + 'px';
              badgeElement.style.lineHeight = '1';
              badgeElement.style.paddingLeft = '0px';
              badgeElement.style.paddingRight = '0px';
              badgeElement.style.border = 'none';
              badgeElement.innerHTML = '';

              // Create SVG replacement
              const svgNS = 'http://www.w3.org/2000/svg';
              const svg = clonedDoc.createElementNS(svgNS, 'svg');
              svg.setAttribute('width', String(w));
              svg.setAttribute('height', String(h));
              svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

              const rect = clonedDoc.createElementNS(svgNS, 'rect');
              rect.setAttribute('x', '1');
              rect.setAttribute('y', '1');
              rect.setAttribute('width', String(Math.max(0, w - 2)));
              rect.setAttribute('height', String(Math.max(0, h - 2)));
              rect.setAttribute('rx', String(h / 2));
              rect.setAttribute('ry', String(h / 2));
              rect.setAttribute('fill', 'white');
              rect.setAttribute('stroke', '#16a34a');
              rect.setAttribute('stroke-width', '2');

              const text = clonedDoc.createElementNS(svgNS, 'text');
              text.setAttribute('x', '50%');
              text.setAttribute('y', '50%');
              text.setAttribute('dominant-baseline', 'middle');
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('fill', '#15803d');
              text.setAttribute('font-family', 'Arial, sans-serif');
              text.setAttribute('font-weight', '700');
              text.setAttribute('font-size', '16');
              text.textContent = label;

              svg.appendChild(rect);
              svg.appendChild(text);
              badgeElement.appendChild(svg);
            });

            // Font size scaling compensation for scale = 4
            const textDivs = clonedDoc.querySelectorAll('div.text-blue-800[style*="fontSize"]');
            textDivs.forEach((textElement) => {
              const element = textElement as HTMLElement;
              const style = element.style.fontSize;
              if (style === '24px') {
                element.style.fontSize = '6px'; // 24/4 = 6
              } else if (style === '28px') {
                element.style.fontSize = '7px'; // 28/4 = 7
              }
            });
          }
        });

        document.body.removeChild(tempDiv);

        const imageUrl = canvasResult.toDataURL('image/png');
        resolve(imageUrl);
      } catch (error) {
        console.error('Error generating badge for', registrant.full_name, error);
        reject(error);
      }
    });
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

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
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
                disabled={selectedIds.length === 0 || isGeneratingZip}
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
                        {registrant.event_role.name}
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
            <BadgeGenerator registrant={previewRegistrant} />
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
