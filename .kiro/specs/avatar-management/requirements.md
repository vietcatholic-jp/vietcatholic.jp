# Requirements Document

## Introduction

Chức năng quản lý avatar cho registrants cho phép người dùng và admin thêm, xóa, sửa và crop avatar cho từng registrant trong đăng ký của họ. Avatar sẽ được hiển thị tại tất cả nơi có chứa thông tin registrant với kích thước tối đa 512px và được tích hợp hài hòa với UI hiện có. Hệ thống đã có sẵn field `portrait_url` trong bảng `registrants` và component `PortraitUpload` cơ bản.

## Requirements

### Requirement 1

**User Story:** Là một người dùng đã đăng ký, tôi muốn có thể upload và quản lý avatar cho từng registrant trong đăng ký của mình để cá nhân hóa thông tin của họ.

#### Acceptance Criteria

1. WHEN người dùng truy cập trang dashboard hoặc registration detail THEN hệ thống SHALL hiển thị avatar hiện tại hoặc placeholder cho từng registrant
2. WHEN người dùng click vào avatar/placeholder của registrant THEN hệ thống SHALL mở dialog quản lý avatar
3. WHEN người dùng upload file avatar THEN hệ thống SHALL kiểm tra kích thước file không vượt quá 5MB và định dạng JPG/PNG/WEBP
4. WHEN file avatar được upload thành công THEN hệ thống SHALL hiển thị công cụ crop với tỷ lệ 1:1 (vuông)
5. WHEN người dùng hoàn tất crop avatar THEN hệ thống SHALL resize ảnh về kích thước tối đa 512x512px
6. WHEN avatar được lưu thành công THEN hệ thống SHALL cập nhật `portrait_url` trong bảng `registrants` và hiển thị avatar mới

### Requirement 2

**User Story:** Là một người dùng, tôi muốn có thể chỉnh sửa hoặc xóa avatar hiện tại của registrant để cập nhật hình ảnh đại diện của họ.

#### Acceptance Criteria

1. WHEN registrant có avatar hiện tại THEN hệ thống SHALL hiển thị các nút "Edit" và "Delete" khi hover/click vào avatar
2. WHEN người dùng click "Edit" THEN hệ thống SHALL mở lại dialog với công cụ crop và ảnh hiện tại
3. WHEN người dùng click "Delete" THEN hệ thống SHALL hiển thị dialog xác nhận xóa
4. WHEN người dùng xác nhận xóa avatar THEN hệ thống SHALL xóa file khỏi Supabase Storage và set `portrait_url` = null
5. WHEN avatar được cập nhật THEN hệ thống SHALL cập nhật avatar tại tất cả nơi hiển thị registrant đó trong vòng 5 giây

### Requirement 3

**User Story:** Là một admin, tôi muốn có thể quản lý avatar của tất cả registrants để đảm bảo nội dung phù hợp và hỗ trợ người dùng.

#### Acceptance Criteria

1. WHEN admin truy cập trang quản lý registrations THEN hệ thống SHALL hiển thị avatar của từng registrant
2. WHEN admin click vào avatar của registrant THEN hệ thống SHALL mở dialog quản lý avatar với đầy đủ chức năng
3. WHEN admin upload/edit avatar cho registrant THEN hệ thống SHALL ghi log hành động với thông tin admin vào bảng event_logs
4. WHEN admin xóa avatar của registrant THEN hệ thống SHALL ghi log và có thể gửi thông báo cho user sở hữu registration
5. IF registrant không có avatar THEN admin SHALL có thể upload avatar thay mặt registrant đó

### Requirement 4

**User Story:** Là một người dùng, tôi muốn thấy avatar của registrants được hiển thị nhất quán tại tất cả nơi có thông tin registrant.

#### Acceptance Criteria

1. WHEN avatar tồn tại THEN hệ thống SHALL hiển thị avatar tại dashboard, registration details, admin panels, và tickets
2. WHEN avatar không tồn tại THEN hệ thống SHALL hiển thị placeholder mặc định với initials của registrant
3. WHEN hiển thị trong danh sách registrants THEN avatar SHALL có kích thước 40x40px với border radius 50%
4. WHEN hiển thị trong registration detail THEN avatar SHALL có kích thước 80x80px với border radius 50%
5. WHEN hiển thị trong ticket THEN avatar SHALL có kích thước 80x80px với border radius 8px (như hiện tại)
6. WHEN avatar loading THEN hệ thống SHALL hiển thị skeleton loader phù hợp với kích thước tương ứng

### Requirement 5

**User Story:** Là một developer, tôi muốn hệ thống avatar được tối ưu về performance và storage để đảm bảo trải nghiệm người dùng tốt.

#### Acceptance Criteria

1. WHEN avatar được upload THEN hệ thống SHALL compress ảnh để giảm dung lượng mà không làm giảm chất lượng đáng kể
2. WHEN avatar được hiển thị THEN hệ thống SHALL sử dụng lazy loading cho các danh sách dài registrants
3. WHEN avatar được lưu trữ THEN hệ thống SHALL sử dụng Supabase Storage bucket 'portraits' với CDN caching
4. WHEN avatar được truy cập THEN hệ thống SHALL cache ảnh ở browser và sử dụng Next.js Image optimization
5. WHEN avatar được xóa THEN hệ thống SHALL xóa file khỏi Supabase Storage để tiết kiệm dung lượng

### Requirement 6

**User Story:** Là một người dùng, tôi muốn công cụ crop avatar dễ sử dụng và responsive trên các thiết bị khác nhau.

#### Acceptance Criteria

1. WHEN mở công cụ crop trên desktop THEN hệ thống SHALL hiển thị interface với mouse controls
2. WHEN mở công cụ crop trên mobile THEN hệ thống SHALL hiển thị interface với touch controls
3. WHEN crop avatar THEN người dùng SHALL có thể zoom in/out, drag để di chuyển vùng crop
4. WHEN crop avatar THEN hệ thống SHALL hiển thị preview real-time của kết quả crop
5. WHEN hoàn tất crop THEN hệ thống SHALL hiển thị loading state trong quá trình xử lý và upload
6. IF quá trình crop/upload lỗi THEN hệ thống SHALL hiển thị thông báo lỗi rõ ràng và cho phép thử lại

### Requirement 7

**User Story:** Là một người dùng, tôi muốn có API endpoints để quản lý avatar của registrants một cách programmatic với phân quyền phù hợp.

#### Acceptance Criteria

1. WHEN gọi POST `/api/registrants/[id]/avatar` THEN hệ thống SHALL upload và crop avatar cho registrant
2. WHEN gọi PUT `/api/registrants/[id]/avatar` THEN hệ thống SHALL cập nhật avatar hiện tại
3. WHEN gọi DELETE `/api/registrants/[id]/avatar` THEN hệ thống SHALL xóa avatar và file storage
4. WHEN gọi GET `/api/registrants/[id]/avatar` THEN hệ thống SHALL trả về thông tin avatar hiện tại
5. IF người dùng không có quyền truy cập registrant THEN hệ thống SHALL trả về lỗi 403 Forbidden
6. IF registrant không tồn tại THEN hệ thống SHALL trả về lỗi 404 Not Found

### Requirement 8

**User Story:** Là một system administrator, tôi muốn đảm bảo rằng chỉ có người dùng được phép mới có thể quản lý avatar của registrants.

#### Acceptance Criteria

1. WHEN user thông thường truy cập avatar management THEN hệ thống SHALL chỉ cho phép quản lý registrants thuộc về registrations của họ
2. WHEN admin (registration_manager, event_organizer, regional_admin, super_admin) truy cập THEN hệ thống SHALL cho phép quản lý avatar của tất cả registrants
3. WHEN kiểm tra quyền truy cập THEN hệ thống SHALL verify registrant thuộc về registration có user_id = current user hoặc user có admin role
4. WHEN user cố gắng truy cập registrant không thuộc về họ THEN hệ thống SHALL trả về lỗi 403 Forbidden
5. WHEN thực hiện thao tác avatar THEN hệ thống SHALL ghi log với thông tin user_id và registrant_id vào event_logs
6. IF user chưa đăng nhập THEN hệ thống SHALL redirect đến trang login