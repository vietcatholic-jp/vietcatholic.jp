# GitHub Actions Workflows

Dự án này sử dụng GitHub Actions để tự động kiểm tra chất lượng code và build. Dưới đây là mô tả các workflows:

## 🚀 Quick Check (`quick-check.yml`)

**Mục đích**: Kiểm tra nhanh và cơ bản cho mọi push và pull request.

**Khi chạy**:
- Push lên `main`, `staging`, hoặc các branch `feature/**`, `fix/**`, `hotfix/**`
- Pull request vào `main` hoặc `staging`

**Kiểm tra**:
- ✅ Lint code (tối đa 10 warnings)
- ✅ TypeScript type checking
- ✅ Build thành công
- ✅ Validate build output
- ✅ Kiểm tra package.json
- ✅ Security audit (high/critical vulnerabilities)

**Thời gian**: ~5-10 phút

---

## 🏗️ Build Check (`build-check.yml`)

**Mục đích**: Kiểm tra build trên nhiều môi trường và phiên bản Node.js.

**Khi chạy**:
- Push lên `main` hoặc `staging`
- Pull request vào `main` hoặc `staging`
- Manual trigger với tùy chọn environment

**Kiểm tra**:
- ✅ Build trên Node.js 18.x và 20.x
- ✅ Test trên development, staging, production environments
- ✅ Verify build startup
- ✅ Analyze build size
- ✅ Comment kết quả trên PR

**Thời gian**: ~15-20 phút

---

## 🔍 CI - Build and Quality Check (`ci.yml`)

**Mục đích**: Kiểm tra toàn diện về chất lượng code và bảo mật.

**Khi chạy**:
- Push lên `main` hoặc `staging`
- Pull request vào `main` hoặc `staging`

**Kiểm tra**:
- ✅ ESLint (strict mode)
- ✅ TypeScript compilation
- ✅ Build với environment variables
- ✅ Security audit (moderate level)
- ✅ Code quality checks
- ✅ Package.json validation
- ✅ TypeScript config validation

**Thời gian**: ~10-15 phút

---

## 📋 Workflow Status

### ✅ Khi nào workflows PASS:
- Tất cả linting rules được tuân thủ
- Không có TypeScript errors
- Build thành công trên tất cả environments
- Không có high/critical security vulnerabilities
- Tất cả required files tồn tại

### ❌ Khi nào workflows FAIL:
- ESLint errors hoặc quá nhiều warnings
- TypeScript compilation errors
- Build failures
- High/critical security vulnerabilities
- Missing required files hoặc configurations

---

## 🛠️ Cách fix các lỗi thường gặp

### ESLint Errors
```bash
npm run lint -- --fix
```

### TypeScript Errors
```bash
npx tsc --noEmit
```

### Build Errors
```bash
npm run build
```

### Security Vulnerabilities
```bash
npm audit fix
```

### Dependencies Issues
```bash
npm ci
npm update
```

---

## 🔧 Local Development

Trước khi push code, hãy chạy các lệnh sau để đảm bảo workflows sẽ pass:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Check TypeScript
npx tsc --noEmit

# Test build
npm run build

# Security check
npm audit --audit-level=high
```

---

## 📊 Monitoring

- Kiểm tra status của workflows trong tab **Actions** của repository
- Workflows sẽ comment kết quả trên Pull Requests
- Build artifacts được lưu trong 1 ngày để debug
- Summary reports được tạo cho mỗi workflow run

---

## ⚙️ Configuration

### Environment Variables Required:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for build)

### Secrets Setup:
1. Vào **Settings** > **Secrets and variables** > **Actions**
2. Thêm các secrets cần thiết
3. Workflows sẽ sử dụng mock values nếu secrets không có

---

## 🚨 Troubleshooting

### Workflow bị stuck:
- Cancel và re-run workflow
- Kiểm tra GitHub Actions status page

### Build timeout:
- Workflows có timeout 10-20 phút
- Kiểm tra dependencies có quá lớn không

### Permission errors:
- Đảm bảo repository có quyền Actions enabled
- Kiểm tra branch protection rules

---

**Lưu ý**: Tất cả workflows phải pass trước khi merge vào `main` hoặc `staging` branch.
