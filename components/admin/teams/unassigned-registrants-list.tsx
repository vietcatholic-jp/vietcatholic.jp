"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  UserPlus,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { AssignTeamDialog } from "./assign-team-dialog";
import { BulkAssignmentDialog } from "./bulk-assignment-dialog";
import { useTeamAssignment } from "@/hooks/use-team-assignment";
import { toast } from "sonner";
import { formatAgeGroup, formatGender } from "@/lib/utils";
import { RoleBadgeCompact } from "@/components/ui/role-badge";
import { RoleHelp } from "@/components/admin/role-help";
import { EventRole } from "@/lib/role-utils";
import { RegistrantListSkeleton } from "./team-skeleton";

interface Registrant {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese?: string;
  email?: string;
  phone?: string;
  notes?: string;
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

interface FilterOptions {
  provinces: { value: string; label: string }[];
  dioceses: { value: string; label: string }[];
  roles: { value: string; label: string; description?: string }[];
}

export function UnassignedRegistrantsList() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [dioceseFilter, setDioceseFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedRegistrants, setSelectedRegistrants] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    provinces: [],
    dioceses: [],
    roles: []
  });
  const [filterKey, setFilterKey] = useState(0);

  const { isLoading: isAssigning } = useTeamAssignment();

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/filter-options");
      if (!response.ok) {
        throw new Error("Failed to fetch filter options");
      }
      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  // Memoize expensive grouping calculation
  const groupedRegistrants = useMemo(() => {
    return registrants.reduce((acc, registrant) => {
      const code = registrant.registration?.invoice_code || 'N/A';
      if (!acc[code]) {
        acc[code] = [];
      }
      acc[code].push(registrant);
      return acc;
    }, {} as Record<string, Registrant[]>);
  }, [registrants]);

  const fetchRegistrants = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
        search: searchTerm,
        gender: genderFilter,
        age_group: ageGroupFilter,
        province: provinceFilter,
        diocese: dioceseFilter,
        role_id: roleFilter,
      });

      const response = await fetch(`/api/admin/registrants/unassigned?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch registrants");
      }

      const data = await response.json();

      // Sort registrants by registration code to group them together
      const sortedRegistrants = (data.data || []).sort((a: Registrant, b: Registrant) => {
        const codeA = a.registration?.invoice_code || '';
        const codeB = b.registration?.invoice_code || '';
        return codeA.localeCompare(codeB);
      });

      setRegistrants(sortedRegistrants);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching registrants:", error);
      toast.error("Không thể tải danh sách người tham dự");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, genderFilter, ageGroupFilter, provinceFilter, dioceseFilter, roleFilter]);

  // Effect for initial load and fetch filter options
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Effect for non-search filters (immediate fetch)
  useEffect(() => {
    fetchRegistrants();
  }, [currentPage, genderFilter, ageGroupFilter, provinceFilter, dioceseFilter, roleFilter, fetchRegistrants]);

  // Effect for search term (debounced fetch) - separate to avoid duplicate calls
  useEffect(() => {
    if (searchTerm === "") {
      // If search is cleared, fetch immediately
      fetchRegistrants();
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchRegistrants();
    }, 500); // 500ms delay for search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchRegistrants]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // Force immediate search on form submit
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
                  placeholder="Tìm kiếm theo tên hoặc mã đăng ký..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
              <Select key={`gender-${filterKey}`} value={genderFilter || ""} onValueChange={(value) => setGenderFilter(value === "all" ? "" : value || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả giới tính</SelectItem>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                </SelectContent>
              </Select>

              <Select key={`age-${filterKey}`} value={ageGroupFilter || ""} onValueChange={(value) => setAgeGroupFilter(value === "all" ? "" : value || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả độ tuổi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả độ tuổi</SelectItem>
                  <SelectItem value="under_12">Dưới 12 tuổi</SelectItem>
                  <SelectItem value="12_17">12-17 tuổi</SelectItem>
                  <SelectItem value="18_25">18-25 tuổi</SelectItem>
                  <SelectItem value="26_35">26-35 tuổi</SelectItem>
                  <SelectItem value="36_50">36-50 tuổi</SelectItem>
                  <SelectItem value="over_50">Trên 50 tuổi</SelectItem>
                </SelectContent>
              </Select>

              <Select key={`province-${filterKey}`} value={provinceFilter || ""} onValueChange={(value) => setProvinceFilter(value === "all" ? "" : value || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tỉnh/Thành phố" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tỉnh/thành phố</SelectItem>
                  {filterOptions.provinces.map((province) => (
                    <SelectItem key={province.value} value={province.value}>
                      {province.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select key={`role-${filterKey}`} value={roleFilter || ""} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {filterOptions.roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select key={`diocese-${filterKey}`} value={dioceseFilter || ""} onValueChange={(value) => setDioceseFilter(value === "all" ? "" : value || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Giáo phận" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả giáo phận</SelectItem>
                  {filterOptions.dioceses.map((diocese) => (
                    <SelectItem key={diocese.value} value={diocese.value}>
                      {diocese.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setGenderFilter("");
                  setAgeGroupFilter("");
                  setProvinceFilter("");
                  setRoleFilter("");
                  setDioceseFilter("");
                  setSearchTerm("");
                  setCurrentPage(1);
                  setFilterKey(prev => prev + 1);
                }}
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
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
            <RegistrantListSkeleton />
          ) : registrants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có người tham dự nào chưa được phân đội
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedRegistrants).map(([code, groupRegistrants]) => (
                  <div key={code} className="space-y-2">
                    {/* Group Header */}
                    {groupRegistrants.length > 1 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          📋 Đăng ký #{code} ({groupRegistrants.length} người)
                        </div>
                      </div>
                    )}

                    {/* Group Members */}
                    {groupRegistrants.map((registrant) => (
                      <div
                        key={registrant.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 ${
                          groupRegistrants.length > 1 ? 'ml-4 border-l-4 border-l-blue-300' : ''
                        }`}
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
                      {registrant.notes && (
                        <div className="text-xs text-blue-600 mt-1 italic">
                          💬 {registrant.notes}
                        </div>
                      )}
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
