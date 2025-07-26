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

interface Team {
  id: string;
  name: string;
  description?: string;
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
  registration: {
    id: string;
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
  onSuccess: () => void;
  team: Team | null;
}

export function ManageTeamMembersModal({ isOpen, onClose, onSuccess, team }: ManageTeamMembersModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [unassignedRegistrants, setUnassignedRegistrants] = useState<UnassignedRegistrant[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [selectedRegistrantId, setSelectedRegistrantId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleAddMember = async () => {
    if (!team || !selectedRegistrantId) return;

    setIsAddingMember(true);
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

      toast.success("Thêm thành viên thành công!");
      setSelectedRegistrantId("");
      fetchTeamMembers();
      fetchUnassignedRegistrants();
      onSuccess();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;

    setIsRemovingMember(memberId);
    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members?registrant_id=${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể xóa thành viên");
      }

      toast.success("Xóa thành viên thành công!");
      fetchTeamMembers();
      fetchUnassignedRegistrants();
      onSuccess();
    } catch (error) {
      console.error("Error removing member:", error);
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý thành viên đội</DialogTitle>
          <DialogDescription>
            Quản lý thành viên của đội &quot;{team?.name}&quot;. Thêm hoặc xóa thành viên khỏi đội.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Thành viên hiện tại</h3>
              <Badge variant="secondary">{members.length} người</Badge>
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
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.gender} • {member.age_group} • {member.province}
                      </div>
                      {member.email && (
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isRemovingMember === member.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isRemovingMember === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Member Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Thêm thành viên mới</h3>
            
            {/* Search Input */}
            <div className="space-y-2">
              <Label>Tìm kiếm người chưa phân đội</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên để tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Select Registrant */}
            <div className="space-y-2">
              <Label>Chọn người tham dự</Label>
              <Select
                value={selectedRegistrantId}
                onValueChange={setSelectedRegistrantId}
                disabled={isLoadingUnassigned}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người tham dự..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUnassigned ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang tải...
                    </div>
                  ) : unassignedRegistrants.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Không có người nào chưa phân đội
                    </div>
                  ) : (
                    unassignedRegistrants.map((registrant) => (
                      <SelectItem key={registrant.id} value={registrant.id}>
                        <div className="flex flex-col">
                          <span>{registrant.full_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {registrant.gender} • {registrant.age_group} • {registrant.province}
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
              disabled={!selectedRegistrantId || isAddingMember}
              className="w-full"
            >
              {isAddingMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Thêm thành viên
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
