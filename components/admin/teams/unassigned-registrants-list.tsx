"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  UserPlus, 
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { AssignTeamDialog } from "./assign-team-dialog";
import { BulkAssignmentDialog } from "./bulk-assignment-dialog";
import { useTeamAssignment } from "@/hooks/use-team-assignment";
import { toast } from "sonner";
import { formatAgeGroup, formatGender } from "@/lib/utils";
import { RoleBadgeCompact } from "@/components/ui/role-badge";
import { RoleHelp } from "@/components/admin/role-help";
import { EventRole } from "@/lib/role-utils";

interface Registrant {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese?: string;
  email?: string;
  phone?: string;
  event_roles?: EventRole | null;
  registration: {
    id: string;
    invoice_code: string;
    status: string;
    user: {
      full_name: string;
      email: string;
    };
  };
}

export function UnassignedRegistrantsList() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [selectedRegistrants, setSelectedRegistrants] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);

  const { isLoading: isAssigning } = useTeamAssignment();

  const fetchRegistrants = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
        search: searchTerm,
        gender: genderFilter,
        age_group: ageGroupFilter,
        province: provinceFilter,
      });

      const response = await fetch(`/api/admin/registrants/unassigned?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch registrants");
      }

      const data = await response.json();
      setRegistrants(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching registrants:", error);
      toast.error("Không thể tải danh sách người tham dự");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrants();
  }, [currentPage, searchTerm, genderFilter, ageGroupFilter, provinceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRegistrants();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrants(registrants.map(r => r.id));
    } else {
      setSelectedRegistrants([]);
    }
  };

  const handleSelectRegistrant = (registrantId: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrants(prev => [...prev, registrantId]);
    } else {
      setSelectedRegistrants(prev => prev.filter(id => id !== registrantId));
    }
  };

  const handleAssignSingle = (registrant: Registrant) => {
    setSelectedRegistrant(registrant);
    setAssignDialogOpen(true);
  };

  const handleBulkAssign = () => {
    setBulkDialogOpen(true);
  };

  const handleAssignmentSuccess = () => {
    setSelectedRegistrants([]);
    setAssignDialogOpen(false);
    setBulkDialogOpen(false);
    fetchRegistrants();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Người chưa được phân đội
              <Badge variant="secondary">{totalCount} người</Badge>
            </div>
            <RoleHelp />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Tất cả giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>

              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Tất cả độ tuổi</option>
                <option value="under_12">Dưới 12 tuổi</option>
                <option value="12_17">12-17 tuổi</option>
                <option value="18_25">18-25 tuổi</option>
                <option value="26_35">26-35 tuổi</option>
                <option value="36_50">36-50 tuổi</option>
                <option value="over_50">Trên 50 tuổi</option>
              </select>

              <Input
                placeholder="Tỉnh/Thành phố"
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="w-48"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRegistrants.length === registrants.length && registrants.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Chọn tất cả ({selectedRegistrants.length}/{registrants.length})
              </span>
            </div>
            {selectedRegistrants.length > 0 && (
              <Button onClick={handleBulkAssign} className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Phân đội hàng loạt ({selectedRegistrants.length})
              </Button>
            )}
          </div>

          {/* Registrants List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : registrants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có người tham dự nào chưa được phân đội
            </div>
          ) : (
            <div className="space-y-2">
              {registrants.map((registrant) => (
                <div
                  key={registrant.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedRegistrants.includes(registrant.id)}
                    onCheckedChange={(checked) => 
                      handleSelectRegistrant(registrant.id, checked as boolean)
                    }
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <div className="font-medium">{registrant.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        #{registrant.registration?.invoice_code || 'N/A'}
                      </div>
                    </div>
                    <div className="text-sm">
                      <Badge variant="outline">
                        {formatGender(registrant.gender)}
                      </Badge>
                      <span className="ml-2">{formatAgeGroup(registrant.age_group)}</span>
                    </div>
                    <div className="text-sm">
                      <div>{registrant.province}</div>
                      {registrant.diocese && (
                        <div className="text-muted-foreground">{registrant.diocese}</div>
                      )}
                    </div>
                    <div className="text-sm">
                      <RoleBadgeCompact role={registrant.event_roles ? {
                        ...registrant.event_roles,
                        description: registrant.event_roles.description ?? null,
                        permissions: registrant.event_roles.permissions ?? null
                      } : null} />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAssignSingle(registrant)}
                    disabled={isAssigning}
                    size="sm"
                    className="ml-auto"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Phân đội
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages} ({totalCount} người)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AssignTeamDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        registrant={selectedRegistrant}
        onSuccess={handleAssignmentSuccess}
      />

      <BulkAssignmentDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedRegistrants={registrants.filter(r => selectedRegistrants.includes(r.id))}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
}
