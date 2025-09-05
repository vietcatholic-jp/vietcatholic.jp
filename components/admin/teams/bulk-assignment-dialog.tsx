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
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { formatAgeGroup, formatGender } from "@/lib/utils";

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
}

interface BulkAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRegistrants: Registrant[];
  onSuccess: () => void;
}


interface BulkAssignResult {
  success: string[];
  failed: Array<{
    registrant_id: string;
    registrant_name: string;
    reason: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    team_name: string;
  };
}
interface BulkAssignResult {
  success: string[];
  failed: Array<{
    registrant_id: string;
    registrant_name: string;
    reason: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    team_name: string;
  };
}

export function BulkAssignmentDialog({
  open,
  onOpenChange,
  selectedRegistrants,
  onSuccess,
}: BulkAssignmentDialogProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<BulkAssignResult | null>(null);

  useEffect(() => {
    if (open) {
      fetchTeams();
      setSelectedTeamId("");
      setNotes("");
      setShowResult(false);
      setResult(null);
    }
  }, [open]);

  const fetchTeams = async () => {
    // ...existing code...
    try {
      const response = await fetch("/api/admin/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      // ...existing code...
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || selectedRegistrants.length === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/registrants/bulk-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrant_ids: selectedRegistrants.map((r: Registrant) => r.id),
          team_id: selectedTeamId,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to bulk assign");
      }

      setResult(data);
      setShowResult(true);

      if (data.failed.length === 0) {
        toast.success(`Đã phân đội thành công ${data.success.length} người!`);
      } else {
        toast.warning(`Phân đội thành công ${data.success.length}/${selectedRegistrants.length} người`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Lỗi phân đội hàng loạt: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (showResult && result && result.success && result.success.length > 0) {
      onSuccess();
    }
    onOpenChange(false);
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Phân đội hàng loạt
          </DialogTitle>
          <DialogDescription>
            Phân {selectedRegistrants.length} người vào cùng một đội
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Registrants List */}
            <div className="space-y-2">
              <Label>Danh sách người được chọn ({selectedRegistrants.length})</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                <div className="space-y-2">
                  {selectedRegistrants.map((registrant: Registrant) => (
                    <div key={registrant.id} className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3" />
                      <span className="font-medium">{registrant.full_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatGender(registrant.gender)}
                      </Badge>
                      <span className="text-muted-foreground">{formatAgeGroup(registrant.age_group)}</span>
                    </div>
                  ))}
                </div>
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

            {/* Team Info & Capacity Warning */}
            {selectedTeam && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <div className="font-medium text-blue-900">{selectedTeam.name}</div>
                  {selectedTeam.description && (
                    <div className="text-blue-700 mt-1">Mô tả: {selectedTeam.description}</div>
                  )}
                  <div className="text-blue-700 mt-1">
                    Hiện tại: {selectedTeam.member_count}/{selectedTeam.capacity || '∞'} thành viên
                  </div>
                </div>

                {selectedTeam.capacity && 
                 (selectedTeam.member_count + selectedRegistrants.length > selectedTeam.capacity) && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Cảnh báo về sức chứa</span>
                    </div>
                    <div className="text-orange-700 text-sm mt-1">
                      Đội này sẽ vượt quá sức chứa sau khi phân đội ({selectedTeam.member_count + selectedRegistrants.length}/{selectedTeam.capacity})
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú về việc phân đội hàng loạt..."
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
                disabled={isProcessing}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!selectedTeamId || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Phân đội ${selectedRegistrants.length} người`
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Results Display */
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-semibold">Kết quả phân đội</div>
              <div className="text-sm text-muted-foreground">
                {result && result.summary ? `${result.summary.successful}/${result.summary.total}` : ''} người được phân đội thành công
              </div>
            </div>

            <Progress 
              value={result && result.summary ? (result.summary.successful / result.summary.total) * 100 : 0} 
              className="w-full"
            />

            {result && result.success && result.success.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Thành công ({result && result.success ? result.success.length : 0})
                </div>
                <div className="text-green-700 text-sm mt-1">
                  Đã phân đội thành công vào {result && result.summary ? result.summary.team_name : ''}
                </div>
              </div>
            )}

            {result && result.failed && result.failed.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-medium">
                  <XCircle className="h-4 w-4" />
                  Thất bại ({result.failed.length})
                </div>
                <div className="space-y-1 mt-2">
                  {result && result.failed && result.failed.map((failure: BulkAssignResult['failed'][number], index: number) => {
                    return (
                      <div key={index} className="text-red-700 text-sm">
                        • {failure.registrant_name}: {failure.reason}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>
                Đóng
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
