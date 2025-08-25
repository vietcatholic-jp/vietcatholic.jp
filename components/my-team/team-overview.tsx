import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Settings
} from "lucide-react";

interface TeamOverviewProps {
  teamInfo: {
    id: string;
    name: string;
    description?: string;
    capacity: number;
    member_count: number;
    leader?: {
      id: string;
      full_name: string;
      email: string;
    } | null;
    sub_leader?: {
      id: string;
      full_name: string;
      email: string;
    } | null;
    event_config?: {
      name: string;
      is_active: boolean;
    } | null;
    user_role: 'leader' | 'sub_leader';
  };
  statistics: {
    total_members: number;
    gender: {
      male: number;
      female: number;
    };
    age_groups: {
      under_18: number;
      '18_25': number;
      '26_35': number;
      '36_50': number;
      over_50: number;
    };
    registration_status: {
      confirmed: number;
      pending: number;
      report_paid: number;
      confirm_paid: number;
    };
  };
}

export function TeamOverview({ teamInfo, statistics }: TeamOverviewProps) {
  return (
    <div className="space-y-8">
      {/* Header with role badge */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Nhóm {teamInfo.name}</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin và thành viên nhóm
          </p>
        </div>
        <Badge variant={teamInfo.user_role === 'leader' ? 'default' : 'secondary'}>
          {teamInfo.user_role === 'leader' ? 'Trưởng nhóm' : 'Thư ký'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thành viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_members}</div>
            <p className="text-xs text-muted-foreground">
              / {teamInfo.capacity} sức chứa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.registration_status.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              thành viên
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nam</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.gender.male}</div>
            <p className="text-xs text-muted-foreground">
              thành viên
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nữ</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.gender.female}</div>
            <p className="text-xs text-muted-foreground">
              thành viên
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Thông tin nhóm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Thông tin cơ bản</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Tên nhóm:</span> {teamInfo.name}
                </div>
                {teamInfo.description && (
                  <div>
                    <span className="font-medium">Mô tả:</span> {teamInfo.description}
                  </div>
                )}
                <div>
                  <span className="font-medium">Sức chứa:</span> {teamInfo.capacity} người
                </div>
                <div>
                  <span className="font-medium">Hiện tại:</span> {statistics.total_members} thành viên
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Ban quản lý</h4>
              <div className="space-y-2 text-sm">
                {teamInfo.leader && (
                  <div>
                    <span className="font-medium">Trưởng nhóm:</span> {teamInfo.leader.full_name}
                  </div>
                )}
                {teamInfo.sub_leader && (
                  <div>
                    <span className="font-medium">Thư ký:</span> {teamInfo.sub_leader.full_name}
                  </div>
                )}
                {!teamInfo.leader && !teamInfo.sub_leader && (
                  <div className="text-muted-foreground">
                    Chưa có ban quản lý được phân công
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Age Groups Statistics */}
      {statistics.total_members > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Phân bố độ tuổi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statistics.age_groups.under_18 > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.age_groups.under_18}</div>
                  <div className="text-xs text-muted-foreground">Dưới 18 tuổi</div>
                </div>
              )}
              {statistics.age_groups['18_25'] > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.age_groups['18_25']}</div>
                  <div className="text-xs text-muted-foreground">18-25 tuổi</div>
                </div>
              )}
              {statistics.age_groups['26_35'] > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.age_groups['26_35']}</div>
                  <div className="text-xs text-muted-foreground">26-35 tuổi</div>
                </div>
              )}
              {statistics.age_groups['36_50'] > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.age_groups['36_50']}</div>
                  <div className="text-xs text-muted-foreground">36-50 tuổi</div>
                </div>
              )}
              {statistics.age_groups.over_50 > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.age_groups.over_50}</div>
                  <div className="text-xs text-muted-foreground">Trên 50 tuổi</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
