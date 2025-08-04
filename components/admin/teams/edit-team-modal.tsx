"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EventTeamWithDetails } from "@/lib/types";

const EditTeamSchema = z.object({
  name: z.string().min(1, "Tên đội là bắt buộc"),
  description: z.string().optional(),
  leader_id: z.string().optional(),
  sub_leader_id: z.string().optional(),
  capacity: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const num = parseInt(val, 10);
    return !isNaN(num) && num > 0;
  }, {
    message: "Sức chứa phải là số nguyên dương"
  }),
});

type EditTeamFormData = {
  name: string;
  description?: string;
  leader_id?: string;
  sub_leader_id?: string;
  capacity?: string;
};

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: (updatedTeam: EventTeamWithDetails) => void; // Pass updated team data
  team: EventTeamWithDetails | null;
}

export function EditTeamModal({ isOpen, onClose, onDataChange, team }: EditTeamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const form = useForm<EditTeamFormData>({
    resolver: zodResolver(EditTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      leader_id: "",
      sub_leader_id: "",
      capacity: "",
    },
  });

  // Reset form when team changes
  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        description: team.description || "",
        leader_id: team.leader?.id || "",
        sub_leader_id: team.sub_leader?.id || "",
        capacity: team.capacity ? team.capacity.toString() : "",
      });
    }
  }, [team, form]);

  // Fetch users for leader/sub-leader selection
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const onSubmit = async (data: EditTeamFormData) => {
    if (!team) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: team.id,
          ...data,
          leader_id: data.leader_id === "none" ? null : data.leader_id || null,
          sub_leader_id: data.sub_leader_id === "none" ? null : data.sub_leader_id || null,
          capacity: data.capacity && data.capacity !== "" ? parseInt(data.capacity, 10) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể cập nhật đội");
      }

      const result = await response.json();
      toast.success("Cập nhật đội thành công!");

      // Pass updated team data to parent component
      onDataChange?.(result.team || { ...team, ...data });

      // Note: Removed onSuccess() and onClose() calls to keep dialog open
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sửa thông tin đội</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin đội và phân công trưởng nhóm, phó nhóm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên đội *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Nhập tên đội..."
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Mô tả về đội..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Leader Selection */}
          <div className="space-y-2">
            <Label>Trưởng nhóm</Label>
            <Select
              value={form.watch("leader_id")}
              onValueChange={(value) => form.setValue("leader_id", value)}
              disabled={isSubmitting || isLoadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trưởng nhóm..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub Leader Selection */}
          <div className="space-y-2">
            <Label>Phó nhóm</Label>
            <Select
              value={form.watch("sub_leader_id")}
              onValueChange={(value) => form.setValue("sub_leader_id", value)}
              disabled={isSubmitting || isLoadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phó nhóm..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Sức chứa tối đa</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              placeholder="Để trống nếu không giới hạn"
              {...form.register("capacity")}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              Số lượng thành viên tối đa trong đội. Để trống nếu không giới hạn.
            </p>
            {form.formState.errors.capacity && (
              <p className="text-sm text-red-600">{form.formState.errors.capacity.message}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật đội"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
