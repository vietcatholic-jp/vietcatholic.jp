# Teams Assignment Test Suite

Bộ test toàn diện cho trang quản lý chia đội (/admin/teams-assignment) của hệ thống Đại Hội Công Giáo Việt Nam 2025.

## 📋 Tổng quan

Test suite này được thiết kế để kiểm tra toàn diện chức năng quản lý chia đội, bao gồm:

- **Authentication & Authorization**: Kiểm tra quyền truy cập admin/event_organizer
- **UI/UX Testing**: Responsive design, navigation, loading states
- **Functional Testing**: Tất cả các tab và chức năng chính
- **API Integration**: Kiểm tra các endpoints và error handling
- **Edge Cases**: Xử lý lỗi, empty states, concurrent operations

## 🏗️ Cấu trúc thư mục

```
tests/
├── config/                 # Cấu hình Playwright
│   └── playwright.config.ts
├── e2e/                    # End-to-end tests
│   ├── authentication/     # Tests xác thực và phân quyền
│   ├── teams-assignment/   # Tests chức năng chính
│   └── ui-components/      # Tests UI/UX
├── integration/            # Integration tests
│   └── api-endpoints/      # Tests API integration
├── page-objects/           # Page Object Models
│   ├── base-page.ts
│   ├── login-page.ts
│   └── teams-assignment-page.ts
├── fixtures/               # Test data và mock data
│   └── test-data.ts
├── utils/                  # Utilities và helpers
│   └── test-helpers.ts
├── reports/                # Test reports và artifacts
│   ├── html/
│   ├── screenshots/
│   ├── videos/
│   └── traces/
├── global.setup.ts         # Global setup
├── global.teardown.ts      # Global teardown
└── README.md
```

## 🚀 Chạy tests

### Cài đặt dependencies

```bash
npm install
npx playwright install
```

### Chạy tất cả tests

```bash
npx playwright test
```

### Chạy tests theo category

```bash
# Authentication tests
npx playwright test tests/e2e/authentication/

# UI/UX tests
npx playwright test tests/e2e/ui-components/

# Teams assignment functionality
npx playwright test tests/e2e/teams-assignment/

# API integration tests
npx playwright test tests/integration/api-endpoints/
```

### Chạy tests trên browser cụ thể

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

### Chạy tests với UI mode

```bash
npx playwright test --ui
```

### Chạy tests với debug mode

```bash
npx playwright test --debug
```

## 📊 Test Reports

Sau khi chạy tests, reports sẽ được tạo tại:

- **HTML Report**: `tests/reports/html/index.html`
- **JSON Report**: `tests/reports/results.json`
- **JUnit Report**: `tests/reports/results.xml`
- **Screenshots**: `tests/reports/screenshots/`
- **Videos**: `tests/reports/videos/`
- **Traces**: `tests/reports/traces/`

Xem HTML report:

```bash
npx playwright show-report tests/reports/html
```

## 🧪 Test Categories

### 1. Authentication & Authorization Tests
- Kiểm tra đăng nhập với các role khác nhau
- Verify quyền truy cập admin pages
- Test unauthorized access và redirect
- Session management

### 2. UI/UX Tests
- Responsive design trên các device
- Navigation và tab switching
- Loading states và error handling
- Accessibility basics

### 3. Tab Functionality Tests

#### Tab "Tổng quan"
- Hiển thị thống kê chính xác
- Charts và visualizations
- Data accuracy verification

#### Tab "Chưa phân đội"
- Danh sách người tham dự
- Search và filter functionality
- Pagination
- Individual assignment

#### Tab "Quản lý đội"
- CRUD operations cho teams
- Team member management
- Leader assignment

### 4. Modal Tests
- Assign team modal functionality
- Form validation
- Team selection process
- Error handling

### 5. API Integration Tests
- Endpoint response validation
- Error handling
- Authentication checks
- Data format verification

### 6. Edge Cases Tests
- Empty states
- Network errors
- Concurrent operations
- Data validation
- Performance scenarios

## 🔧 Configuration

### Test Environment

Tests được cấu hình để chạy với:
- **Base URL**: `http://localhost:3000`
- **Test User**: `dev.thubv@gmail.com` / `123456`
- **Timeout**: 30 seconds cho navigation, 10 seconds cho actions
- **Retries**: 2 lần trên CI, 0 lần local

### Browser Support

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)

### Test Data

Test sử dụng:
- Mock data cho các scenarios khác nhau
- Real API endpoints với test account
- Fixtures cho consistent test data

## 🐛 Debugging

### Chạy single test với debug

```bash
npx playwright test tests/e2e/teams-assignment/overview-tab.spec.ts --debug
```

### Capture screenshots khi test fail

Screenshots tự động được capture khi tests fail và lưu tại `tests/reports/screenshots/`

### View traces

```bash
npx playwright show-trace tests/reports/traces/trace.zip
```

### Console logs

Kiểm tra console errors trong tests:

```typescript
const errors = await page.evaluate(() => {
  return window.console.error.toString();
});
```

## 📝 Writing New Tests

### 1. Sử dụng Page Object Model

```typescript
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';

test('should do something', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const teamsPage = new TeamsAssignmentPage(page);
  
  await loginPage.loginAsSuperAdmin();
  await teamsPage.navigateToTeamsAssignment();
  // Test logic here
});
```

### 2. Sử dụng Test Helpers

```typescript
import { waitForToast, mockApiResponse } from '../../utils/test-helpers';

test('should handle API error', async ({ page }) => {
  await mockApiError(page, '/api/admin/teams/stats', 'Server error', 500);
  // Test error handling
  await waitForToast(page, 'Không thể tải thống kê');
});
```

### 3. Test Data

```typescript
import { TEST_USERS, MOCK_STATS } from '../../fixtures/test-data';

test('should verify stats', async ({ page }) => {
  await mockApiResponse(page, '/api/admin/teams/stats', MOCK_STATS.OVERVIEW);
  // Verify stats display
});
```

## 🔍 Best Practices

1. **Always login before tests**: Sử dụng `beforeEach` để login
2. **Use data-testid**: Prefer data-testid selectors over CSS classes
3. **Wait for network idle**: Sử dụng `waitForLoadState('networkidle')`
4. **Mock external dependencies**: Mock API calls khi cần thiết
5. **Clean up after tests**: Global teardown sẽ clean up test data
6. **Handle flaky tests**: Sử dụng retry logic và proper waits
7. **Descriptive test names**: Test names nên mô tả rõ ràng behavior

## 🚨 Troubleshooting

### Common Issues

1. **Test timeout**: Tăng timeout hoặc kiểm tra network conditions
2. **Element not found**: Verify selectors và wait conditions
3. **API errors**: Kiểm tra server status và authentication
4. **Flaky tests**: Add proper waits và retry logic

### Getting Help

1. Check test logs và screenshots
2. Run tests với `--debug` flag
3. Verify application is running trước khi chạy tests
4. Check network connectivity

## 📈 Continuous Integration

Tests được thiết kế để chạy trên CI/CD pipeline:

- Automatic retries trên CI
- Parallel execution
- Artifact collection (screenshots, videos, traces)
- JUnit reports cho integration với CI tools

## 🎯 Coverage Goals

Test suite này nhằm đạt được:

- **Functional Coverage**: 100% các chức năng chính
- **UI Coverage**: Tất cả components và states
- **API Coverage**: Tất cả endpoints liên quan
- **Error Coverage**: Các error scenarios quan trọng
- **Browser Coverage**: Chrome, Firefox, Safari (desktop + mobile)
