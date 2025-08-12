"use client";

import { useState, useEffect, useCallback } from "react";
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
  Trash2,
  Clock,
  MapPin
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

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  venue?: string;
  session_type?: string;
  speaker?: string;
  max_participants?: number | null;
  notes?: string;
  event_config_id?: string;
}
import { EventRoleManager } from "@/components/admin/event-role-manager";
import { EventTeamManager } from "@/components/admin/event-team-manager";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from "date-fns-tz";

interface EventConfigManagerProps {
  currentUserRole: UserRole;
}

export function EventConfigManager({ currentUserRole }: EventConfigManagerProps) {
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'teams' | 'roles' | 'agenda'>('events');
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);

  // Only super_admin can manage event configs
  const canManageEvents = currentUserRole === 'super_admin';

  const activeEvent = events.find(e => e.is_active);

  const fetchAgendaItems = useCallback(async () => {
    if (!activeEvent) return;
    
    try {
      const response = await fetch(`/api/agenda?event_id=${activeEvent.id}`);
      if (!response.ok) throw new Error('Failed to fetch agenda items');
      const data = await response.json();
      setAgendaItems(data.agendaItems || []);
    } catch (error) {
      console.error('Error fetching agenda items:', error);
      toast.error('Không thể tải danh sách chương trình');
    }
  }, [activeEvent]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'agenda' && activeEvent) {
      fetchAgendaItems();
    }
  }, [activeTab, activeEvent, fetchAgendaItems]);

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

  // Tab navigation
  const handleTabChange = (tab: 'events' | 'teams' | 'roles' | 'agenda') => {
    setActiveTab(tab);
  };

  const handleCreateEvent = () => {
    setEditingEvent({
      id: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      deadline_payment: 10, // Default to 10 days
      cancellation_deadline: '',
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

  // Agenda management functions
  const handleCreateAgenda = () => {
    setEditingAgenda({
      id: '',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      venue: '',
      session_type: 'session',
      notes: '',
      event_config_id: activeEvent?.id || ''
    });
    setIsAgendaDialogOpen(true);
  };

  const handleEditAgenda = (item: AgendaItem) => {
    const formattedItem = {
      ...item,
      start_time: formatInTimeZone(item.start_time, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm"),
      end_time: item.end_time ? formatInTimeZone(item.end_time, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm") : ''
    };
    setEditingAgenda(formattedItem);
    setIsAgendaDialogOpen(true);
  };

  const handleSaveAgenda = async () => {
    if (!editingAgenda) return;

    setIsSaving(true);
    try {
      const method = editingAgenda.id ? 'PATCH' : 'POST';
      const url = '/api/agenda';
      
      const payload = editingAgenda.id 
        ? { 
            id: editingAgenda.id,
            title: editingAgenda.title,
            description: editingAgenda.description,
            startTime: editingAgenda.start_time,
            endTime: editingAgenda.end_time,
            location: editingAgenda.location,
            sessionType: editingAgenda.session_type,
            venue: editingAgenda.venue,
            notes: editingAgenda.notes
          }
        : {
            title: editingAgenda.title,
            description: editingAgenda.description,
            startTime: editingAgenda.start_time,
            endTime: editingAgenda.end_time,
            location: editingAgenda.location,
            sessionType: editingAgenda.session_type,
            venue: editingAgenda.venue,
            notes: editingAgenda.notes,
            eventConfigId: activeEvent?.id
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save agenda item');

      toast.success(editingAgenda.id ? 'Cập nhật chương trình thành công' : 'Tạo chương trình mới thành công');
      setIsAgendaDialogOpen(false);
      setEditingAgenda(null);
      fetchAgendaItems();
    } catch (error) {
      console.error('Error saving agenda item:', error);
      toast.error('Không thể lưu chương trình');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAgenda = async (itemId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục chương trình này?')) return;

    try {
      const response = await fetch(`/api/agenda?id=${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete agenda item');

      toast.success('Xóa chương trình thành công');
      fetchAgendaItems();
    } catch (error) {
      console.error('Error deleting agenda item:', error);
      toast.error('Không thể xóa chương trình');
    }
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType?.toLowerCase()) {
      case 'plenary': return 'bg-blue-500';
      case 'workshop': return 'bg-green-500';
      case 'mass': return 'bg-purple-500';
      case 'break': return 'bg-amber-500';
      case 'cultural': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionTypeName = (sessionType: string) => {
    switch (sessionType?.toLowerCase()) {
      case 'plenary': return 'Sinh hoạt chung';
      case 'workshop': return 'Hội thảo';
      case 'mass': return 'Thánh lễ';
      case 'break': return 'Nghỉ ngơi';
      case 'cultural': return 'Văn hóa';
      default: return sessionType || 'Khác';
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
            variant={activeTab === 'teams' ? 'default' : 'outline'}
            onClick={() => handleTabChange('teams')}
            className="mr-2"
          >
            Quản lý nhóm
          </Button>
          <Button
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => handleTabChange('roles')}
            className="mr-2"
          >
            Quản lý vai trò
          </Button>
          <Button
            variant={activeTab === 'agenda' ? 'default' : 'outline'}
            onClick={() => handleTabChange('agenda')}
          >
            Quản lý chương trình
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
        ) : activeTab === 'teams' ? (
          <EventTeamManager eventConfig={activeEvent || null} />
        ) : activeTab === 'roles' ? (
          <EventRoleManager eventConfig={activeEvent || null} />
        ) : (
          // Agenda tab content
          <div className="space-y-4">
            {!activeEvent ? (
              <div className="text-center py-8 text-muted-foreground">
                Vui lòng kích hoạt một sự kiện để quản lý chương trình
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Chương trình: {activeEvent.name}
                  </h3>
                  <Button onClick={handleCreateAgenda}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm chương trình
                  </Button>
                </div>

                {agendaItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có chương trình nào được tạo
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agendaItems.map((item) => (
                      <Card key={item.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{item.title}</h4>
                                {item.session_type && (
                                  <Badge className={getSessionTypeColor(item.session_type)}>
                                    {getSessionTypeName(item.session_type)}
                                  </Badge>
                                )}
                              </div>
                              
                              {item.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {formatInTimeZone(item.start_time, 'Asia/Tokyo', 'HH:mm')} - {' '}
                                    {item.end_time ? formatInTimeZone(item.end_time, 'Asia/Tokyo', 'HH:mm') : ''}
                                  </span>
                                </div>
                                
                                {item.venue && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{item.venue}</span>
                                  </div>
                                )}

                                <div className="text-muted-foreground">
                                  {formatInTimeZone(item.start_time, 'Asia/Tokyo', 'dd/MM/yyyy')}
                                </div>
                              </div>

                              {item.speaker && (
                                <p className="text-sm mt-2">
                                  <span className="font-medium">Diễn giả:</span> {item.speaker}
                                </p>
                              )}

                              {item.notes && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <span className="font-medium">Ghi chú:</span> {item.notes}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAgenda(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAgenda(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
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
                  <Label htmlFor="base_price">Phí tham gia (¥)</Label>
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
                <div>
                  <Label htmlFor="deadline_payment">Thời hạn thanh toán (ngày)</Label>
                  <Input
                    id="deadline_payment"
                    type="number"
                    min="1"
                    value={editingEvent.deadline_payment || 10}
                    onChange={(e) => setEditingEvent(prev => 
                      prev ? {...prev, deadline_payment: parseInt(e.target.value, 10) || 10} : null
                    )}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="cancellation_deadline">Thời hạn hủy đăng ký</Label>
                  <Input
                    id="cancellation_deadline"
                    type="datetime-local"
                    value={editingEvent.cancellation_deadline ? 
                      new Date(editingEvent.cancellation_deadline).toISOString().slice(0, 16) : ''
                    }
                    onChange={(e) => setEditingEvent(prev => 
                      prev ? {...prev, cancellation_deadline: e.target.value} : null
                    )}
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

        {/* Edit/Create Agenda Dialog */}
        <Dialog open={isAgendaDialogOpen} onOpenChange={setIsAgendaDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAgenda?.id ? 'Chỉnh sửa chương trình' : 'Thêm chương trình mới'}
              </DialogTitle>
              <DialogDescription>
                Cập nhật thông tin chi tiết cho chương trình sự kiện
              </DialogDescription>
            </DialogHeader>
            
            {editingAgenda && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="agenda-title">Tiêu đề *</Label>
                  <Input
                    id="agenda-title"
                    value={editingAgenda.title}
                    onChange={(e) => setEditingAgenda((prev: AgendaItem | null) => 
                      prev ? {...prev, title: e.target.value} : null
                    )}
                    placeholder="Nhập tiêu đề chương trình"
                  />
                </div>

                <div>
                  <Label htmlFor="agenda-description">Mô tả</Label>
                  <Textarea
                    id="agenda-description"
                    value={editingAgenda.description || ''}
                    onChange={(e) => setEditingAgenda((prev: AgendaItem | null) => 
                      prev ? {...prev, description: e.target.value} : null
                    )}
                    placeholder="Nhập mô tả chương trình"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agenda-start-time">Thời gian bắt đầu *</Label>
                    <Input
                      id="agenda-start-time"
                      type="datetime-local"
                      value={editingAgenda.start_time}
                      onChange={(e) => setEditingAgenda((prev: AgendaItem | null) => 
                        prev ? {...prev, start_time: e.target.value} : null
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="agenda-end-time">Thời gian kết thúc</Label>
                    <Input
                      id="agenda-end-time"
                      type="datetime-local"
                      value={editingAgenda.end_time || ''}
                      onChange={(e) => setEditingAgenda((prev: AgendaItem | null) => 
                        prev ? {...prev, end_time: e.target.value} : null
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="agenda-session-type">Loại hoạt động</Label>
                  <Select
                    value={editingAgenda.session_type}
                    onValueChange={(value) => setEditingAgenda((prev: AgendaItem | null) => 
                      prev ? {...prev, session_type: value} : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại hoạt động" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mass">Thánh lễ</SelectItem>
                      <SelectItem value="plenary">Sinh hoạt chung</SelectItem>
                      <SelectItem value="workshop">Hội thảo</SelectItem>
                      <SelectItem value="cultural">Văn Nghệ</SelectItem>
                      <SelectItem value="break">Nghỉ ngơi</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agenda-venue">Khu vực</Label>
                    <Input
                      id="agenda-venue"
                      value={editingAgenda.venue || ''}
                      onChange={(e) => setEditingAgenda((prev: AgendaItem | null) => 
                        prev ? {...prev, venue: e.target.value} : null
                      )}
                      placeholder="Nhập khu vực tổ chức"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="agenda-notes">Ghi chú</Label>
                  <Textarea
                    id="agenda-notes"
                    value={editingAgenda.notes || ''}
                    onChange={(e) => setEditingAgenda((prev: AgendaItem | null) => 
                      prev ? {...prev, notes: e.target.value} : null
                    )}
                    placeholder="Nhập ghi chú bổ sung"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAgendaDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSaveAgenda}
                    disabled={isSaving || !editingAgenda.title || !editingAgenda.start_time}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    {editingAgenda?.id ? 'Lưu thay đổi' : 'Tạo mới'}
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
