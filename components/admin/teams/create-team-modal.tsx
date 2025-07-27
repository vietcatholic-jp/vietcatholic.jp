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

const CreateTeamSchema = z.object({
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

type CreateTeamFormData = {
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

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      leader_id: "",
      sub_leader_id: "",
      capacity: "50",
    },
  });

  // Fetch active event and users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchActiveEvent();
      fetchUsers();
    }
  }, [isOpen]);

  const fetchActiveEvent = async () => {
    try {
      const response = await fetch("/api/admin/events");
      if (response.ok) {
        const data = await response.json();
        const activeEvent = data.events?.find((event: { is_active: boolean; id: string }) => event.is_active);
        setActiveEventId(activeEvent?.id || null);
      }
    } catch (error) {
      console.error("Error fetching active event:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const onSubmit = async (data: CreateTeamFormData) => {
    if (!activeEventId) {
      toast.error("Không tìm thấy sự kiện đang hoạt động");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          event_config_id: activeEventId,
          leader_id: data.leader_id === "none" ? null : data.leader_id || null,
          sub_leader_id: data.sub_leader_id === "none" ? null : data.sub_leader_id || null,
          capacity: data.capacity && data.capacity !== "" ? parseInt(data.capacity, 10) : 50,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể tạo đội");
      }

      toast.success("Tạo đội thành công!");
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo đội mới</DialogTitle>
          <DialogDescription>
            Tạo một đội mới cho sự kiện. Điền thông tin cơ bản và chọn trưởng nhóm nếu có.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên đội *</Label>
            <Input
              id="name"
              placeholder="Nhập tên đội..."
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả về đội (tùy chọn)..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leader_id">Trưởng nhóm</Label>
            <Select onValueChange={(value) => setValue("leader_id", value)} value={watch("leader_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trưởng nhóm (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không chọn</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leader_id && (
              <p className="text-sm text-red-500">{errors.leader_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub_leader_id">Phó nhóm</Label>
            <Select onValueChange={(value) => setValue("sub_leader_id", value)} value={watch("sub_leader_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn phó nhóm (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không chọn</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sub_leader_id && (
              <p className="text-sm text-red-500">{errors.sub_leader_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Sức chứa tối đa</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              placeholder="50"
              {...register("capacity")}
            />
            <p className="text-sm text-muted-foreground">
              Số lượng thành viên tối đa trong đội. Mặc định là 50 người.
            </p>
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !activeEventId}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo đội
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
