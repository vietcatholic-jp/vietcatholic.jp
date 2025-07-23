import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface TeamAssignmentResult {
  success: boolean;
  message: string;
  data?: any;
}

export function useTeamAssignment() {
  const [isLoading, setIsLoading] = useState(false);

  const assignToTeam = useCallback(async (
    registrantId: string,
    teamId: string,
    notes?: string
  ): Promise<TeamAssignmentResult> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/registrants/${registrantId}/assign-team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team_id: teamId, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign team");
      }

      toast.success("Đã phân đội thành công!");
      return { success: true, message: "Assigned successfully", data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Lỗi phân đội: ${message}`);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkAssignToTeam = useCallback(async (
    registrantIds: string[],
    teamId: string,
    notes?: string
  ): Promise<TeamAssignmentResult> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/registrants/bulk-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrant_ids: registrantIds,
          team_id: teamId,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to bulk assign");
      }

      const { success, failed } = data;
      if (failed.length > 0) {
        toast.warning(`Phân đội thành công ${success.length}/${registrantIds.length} người`);
      } else {
        toast.success(`Đã phân đội thành công ${success.length} người!`);
      }

      return { success: true, message: "Bulk assignment completed", data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Lỗi phân đội hàng loạt: ${message}`);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFromTeam = useCallback(async (
    registrantId: string
  ): Promise<TeamAssignmentResult> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/registrants/${registrantId}/remove-team`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove from team");
      }

      toast.success("Đã loại khỏi đội thành công!");
      return { success: true, message: "Removed successfully", data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Lỗi loại khỏi đội: ${message}`);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    assignToTeam,
    bulkAssignToTeam,
    removeFromTeam,
  };
}
