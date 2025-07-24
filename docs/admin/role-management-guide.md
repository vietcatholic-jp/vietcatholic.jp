# Hướng dẫn Quản lý Vai trò - Admin Guide

## Tổng quan

Hệ thống quản lý vai trò giúp phân loại và tổ chức người tham gia sự kiện một cách hiệu quả. Tính năng này được thiết kế để hỗ trợ admin trong việc:

- Phân chia người tham gia theo vai trò cụ thể
- Xuất dữ liệu với thông tin vai trò rõ ràng
- Thống kê và báo cáo theo vai trò
- Phân đội dựa trên vai trò và kỹ năng

## Các loại vai trò

### 1. 🔵 Tham gia
- **Mô tả**: Người tham gia sự kiện với vai trò cơ bản
- **Ví dụ**: Tham dự viên
- **Màu sắc**: Xanh dương
- **Đặc điểm**: Không có trách nhiệm tổ chức cụ thể

### 2. 🟢 Tình nguyện
- **Mô tả**: Người tình nguyện hỗ trợ tổ chức sự kiện
- **Ví dụ**: 
  - Trưởng ban Truyền thông
  - Thành viên ban Sinh hoạt
  - Phó ban Y tế
- **Màu sắc**: Xanh lá
- **Đặc điểm**: Được phân chia thành các ban chuyên môn

### 3. 🟣 Tổ chức
- **Mô tả**: Người có trách nhiệm tổ chức và điều hành sự kiện
- **Ví dụ**:
  - Ban Tổ chức chính
  - Ban Tổ chức khu vực
- **Màu sắc**: Tím
- **Đặc điểm**: Có quyền quyết định và trách nhiệm cao

### 4. 🟠 Đặc biệt
- **Mô tả**: Người có vai trò đặc biệt trong sự kiện
- **Ví dụ**:
  - Diễn giả
  - Nghệ sĩ biểu diễn
- **Màu sắc**: Cam
- **Đặc điểm**: Khách mời hoặc người có tài năng đặc biệt

## Tính năng chính

### 1. Hiển thị vai trò trong giao diện

#### Role Badge
- Hiển thị tên vai trò bằng tiếng Việt
- Color coding theo loại vai trò
- Tooltip với thông tin chi tiết
- Responsive trên mọi thiết bị

#### Vị trí hiển thị
- Dashboard admin
- Danh sách đăng ký
- Chi tiết registration
- Giao diện phân đội
- Export preview

### 2. Export dữ liệu với vai trò

#### CSV Export
- Cột "Vai trò" trong tất cả file export
- Tên vai trò bằng tiếng Việt (không phải mã)
- Tương thích với Excel và Google Sheets

#### Các loại export
- **Registration Export**: Vai trò của người đăng ký chính
- **Registrants Export**: Vai trò của từng người tham gia
- **Teams Export**: Vai trò trong context phân đội

### 3. Thống kê vai trò

#### Dashboard Statistics
- Biểu đồ phân bố theo loại vai trò
- Top 10 vai trò có nhiều người nhất
- Thống kê chi tiết theo trạng thái đăng ký

#### Metrics hiển thị
- Tổng số người theo vai trò
- Số người đã xác nhận
- Số người đã thanh toán
- Số người chờ xử lý

### 4. Filter và tìm kiếm

#### Role Filter
- Multi-select dropdown
- Search trong danh sách vai trò
- Group theo category
- Clear all filters

#### Ứng dụng
- Lọc danh sách registrants
- Tìm kiếm trong team assignment
- Filter trong export preview

## Hướng dẫn sử dụng

### 1. Xem thống kê vai trò

1. Đăng nhập admin dashboard
2. Scroll xuống phần "Thống kê theo vai trò"
3. Xem biểu đồ phân bố và top roles
4. Click vào chi tiết để xem thêm thông tin

### 2. Export dữ liệu với vai trò

1. Vào trang Registration Manager Export
2. Chọn filters cần thiết
3. Click "Export CSV"
4. Mở file để kiểm tra cột "Vai trò"

### 3. Phân đội theo vai trò

1. Vào trang Team Assignment
2. Xem danh sách người chưa phân đội
3. Sử dụng role filter để lọc theo vai trò
4. Assign người vào đội phù hợp
5. Xem vai trò trong dialog assignment

### 4. Sử dụng Role Filter

1. Click vào dropdown "Lọc theo vai trò"
2. Search hoặc browse danh sách
3. Select multiple roles nếu cần
4. Xem kết quả filtered
5. Clear filters khi cần reset

## Troubleshooting

### Vấn đề thường gặp

#### 1. Vai trò hiển thị "Chưa phân vai trò"
**Nguyên nhân**: Người tham gia chưa được gán vai trò cụ thể
**Giải pháp**: 
- Liên hệ admin để gán vai trò
- Hoặc để mặc định nếu là tham dự viên thông thường

#### 2. Export CSV không có cột vai trò
**Nguyên nhân**: Sử dụng endpoint export cũ
**Giải pháp**:
- Sử dụng export từ Registration Manager
- Hoặc Admin Dashboard export

#### 3. Role statistics không load
**Nguyên nhân**: Lỗi API hoặc quyền truy cập
**Giải pháp**:
- Refresh trang
- Kiểm tra quyền admin
- Liên hệ technical support

#### 4. Role filter không hoạt động
**Nguyên nhân**: JavaScript error hoặc data loading
**Giải pháp**:
- Hard refresh (Ctrl+F5)
- Clear browser cache
- Kiểm tra console errors

### Performance Tips

#### 1. Tối ưu loading
- Role statistics có thể mất 2-3 giây để load
- Sử dụng pagination khi có nhiều data
- Filter để giảm số lượng records hiển thị

#### 2. Export lớn
- Với >1000 records, export có thể mất 5-10 giây
- Sử dụng filters để giảm data size
- Export theo batch nếu cần

## API Reference

### Endpoints mới

#### GET `/api/admin/statistics/roles`
Lấy thống kê vai trò cho dashboard

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "role_name": "Ban tổ chức cốt cán",
      "role_label": "Ban tổ chức cốt cán", 
      "total_count": 15,
      "confirmed_count": 12,
      "paid_count": 10,
      "pending_count": 3
    }
  ],
  "total_registrants": 500
}
```

### Updated Endpoints

#### GET `/api/admin/export`
Bây giờ include role information trong response

#### GET `/api/admin/teams/export`
Thêm cột "Vai trò" trong CSV export

## Technical Notes

### Database Schema
- Sử dụng bảng `event_roles` thay vì enum
- Liên kết qua `registrants.event_role_id`
- Support multiple events với roles khác nhau

### Component Architecture
- `RoleBadge`: Reusable role display component
- `RoleFilter`: Advanced filtering component  
- `RoleStatistics`: Dashboard statistics
- `RoleHelp`: User guidance component

### Utilities
- `lib/role-utils.ts`: Core role processing functions
- Color coding và categorization
- Vietnamese label mapping

## Changelog

### Version 2.0 (Current)
- ✅ Thêm cột vai trò vào tất cả exports
- ✅ Role statistics dashboard
- ✅ Advanced role filtering
- ✅ Enhanced UI với tooltips
- ✅ Comprehensive documentation

### Version 1.0 (Legacy)
- Basic role enum support
- Limited export functionality
- No statistics or filtering

---

**Cập nhật lần cuối**: 2025-07-24  
**Phiên bản**: 2.0  
**Người viết**: AI Assistant
