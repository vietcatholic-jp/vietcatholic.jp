"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Calendar,
  DollarSign,
  Save,
  Loader2,
  Plus,
  Edit2,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EventConfig, UserRole } from "@/lib/types";
import { EventRoleManager } from "@/components/admin/event-role-manager";

interface EventConfigManagerProps {
  currentUserRole: UserRole;
}

export function EventConfigManager({ currentUserRole }: EventConfigManagerProps) {
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'roles'>('events');

  // Only super_admin can manage event configs
  const canManageEvents = currentUserRole === 'super_admin';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Không thể tải danh sách sự kiện');
    } finally {
      setIsLoading(false);
    }
  };

  const activeEvent = events.find(e => e.is_active);

  // Tab navigation
  const handleTabChange = (tab: 'events' | 'roles') => {
    setActiveTab(tab);
  };

  const handleCreateEvent = () => {
    setEditingEvent({
      id: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      base_price: 0,
      is_active: false,
      created_at: '',
      updated_at: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: EventConfig) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;

    setIsSaving(true);
    try {
      const method = editingEvent.id ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/events', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      const savedEvent = await response.json();

      if (editingEvent.id) {
        // Update existing event
        setEvents(prev => prev.map(event => 
          event.id === editingEvent.id ? savedEvent.event : event
        ));
        toast.success('Cập nhật sự kiện thành công');
      } else {
        // Add new event
        setEvents(prev => [...prev, savedEvent.event]);
        toast.success('Tạo sự kiện mới thành công');
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Không thể lưu thông tin sự kiện');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/events', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Xóa sự kiện thành công');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Không thể xóa sự kiện');
    }
  };

  const toggleEventStatus = async (eventId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, is_active: isActive } : event
      ));

      toast.success(`Sự kiện đã được ${isActive ? 'kích hoạt' : 'tạm dừng'}`);
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Không thể cập nhật trạng thái sự kiện');
    }
  };

  if (!canManageEvents) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Chỉ Quản trị viên mới có thể quản lý cấu hình sự kiện
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quản lý cấu hình sự kiện
          </CardTitle>
          <Button onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo sự kiện mới
          </Button>
        </div>

        {/* Tab navigation */}
        <div className="mt-4">
          <Button
            variant={activeTab === 'events' ? 'default' : 'outline'}
            onClick={() => handleTabChange('events')}
            className="mr-2"
          >
            Quản lý sự kiện
          </Button>
          <Button
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => handleTabChange('roles')}
          >
            Quản lý vai trò
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'events' ? (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className={`border ${event.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>
                            {event.start_date 
                              ? new Date(event.start_date).toLocaleDateString('vi-VN')
                              : 'Chưa xác định'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-500" />
                          <span>
                            {event.end_date 
                              ? new Date(event.end_date).toLocaleDateString('vi-VN')
                              : 'Chưa xác định'
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span>¥{event.base_price.toLocaleString()}</span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Cập nhật: {new Date(event.updated_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant={event.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleEventStatus(event.id, !event.is_active)}
                      >
                        {event.is_active ? 'Tạm dừng' : 'Kích hoạt'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có sự kiện nào được tạo
              </div>
            )}
          </div>
        ) : (
          <EventRoleManager eventConfig={activeEvent || null} />
        )}

        {/* Edit/Create Event Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEvent?.id ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
              </DialogTitle>
              <DialogDescription>
                Cập nhật thông tin cấu hình cho sự kiện
              </DialogDescription>
            </DialogHeader>
            
            {editingEvent && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên sự kiện *</Label>
                  <Input
                    id="name"
                    value={editingEvent.name}
                    onChange={(e) => setEditingEvent(prev => 
                      prev ? {...prev, name: e.target.value} : null
                    )}
                    placeholder="Nhập tên sự kiện"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={editingEvent.description || ''}
                    onChange={(e) => setEditingEvent(prev => 
                      prev ? {...prev, description: e.target.value} : null
                    )}
                    placeholder="Nhập mô tả sự kiện"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Ngày bắt đầu</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={editingEvent.start_date ? 
                        new Date(editingEvent.start_date).toISOString().slice(0, 16) : ''
                      }
                      onChange={(e) => setEditingEvent(prev => 
                        prev ? {...prev, start_date: e.target.value} : null
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">Ngày kết thúc</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={editingEvent.end_date ? 
                        new Date(editingEvent.end_date).toISOString().slice(0, 16) : ''
                      }
                      onChange={(e) => setEditingEvent(prev => 
                        prev ? {...prev, end_date: e.target.value} : null
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="base_price">Giá cơ bản (¥)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min="0"
                    step="100"
                    value={editingEvent.base_price}
                    onChange={(e) => setEditingEvent(prev => 
                      prev ? {...prev, base_price: parseFloat(e.target.value) || 0} : null
                    )}
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSaveEvent}
                    disabled={isSaving || !editingEvent.name}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
