"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const CreateTransportationGroupSchema = z.object({
  name: z.string().min(1, "Tên nhóm là bắt buộc"),
  departure_location: z.string().min(1, "Điểm khởi hành là bắt buộc"),
  departure_time: z.string().min(1, "Thời gian khởi hành là bắt buộc"),
  arrival_location: z.string().optional(),
  capacity: z.number().min(1, "Sức chứa phải lớn hơn 0"),
  vehicle_type: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof CreateTransportationGroupSchema>;

interface CreateTransportationGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTransportationGroupForm({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateTransportationGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(CreateTransportationGroupSchema),
    defaultValues: {
      capacity: 45,
      vehicle_type: "bus",
      arrival_location: "Địa điểm tổ chức Đại hội"
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/transportation-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transportation group');
      }

      toast.success('Tạo nhóm phương tiện thành công!');
      reset();
      onClose();
      onSuccess();
      
    } catch (error) {
      console.error('Create transportation group error:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo nhóm phương tiện');
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo nhóm phương tiện mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên nhóm *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="VD: Xe bus từ Tokyo"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="departure_location">Điểm khởi hành *</Label>
            <Input
              id="departure_location"
              {...register("departure_location")}
              placeholder="VD: Ga Tokyo"
            />
            {errors.departure_location && (
              <p className="text-sm text-destructive">{errors.departure_location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="departure_time">Thời gian khởi hành *</Label>
            <Input
              id="departure_time"
              type="datetime-local"
              {...register("departure_time")}
            />
            {errors.departure_time && (
              <p className="text-sm text-destructive">{errors.departure_time.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="arrival_location">Điểm đến</Label>
            <Input
              id="arrival_location"
              {...register("arrival_location")}
              placeholder="Địa điểm tổ chức Đại hội"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Sức chứa *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Loại phương tiện</Label>
              <select
                id="vehicle_type"
                {...register("vehicle_type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="bus">Xe bus</option>
                <option value="van">Xe van</option>
                <option value="train">Tàu hỏa</option>
                <option value="plane">Máy bay</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Người liên hệ</Label>
            <Input
              id="contact_person"
              {...register("contact_person")}
              placeholder="Tên người phụ trách"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Số điện thoại liên hệ</Label>
            <Input
              id="contact_phone"
              type="tel"
              {...register("contact_phone")}
              placeholder="VD: 080-1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Thông tin bổ sung (tùy chọn)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo nhóm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
