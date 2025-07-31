import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Clock,
  Users,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { vi } from "date-fns/locale";

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
  max_participants?: number;
  notes?: string;
  event_config?: {
    id: string;
    name: string;
  };
}

export default async function AgendaPage() {
  const supabase = await createClient();

  // Get agenda items for active events
  const { data: agendaItems }: { data: AgendaItem[] | null } = await supabase
    .from('agenda_items')
    .select(`
      *,
      event_config:event_configs(*)
    `)
    .order('start_time', { ascending: true });

  // Group agenda items by JST date
  const groupedAgenda = agendaItems?.reduce((groups, item) => {
    // Convert UTC to JST
    const zonedDate = toZonedTime(new Date(item.start_time), 'Asia/Tokyo');
    const date = format(zonedDate, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, AgendaItem[]>) || {};

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType?.toLowerCase()) {
      case 'plenary':
        return 'bg-blue-500';
      case 'workshop':
        return 'bg-green-500';
      case 'mass':
        return 'bg-purple-500';
      case 'break':
        return 'bg-amber-500';
      case 'cultural':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSessionTypeName = (sessionType: string) => {
    switch (sessionType?.toLowerCase()) {
      case 'plenary':
        return 'Sinh hoạt chung';
      case 'workshop':
        return 'Hội thảo';
      case 'mass':
        return 'Thánh lễ';
      case 'break':
        return 'Nghỉ ngơi';
      case 'cultural':
        return 'Văn hóa';
      default:
        return sessionType || 'Khác';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Chương trình ĐẠI HỘI TOÀN QUỐC NĂM THÁNH 2025
            </h1>
            <p className="text-muted-foreground text-lg">
              Lịch trình chi tiết các hoạt động trong Đại hội
            </p>
          </div>

          {/* Event Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Thời gian</p>
                    <p className="text-sm text-muted-foreground">
                      Thông tin sẽ được cập nhật
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Địa điểm</p>
                    <p className="text-sm text-green-600 font-medium">
                      📍 Kamiozuki, Hanado, Kanagawa (〒257-0005)
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      <a href="https://maps.app.goo.gl/YbZy9rFzni7ztTMv6" className="text-blue-600 hover:underline">Google map</a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Đối tượng</p>
                    <p className="text-sm text-muted-foreground">
                      Cộng đồng Công giáo Việt Nam
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Types Legend */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Các loại hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[
                  { type: 'mass', name: 'Thánh lễ' },
                  { type: 'plenary', name: 'Sinh hoạt chung' },
                  { type: 'workshop', name: 'Hội thảo' },
                  { type: 'cultural', name: 'Văn hóa' },
                  { type: 'break', name: 'Nghỉ ngơi' }
                ].map(({ type, name }) => (
                  <Badge key={type} className={getSessionTypeColor(type)}>
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agenda */}
          {Object.keys(groupedAgenda).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Chương trình đang được chuẩn bị</h3>
                <p className="text-muted-foreground">
                  Lịch trình chi tiết sẽ được cập nhật sớm nhất có thể
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedAgenda).map(([date, items]) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: vi })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="border-l-4 border-primary pl-4 py-2">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{item.title}</h4>
                                {item.session_type && (
                                  <Badge 
                                    variant="secondary"
                                    className={getSessionTypeColor(item.session_type)}
                                  >
                                    {getSessionTypeName(item.session_type)}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
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
                              Thời lượng: {' '}
                              {item.end_time ? Math.round(
                                (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) 
                                / (1000 * 60)
                              ) : 0} phút
                            </div>
                          </div>
                          {item.notes && (
                            <div className="mt-3 p-2 bg-muted rounded text-sm">
                              <span className="font-medium">Ghi chú:</span>
                              <span className="ml-1">{item.notes}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Important Notes */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Lưu ý quan trọng</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Vui lòng đến đúng giờ theo lịch trình
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Mang theo vé tham gia và giấy tờ tùy thân
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Chương trình có thể thay đổi, vui lòng theo dõi thông báo
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Liên hệ ban tổ chức nếu có thắc mắc: https://www.facebook.com/GTCGVNtaiNhat
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
