"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search
} from "lucide-react";
import { MemberCard } from "./member-card";
import { MemberDetailModal } from "./member-detail-modal";
import { TeamMember, MemberListProps } from "@/lib/types/team-management";



export function MemberList({ members, totalMembers }: MemberListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredMembers = (members as TeamMember[]).filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.diocese.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  if (totalMembers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách thành viên (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có thành viên</h3>
            <p className="text-muted-foreground">
              Nhóm chưa có thành viên nào được phân công.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Danh sách thành viên ({totalMembers})
        </CardTitle>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, tỉnh thành, giáo phận..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Không tìm thấy thành viên</h3>
            <p className="text-muted-foreground">
              Thử thay đổi từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {filteredMembers.length > 0 && filteredMembers.length !== totalMembers && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Hiển thị {filteredMembers.length} / {totalMembers} thành viên
          </div>
        )}
      </CardContent>

      {/* Member Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Card>
  );
}