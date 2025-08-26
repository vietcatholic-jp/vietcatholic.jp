# Tài liệu Yêu cầu - Quản lý Thành viên Nhóm

## Giới thiệu

Tính năng này cho phép trưởng nhóm và thư ký quản lý và xem thông tin thành viên nhóm của họ thông qua giao diện chuyên dụng. Hệ thống sẽ gán role "event_organizer" cho trưởng nhóm và thư ký, cung cấp menu "Nhóm của tôi" trong dashboard, và cho phép họ truy cập thông tin chi tiết về thành viên nhóm.

## Yêu cầu

### Yêu cầu 1

**User Story:** Là một trưởng nhóm, tôi muốn được gán role "event_organizer", để có quyền quản lý nhóm của mình.

#### Tiêu chí chấp nhận

1. KHI một user được chỉ định làm trưởng nhóm (leader_id trong event_teams) THÌ hệ thống SẼ gán role "event_organizer" cho họ
2. KHI một user có role "event_organizer" THÌ hệ thống SẼ cấp quyền truy cập các tính năng quản lý nhóm
3. NẾU một user không còn là trưởng nhóm THÌ hệ thống SẼ thu hồi role "event_organizer" một cách phù hợp

### Yêu cầu 2

**User Story:** Là một thư ký, tôi muốn được gán role "event_organizer", để có thể hỗ trợ các công việc quản lý nhóm.

#### Tiêu chí chấp nhận

1. KHI một user được chỉ định làm thư ký (sub_leader_id trong event_teams) THÌ hệ thống SẼ gán role "event_organizer" cho họ
2. KHI một thư ký có role "event_organizer" THÌ hệ thống SẼ cấp quyền quản lý nhóm giống như trưởng nhóm
3. NẾU một user không còn là thư ký THÌ hệ thống SẼ thu hồi role "event_organizer" một cách phù hợp

### Yêu cầu 3

**User Story:** Là trưởng nhóm hoặc thư ký, tôi muốn thấy menu "Nhóm của tôi" trong dashboard, để dễ dàng truy cập các tính năng quản lý nhóm.

#### Tiêu chí chấp nhận

1. KHI user có role "event_organizer" truy cập dashboard THÌ hệ thống SẼ hiển thị menu "Nhóm của tôi"
2. KHI user click vào menu "Nhóm của tôi" THÌ hệ thống SẼ điều hướng đến giao diện quản lý nhóm (/my-team)
3. NẾU user không có role "event_organizer" THÌ hệ thống SẼ KHÔNG hiển thị menu "Nhóm của tôi"

### Yêu cầu 4

**User Story:** Là trưởng nhóm hoặc thư ký, tôi muốn xem tất cả thành viên trong nhóm của mình, để biết ai được phân vào nhóm.

#### Tiêu chí chấp nhận

1. KHI trưởng nhóm hoặc thư ký truy cập trang "my-team" THÌ hệ thống SẼ hiển thị danh sách tất cả thành viên nhóm
2. KHI hiển thị thành viên nhóm THÌ hệ thống SẼ hiển thị thông tin cơ bản (tên, vai trò, thông tin liên lạc)
3. NẾU nhóm không có thành viên THÌ hệ thống SẼ hiển thị thông báo trạng thái trống phù hợp

### Yêu cầu 5

**User Story:** Là trưởng nhóm hoặc thư ký, tôi muốn xem thông tin chi tiết của từng thành viên nhóm, để phối hợp hoạt động nhóm tốt hơn.

#### Tiêu chí chấp nhận

1. KHI trưởng nhóm hoặc thư ký click vào một thành viên nhóm THÌ hệ thống SẼ hiển thị thông tin chi tiết của thành viên
2. KHI hiển thị chi tiết thành viên THÌ hệ thống SẼ hiển thị thông tin đăng ký, liên lạc, và trạng thái tham gia
3. KHI xem chi tiết thành viên THÌ hệ thống SẼ đảm bảo quyền riêng tư và chỉ hiển thị thông tin liên quan đến quản lý nhóm
4. NẾU thông tin thành viên không có sẵn THÌ hệ thống SẼ hiển thị thông báo lỗi hoặc placeholder phù hợp

### Yêu cầu 6

**User Story:** Là trưởng nhóm hoặc thư ký, tôi muốn hệ thống chỉ cho phép truy cập thông tin nhóm của mình, để dữ liệu nhóm được bảo mật và riêng tư.

#### Tiêu chí chấp nhận

1. KHI trưởng nhóm hoặc thư ký truy cập thông tin nhóm THÌ hệ thống SẼ chỉ hiển thị thành viên từ nhóm được phân công
2. KHI cố gắng truy cập thông tin nhóm khác THÌ hệ thống SẼ từ chối truy cập và hiển thị thông báo lỗi phù hợp
3. KHI hiển thị dữ liệu nhóm THÌ hệ thống SẼ thực hiện kiểm tra ủy quyền để đảm bảo bảo mật dữ liệu