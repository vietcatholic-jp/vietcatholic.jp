"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, User } from "lucide-react";
import { useTeamAssignment } from "@/hooks/use-team-assignment";
import { formatAgeGroup, formatGender } from "@/lib/utils";
import { RoleBadgeCompact } from "@/components/ui/role-badge";
import { EventRole } from "@/lib/role-utils";

interface Team {
  id: string;
  name: string;
  capacity?: number;
  member_count: number;
  description?: string;
}

interface Registrant {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese?: string;
  event_roles?: EventRole | null;
  registration: {
    invoice_code: string;
  };
}

interface AssignTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrant: Registrant | null;
  onSuccess: () => void;
}

export function AssignTeamDialog({
  open,
  onOpenChange,
  registrant,
  onSuccess,
}: AssignTeamDialogProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { assignToTeam, isLoading } = useTeamAssignment();

  useEffect(() => {
    if (open) {
      fetchTeams();
      setSelectedTeamId("");
      setNotes("");
    }
  }, [open]);

  const fetchTeams = async () => {
    // ...existing code...
    try {
      const response = await fetch("/api/admin/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      // ...existing code...
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrant || !selectedTeamId) return;

    const result = await assignToTeam(registrant.id, selectedTeamId, notes);
    if (result.success) {
      onSuccess();
    }
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Phân đội cho {registrant?.full_name}
          </DialogTitle>
          <DialogDescription>
            Chọn đội phù hợp cho người tham dự này
          </DialogDescription>
        </DialogHeader>

        {registrant && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registrant Info */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Thông tin người tham dự</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tên:</span>
                  <div className="font-medium">{registrant.full_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Mã đăng ký:</span>
                  <div className="font-medium">#{registrant.registration.invoice_code}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Giới tính:</span>
                  <Badge variant="outline">{formatGender(registrant.gender)}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Độ tuổi:</span>
                  <span className="font-medium">{formatAgeGroup(registrant.age_group)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vai trò:</span>
                  <RoleBadgeCompact role={registrant.event_roles ? { 
                    ...registrant.event_roles, 
                    description: registrant.event_roles.description || null,
                    permissions: registrant.event_roles.permissions || null
                  } : null} />
                </div>
                <div>
                  <span className="text-muted-foreground">Tỉnh/Thành phố:</span>
                  <div className="font-medium">{registrant.province}</div>
                </div>
                {registrant.diocese && (
                  <div>
                    <span className="text-muted-foreground">Giáo phận:</span>
                    <div className="font-medium">{registrant.diocese}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Selection */}
            <div className="space-y-2">
              <Label htmlFor="team">Chọn đội *</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đội..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.member_count}/{team.capacity || '∞'} người)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Info */}
            {selectedTeam && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium text-blue-900">{selectedTeam.name}</div>
                {selectedTeam.description && (
                  <div className="text-blue-700 mt-1">Mô tả: {selectedTeam.description}</div>
                )}
                <div className="text-blue-700 mt-1">
                  Hiện tại: {selectedTeam.member_count}/{selectedTeam.capacity || '∞'} thành viên
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú về việc phân đội..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!selectedTeamId || isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Xác nhận phân đội"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
