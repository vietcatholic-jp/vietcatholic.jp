"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, UserMinus, Search } from "lucide-react";
import { toast } from "sonner";

// Age group mapping function
const formatAgeGroup = (ageGroup: string): string => {
  const ageGroupMap: Record<string, string> = {
    under_12: "Dưới 12 tuổi",
    "12_17": "12-17 tuổi",
    "18_25": "18-25 tuổi",
    "26_35": "26-35 tuổi",
    "36_45": "36-45 tuổi",
    "46_55": "46-55 tuổi",
    "56_65": "56-65 tuổi",
    over_65: "Trên 65 tuổi"
  };
  return ageGroupMap[ageGroup] || ageGroup;
};

// Format Facebook URL for display
const formatFacebookUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove protocol and www for cleaner display
    let displayUrl = urlObj.hostname + urlObj.pathname;
    if (displayUrl.startsWith('www.')) {
      displayUrl = displayUrl.substring(4);
    }
    // Truncate if too long
    if (displayUrl.length > 30) {
      displayUrl = displayUrl.substring(0, 27) + '...';
    }
    return displayUrl;
  } catch {
    // If URL is invalid, just truncate the original
    return url.length > 30 ? url.substring(0, 27) + '...' : url;
  }
};

interface Team {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  member_count: number;
}

interface TeamMember {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese: string;
  email?: string;
  phone?: string;
  facebook_link?: string;
  registration: {
    id: string;
    invoice_code?: string;
    user: {
      full_name: string;
      email: string;
    };
  };
}

interface UnassignedRegistrant {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese: string;
  email?: string;
  phone?: string;
}

interface ManageTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => void; // New callback for data changes without closing dialog
  team: Team | null;
}

export function ManageTeamMembersModal({ isOpen, onClose, onDataChange, team }: ManageTeamMembersModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [unassignedRegistrants, setUnassignedRegistrants] = useState<UnassignedRegistrant[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [selectedRegistrantId, setSelectedRegistrantId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<TeamMember | null>(null);
  const [confirmAddMember, setConfirmAddMember] = useState<UnassignedRegistrant | null>(null);

  // Fetch team members when modal opens
  useEffect(() => {
    if (isOpen && team) {
      fetchTeamMembers();
      fetchUnassignedRegistrants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, team]);

  const fetchTeamMembers = async () => {
    if (!team) return;

    setIsLoadingMembers(true);
    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Không thể tải danh sách thành viên");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchUnassignedRegistrants = async () => {
    setIsLoadingUnassigned(true);
    try {
      const response = await fetch(`/api/admin/registrants/unassigned?limit=100&search=${searchTerm}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unassigned registrants");
      }
      const data = await response.json();
      setUnassignedRegistrants(data.data || []);
    } catch (error) {
      console.error("Error fetching unassigned registrants:", error);
      toast.error("Không thể tải danh sách người chưa phân đội");
    } finally {
      setIsLoadingUnassigned(false);
    }
  };

  const handleAddMember = () => {
    if (!selectedRegistrantId || !team) return;

    // Check capacity limit
    if (team.capacity && members.length >= team.capacity) {
      toast.error(`Đội đã đầy! Sức chứa tối đa: ${team.capacity} người`);
      return;
    }

    const selectedRegistrant = unassignedRegistrants.find(r => r.id === selectedRegistrantId);
    if (selectedRegistrant) {
      setConfirmAddMember(selectedRegistrant);
    }
  };

  const confirmAddMemberAction = async () => {
    if (!team || !selectedRegistrantId || !confirmAddMember) return;

    setIsAddingMember(true);

    // Optimistic update: Add member to UI immediately
    const newMember: TeamMember = {
      id: confirmAddMember.id,
      full_name: confirmAddMember.full_name,
      gender: confirmAddMember.gender,
      age_group: confirmAddMember.age_group,
      province: confirmAddMember.province,
      diocese: confirmAddMember.diocese,
      email: confirmAddMember.email,
      phone: confirmAddMember.phone,
      facebook_link: undefined,
      registration: {
        id: `temp-${confirmAddMember.id}`,
        user: {
          full_name: confirmAddMember.full_name,
          email: confirmAddMember.email || "",
        },
      },
    };

    // Update UI optimistically
    const previousMembers = [...members];
    const previousUnassigned = [...unassignedRegistrants];
    setMembers(prev => [...prev, newMember]);
    setUnassignedRegistrants(prev => prev.filter(r => r.id !== selectedRegistrantId));
    setSelectedRegistrantId("");
    setConfirmAddMember(null);

    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrant_ids: [selectedRegistrantId],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể thêm thành viên");
      }

      // Success: Refresh data to get accurate information
      await Promise.all([fetchTeamMembers(), fetchUnassignedRegistrants()]);
      toast.success("Thêm thành viên thành công!");

      // Notify parent component about data change without closing dialog
      onDataChange?.();
    } catch (error) {
      console.error("Error adding member:", error);

      // Rollback optimistic update
      setMembers(previousMembers);
      setUnassignedRegistrants(previousUnassigned);
      setSelectedRegistrantId(selectedRegistrantId);

      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    setConfirmRemoveMember(member);
  };

  const confirmRemoveMemberAction = async () => {
    if (!team || !confirmRemoveMember) return;

    setIsRemovingMember(confirmRemoveMember.id);

    // Optimistic update: Remove member from UI immediately
    const memberToRemove = confirmRemoveMember;
    const previousMembers = [...members];
    const previousUnassigned = [...unassignedRegistrants];

    // Create unassigned registrant object from removed member
    const newUnassignedRegistrant: UnassignedRegistrant = {
      id: memberToRemove.id,
      full_name: memberToRemove.full_name,
      gender: memberToRemove.gender,
      age_group: memberToRemove.age_group,
      province: memberToRemove.province,
      diocese: memberToRemove.diocese,
      email: memberToRemove.email,
      phone: memberToRemove.phone,
    };

    // Update UI optimistically
    setMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
    setUnassignedRegistrants(prev => [newUnassignedRegistrant, ...prev]);
    setConfirmRemoveMember(null);

    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members?registrant_id=${memberToRemove.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể xóa thành viên");
      }

      // Success: Refresh data to get accurate information
      await Promise.all([fetchTeamMembers(), fetchUnassignedRegistrants()]);
      toast.success("Xóa thành viên thành công!");

      // Notify parent component about data change without closing dialog
      onDataChange?.();
    } catch (error) {
      console.error("Error removing member:", error);

      // Rollback optimistic update
      setMembers(previousMembers);
      setUnassignedRegistrants(previousUnassigned);
      setConfirmRemoveMember(memberToRemove);

      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsRemovingMember(null);
    }
  };

  const handleClose = () => {
    setMembers([]);
    setUnassignedRegistrants([]);
    setSelectedRegistrantId("");
    setSearchTerm("");
    setConfirmRemoveMember(null);
    setConfirmAddMember(null);
    onClose();
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Debounce search
    setTimeout(() => {
      fetchUnassignedRegistrants();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Quản lý thành viên đội</DialogTitle>
          <DialogDescription>
            Quản lý thành viên của đội &quot;{team?.name}&quot;. Thêm hoặc xóa thành viên khỏi đội.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Capacity Warning */}
          {team?.capacity && (
            <div className={`p-3 rounded-lg border ${
              members.length >= team.capacity
                ? 'bg-red-50 border-red-200 text-red-800'
                : members.length / team.capacity > 0.8
                ? 'bg-orange-50 border-orange-200 text-orange-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Sức chứa: {members.length}/{team.capacity} người
                </span>
                {members.length >= team.capacity && (
                  <Badge variant="destructive" className="text-xs">Đầy</Badge>
                )}
                {members.length / team.capacity > 0.8 && members.length < team.capacity && (
                  <Badge variant="destructive" className="text-xs">Gần đầy</Badge>
                )}
              </div>
              {members.length >= team.capacity && (
                <p className="text-sm mt-1">Đội đã đạt sức chứa tối đa. Không thể thêm thành viên mới.</p>
              )}
              {members.length / team.capacity > 0.8 && members.length < team.capacity && (
                <p className="text-sm mt-1">Đội sắp đầy. Còn {team.capacity - members.length} chỗ trống.</p>
              )}
            </div>
          )}

          {/* Current Members Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Thành viên hiện tại</h3>
              <Badge variant="secondary" className="text-xs">{members.length} người</Badge>
            </div>
            
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Đang tải...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Đội chưa có thành viên nào
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{member.full_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{member.gender === "male" ? "Nam" : "Nữ"}</span>
                        <span>•</span>
                        <span>{formatAgeGroup(member.age_group)}</span>
                        <span>•</span>
                        <span>{member.province}</span>
                      </div>
                      {member.registration.invoice_code && (
                        <div className="text-xs text-blue-600 font-mono">
                          {member.registration.invoice_code}
                        </div>
                      )}
                      {member.facebook_link && (
                        <div className="text-xs text-blue-600 truncate">
                          <a href={member.facebook_link} target="_blank" rel="noopener noreferrer" className="hover:underline" title={member.facebook_link}>
                            {formatFacebookUrl(member.facebook_link)}
                          </a>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member)}
                      disabled={isRemovingMember === member.id}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0 ml-2"
                    >
                      {isRemovingMember === member.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserMinus className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Member Section */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-base font-semibold">Thêm thành viên mới</h3>

            {/* Search Input */}
            <div className="space-y-2">
              <Label className="text-sm">Tìm kiếm người chưa phân đội</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên để tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            {/* Select Registrant */}
            <div className="space-y-2">
              <Label className="text-sm">Chọn người tham dự</Label>
              <Select
                value={selectedRegistrantId}
                onValueChange={setSelectedRegistrantId}
                disabled={isLoadingUnassigned}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn người tham dự..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUnassigned ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang tải...
                    </div>
                  ) : unassignedRegistrants.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Không có người nào chưa phân đội
                    </div>
                  ) : (
                    unassignedRegistrants.map((registrant) => (
                      <SelectItem key={registrant.id} value={registrant.id}>
                        <div className="flex flex-col">
                          <span className="text-sm">{registrant.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {registrant.gender === "male" ? "Nam" : "Nữ"} • {formatAgeGroup(registrant.age_group)} • {registrant.province}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddMember}
              disabled={
                !selectedRegistrantId ||
                isAddingMember ||
                Boolean(team?.capacity && members.length >= team.capacity)
              }
              className="w-full h-9"
              size="sm"
            >
              {isAddingMember ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  <span className="text-sm">Đang thêm...</span>
                </>
              ) : team?.capacity && members.length >= team.capacity ? (
                <>
                  <UserPlus className="mr-2 h-3 w-3" />
                  <span className="text-sm">Đội đã đầy</span>
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-3 w-3" />
                  <span className="text-sm">Thêm thành viên</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button variant="outline" onClick={handleClose} size="sm" className="h-9">
            Đóng
          </Button>
        </div>
      </DialogContent>

      {/* Confirm Remove Member Dialog */}
      <Dialog open={!!confirmRemoveMember} onOpenChange={() => setConfirmRemoveMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa thành viên</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{confirmRemoveMember?.full_name}</strong> khỏi đội này?
              Thành viên sẽ trở về danh sách chưa phân đội.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmRemoveMember(null)}>
              Hủy
            </Button>
            <Button
              onClick={confirmRemoveMemberAction}
              disabled={!!isRemovingMember}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemovingMember ? "Đang xóa..." : "Xóa thành viên"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Add Member Dialog */}
      <Dialog open={!!confirmAddMember} onOpenChange={() => setConfirmAddMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thêm thành viên</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn thêm <strong>{confirmAddMember?.full_name}</strong> vào đội này?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmAddMember(null)}>
              Hủy
            </Button>
            <Button
              onClick={confirmAddMemberAction}
              disabled={isAddingMember}
            >
              {isAddingMember ? "Đang thêm..." : "Thêm thành viên"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
