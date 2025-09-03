# Requirements Document

## Introduction

Tính năng tạo thẻ ID cho phép tạo thẻ cá nhân và hàng loạt cho các thành viên tham gia Đại hội Công giáo. Hệ thống sẽ tạo ra các thẻ với kích thước chuẩn 95mm × 130mm và sắp xếp 4 thẻ trên một trang A4 để in và cắt.

## Requirements

### Requirement 1

**User Story:** Là một quản trị viên, tôi muốn tạo thẻ ID cho từng cá nhân từ database người dùng đã đăng ký, để có thể in và phát cho từng người tham gia sự kiện.

#### Acceptance Criteria

1. WHEN quản trị viên chọn tạo thẻ cá nhân THEN hệ thống SHALL hiển thị danh sách người dùng đã đăng ký
2. WHEN quản trị viên chọn một người dùng THEN hệ thống SHALL lấy thông tin từ database (tên thánh, họ và tên, avatar, vai trò)
3. WHEN tạo thẻ THEN hệ thống SHALL sử dụng ảnh asset có sẵn làm background và đè thông tin lên trên
4. IF người dùng có avatar THEN hệ thống SHALL đè avatar lên vị trí được định sẵn trên template
5. IF người dùng không có avatar THEN hệ thống SHALL sử dụng template không có ảnh
6. WHEN thẻ được tạo THEN hệ thống SHALL hiển thị preview thẻ với kích thước 95mm × 130mm (1122 × 1535 px @ 300 DPI)

### Requirement 2

**User Story:** Là một quản trị viên, tôi muốn tạo thẻ hàng loạt cho các đội/nhóm, để tiết kiệm thời gian khi có nhiều người cần tạo thẻ.

#### Acceptance Criteria

1. WHEN quản trị viên chọn tạo thẻ hàng loạt THEN hệ thống SHALL hiển thị danh sách các đội/nhóm
2. WHEN quản trị viên chọn một hoặc nhiều đội THEN hệ thống SHALL lấy danh sách thành viên từ database
3. WHEN hệ thống xử lý danh sách THEN hệ thống SHALL tạo thẻ cho từng thành viên dựa trên thông tin đã có
4. IF thành viên có avatar THEN hệ thống SHALL sử dụng avatar đã đăng ký
5. IF thành viên không có avatar THEN hệ thống SHALL sử dụng template không có ảnh
6. WHEN quá trình tạo hoàn tất THEN hệ thống SHALL hiển thị số lượng thẻ đã tạo thành công

### Requirement 3

**User Story:** Là một quản trị viên, tôi muốn có 4 loại thẻ khác nhau dựa trên asset có sẵn, để phân biệt vai trò của từng người tham gia.

#### Acceptance Criteria

1. WHEN tạo thẻ THEN hệ thống SHALL sử dụng 4 template asset: "Ban tổ chức - có ảnh", "Ban tổ chức - không ảnh", "Tham dự viên - có ảnh", "Tham dự viên - không ảnh"
2. WHEN tạo thẻ ban tổ chức có ảnh THEN hệ thống SHALL sử dụng asset background và đè avatar + text lên vị trí định sẵn
3. WHEN tạo thẻ ban tổ chức không ảnh THEN hệ thống SHALL sử dụng asset background và chỉ đè text lên vị trí định sẵn
4. WHEN tạo thẻ tham dự viên có ảnh THEN hệ thống SHALL sử dụng asset background và đè avatar + text lên vị trí định sẵn
5. WHEN tạo thẻ tham dự viên không ảnh THEN hệ thống SHALL sử dụng asset background và chỉ đè text lên vị trí định sẵn
6. WHEN đè thông tin THEN hệ thống SHALL đảm bảo font, màu sắc, vị trí phù hợp với từng loại thẻ

### Requirement 4

**User Story:** Là một quản trị viên, tôi muốn sắp xếp 4 thẻ trên một trang A4, để tối ưu hóa việc in ấn và cắt thẻ.

#### Acceptance Criteria

1. WHEN tạo layout in THEN hệ thống SHALL sắp xếp 4 thẻ trên trang A4 (210mm × 297mm)
2. WHEN sắp xếp thẻ THEN hệ thống SHALL đặt 2 thẻ theo chiều ngang và 2 dòng theo chiều dọc
3. WHEN tính toán vị trí THEN hệ thống SHALL để khoảng cách 4mm giữa các thẻ
4. WHEN xuất PDF THEN hệ thống SHALL tạo file PDF với độ phân giải 300 DPI
5. WHEN có nhiều hơn 4 thẻ THEN hệ thống SHALL tạo nhiều trang A4

### Requirement 5

**User Story:** Là một quản trị viên, tôi muốn xuất thẻ dưới dạng PDF, để có thể in trực tiếp mà không cần chỉnh sửa thêm.

#### Acceptance Criteria

1. WHEN hoàn tất tạo thẻ THEN hệ thống SHALL cung cấp nút "Xuất PDF"
2. WHEN xuất PDF THEN hệ thống SHALL tạo file PDF với layout 4 thẻ/trang
3. WHEN tạo PDF THEN hệ thống SHALL đảm bảo chất lượng in 300 DPI
4. WHEN PDF được tạo THEN hệ thống SHALL tự động tải xuống file
5. IF có lỗi trong quá trình xuất THEN hệ thống SHALL hiển thị thông báo lỗi chi tiết

### Requirement 6

**User Story:** Là một quản trị viên, tôi muốn có nút xuất thẻ ở nhiều vị trí khác nhau trong hệ thống, để dễ dàng truy cập tính năng từ các trang quản lý.

#### Acceptance Criteria

1. WHEN xem danh sách các đội THEN hệ thống SHALL hiển thị nút "Xuất thẻ đội" cho từng đội
2. WHEN xem chi tiết thông tin cá nhân THEN hệ thống SHALL hiển thị nút "Xuất thẻ cá nhân"
3. WHEN click nút "Xuất thẻ đội" THEN hệ thống SHALL tạo thẻ cho tất cả thành viên trong đội
4. WHEN click nút "Xuất thẻ cá nhân" THEN hệ thống SHALL tạo thẻ cho người đó
5. WHEN xuất thẻ từ bất kỳ vị trí nào THEN hệ thống SHALL áp dụng cùng logic tạo thẻ và xuất PDF

### Requirement 7

**User Story:** Là một quản trị viên, tôi muốn preview thẻ trước khi in, để kiểm tra thông tin và chất lượng trước khi xuất PDF.

#### Acceptance Criteria

1. WHEN tạo thẻ THEN hệ thống SHALL hiển thị preview realtime
2. WHEN thay đổi thông tin THEN hệ thống SHALL cập nhật preview ngay lập tức
3. WHEN preview THEN hệ thống SHALL hiển thị thẻ với tỷ lệ chính xác
4. WHEN có nhiều thẻ THEN hệ thống SHALL cho phép xem từng trang A4
5. WHEN preview layout A4 THEN hệ thống SHALL hiển thị vị trí chính xác của 4 thẻ