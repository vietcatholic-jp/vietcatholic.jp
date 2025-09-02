import { BadgeGenerator } from "@/components/badges/badge-generator";

export default function TestBadgePage() {
  // Mock data for testing - with portrait_url and event_role (should use special background)
  const mockRegistrantWithPhoto = {
    id: "test-id-1",
    full_name: "SR.ROSANNA ĐINH NGUYỄN NGỌC TUYỀN",
    saint_name: "SR.ROSANNA",
    portrait_url: "https://nlnhhiasteknrfcfnzxd.supabase.co/storage/v1/object/public/portraits/3c8b4d30-840e-44ad-a5f6-96e3783caa46/2ffa81be-4439-485a-b4f5-bb609e5cf2f1-portrait.jpg",
    event_role: {
      name: "CỐ VẤN BAN Y TẾ",
      description: "Cố vấn ban y tế"
    }
  };

  // Mock data with role but no photo (should use logo with special background)
  const mockRegistrantWithRoleNoPhoto = {
    id: "test-id-2",
    full_name: "NGUYỄN VĂN A",
    saint_name: "GIUSE",
    portrait_url: null,
    event_role: {
      name: "THÀNH VIÊN BAN TỔ CHỨC",
      description: "Thành viên ban tổ chức"
    }
  };

  // Mock data without role but with photo (regular participant with avatar)
  const mockRegistrantNoRoleWithPhoto = {
    id: "test-id-3",
    full_name: "NGUYỄN VĂN C",
    saint_name: "PHÊRÔ",
    team_name: "ĐOÀN THANH NIÊN THÁNH GIUSE - Typography Test",
    portrait_url: "https://nlnhhiasteknrfcfnzxd.supabase.co/storage/v1/object/public/portraits/3c8b4d30-840e-44ad-a5f6-96e3783caa46/2ffa81be-4439-485a-b4f5-bb609e5cf2f1-portrait.jpg"
  };

  // Mock data without role and no photo (regular participant with logo)
  const mockRegistrantNoRoleNoPhoto = {
    id: "test-id-4",
    full_name: "TRẦN THỊ B",
    saint_name: "MARIA",
    team_name: "ĐOÀN THIẾU NHI THÁNH THỂ - Typography Test",
    portrait_url: null
  };

  // Mock data without saint_name (to test empty saint name handling)
  const mockRegistrantNoSaintName = {
    id: "test-id-5",
    full_name: "NGUYỄN VĂN D",
    saint_name: undefined, // No saint name
    team_name: "ĐOÀN THIẾU NHI THÁNH TÂM - Typography Test",
    portrait_url: null
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Test Badge Generator</h1>

        {/* Horizontal scroll container */}
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-8 min-w-max px-4">
            {/* Test case 1: Organizer with photo */}
            <div className="flex-shrink-0 w-[440px] text-center bg-white rounded-lg shadow-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-green-600">
                Ban tổ chức + Có ảnh (Avatar)
              </h2>
              <BadgeGenerator registrant={mockRegistrantWithPhoto} isTestPage={true} />
            </div>

            {/* Test case 2: Organizer without photo */}
            <div className="flex-shrink-0 w-[440px] text-center bg-white rounded-lg shadow-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-orange-600">
                Ban tổ chức + Không có ảnh (Logo)
              </h2>
              <BadgeGenerator registrant={mockRegistrantWithRoleNoPhoto} isTestPage={true} />
            </div>

            {/* Test case 3: Regular participant with photo */}
            <div className="flex-shrink-0 w-[440px] text-center bg-white rounded-lg shadow-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-purple-600">
                Người tham dự + Có ảnh (Avatar)
              </h2>
              <BadgeGenerator registrant={mockRegistrantNoRoleWithPhoto} isTestPage={true} />
            </div>

            {/* Test case 4: Regular participant without photo */}
            <div className="flex-shrink-0 w-[440px] text-center bg-white rounded-lg shadow-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-blue-600">
                Người tham dự + Không có ảnh (Logo)
              </h2>
              <BadgeGenerator registrant={mockRegistrantNoRoleNoPhoto} isTestPage={true} />
            </div>

            {/* Test case 5: No saint name test */}
            <div className="flex-shrink-0 w-[440px] text-center bg-white rounded-lg shadow-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-indigo-600">
                Người tham dự + Không có tên thánh
              </h2>
              <BadgeGenerator registrant={mockRegistrantNoSaintName} isTestPage={true} />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">💡 Cuộn ngang để xem tất cả các test cases</p>
        </div>
      </div>
    </div>
  );
}
