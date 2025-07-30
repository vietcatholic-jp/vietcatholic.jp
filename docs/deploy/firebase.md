# Firebase App Hosting Deployment Guide

Hướng dẫn triển khai ứng dụng Đại Hội Công Giáo Việt Nam 2025 lên Firebase App Hosting.

## ⚠️ CẢNH BÁO BẢO MẬT

**QUAN TRỌNG**: File này chứa các placeholders cho thông tin nhạy cảm. Trước khi sử dụng:

1. **KHÔNG BAO GIỜ** commit thông tin credentials thực tế vào Git
2. Thay thế tất cả placeholders `[YOUR_*]` bằng giá trị thực tế của dự án
3. Sử dụng environment variables hoặc secret management cho production
4. Xem xét sử dụng GitHub Secrets thay vì embed credentials trực tiếp

### Danh sách Placeholders cần thay thế:

- `[YOUR_DEV_PROJECT_ID]` - Firebase development project ID
- `[YOUR_PROD_PROJECT_ID]` - Firebase production project ID
- `[YOUR_DEV_BACKEND_ID]` - Development backend ID
- `[YOUR_PROD_BACKEND_ID]` - Production backend ID
- `[YOUR_SERVICE_ACCOUNT_EMAIL]` - Service account email
- `[YOUR_PRIVATE_KEY]` - Service account private key
- `[YOUR_DEV_SUPABASE_URL]` - Development Supabase URL
- `[YOUR_PROD_SUPABASE_URL]` - Production Supabase URL
- `[YOUR_DEV_SUPABASE_ANON_KEY]` - Development Supabase anon key
- `[YOUR_PROD_SUPABASE_ANON_KEY]` - Production Supabase anon key

## Tổng quan

Dự án này sử dụng Firebase App Hosting để triển khai ứng dụng Next.js với hai môi trường:
- **Development**: `[YOUR_DEV_PROJECT_ID]` (auto-deploy từ branch `staging`)
- **Production**: `[YOUR_PROD_PROJECT_ID]` (manual deploy từ branch `main`)

## Cấu hình Firebase

### 1. Firebase Projects

```json
// .firebaserc
{
  "projects": {
    "default": "[YOUR_PROD_PROJECT_ID]",
    "production": "[YOUR_PROD_PROJECT_ID]",
    "dev": "[YOUR_DEV_PROJECT_ID]"
  }
}
```

### 2. App Hosting Backends

```json
// firebase.json
{
  "apphosting": [
    {
      "backendId": "[YOUR_DEV_BACKEND_ID]",
      "rootDir": "/",
      "ignore": ["node_modules", ".git", "*.md", ".env*"]
    },
    {
      "backendId": "[YOUR_PROD_BACKEND_ID]",
      "rootDir": "/",
      "ignore": ["node_modules", ".git", "*.md", ".env*"]
    }
  ]
}
```

## Environment Configuration

### Development Environment

**Backend**: `[YOUR_DEV_BACKEND_ID]`
**URL**: https://[YOUR_DEV_BACKEND_URL]
**Supabase**: Development database (`[YOUR_DEV_SUPABASE_URL]`)

```yaml
# apphosting.development.yaml
runConfig:
  runtime: nodejs20
  cpu: 1
  memory: 1GiB
  concurrency: 100
  maxInstances: 100
  minInstances: 0

env:
  - variable: NEXT_PUBLIC_SUPABASE_URL
    value: [YOUR_DEV_SUPABASE_URL]
  - variable: NEXT_PUBLIC_SUPABASE_ANON_KEY
    value: [YOUR_DEV_SUPABASE_ANON_KEY]
  - variable: SUPABASE_SERVICE_ROLE_KEY
    secret: [YOUR_DEV_SERVICE_ROLE_SECRET_NAME]
  - variable: NEXT_PUBLIC_SITE_URL
    value: [YOUR_DEV_SITE_URL]
```

### Production Environment

**Backend**: `[YOUR_PROD_BACKEND_ID]`
**Supabase**: Production database (`[YOUR_PROD_SUPABASE_URL]`)

```yaml
# apphosting.yaml (production)
runConfig:
  runtime: nodejs20
  cpu: 1
  memory: 1GiB
  concurrency: 100
  maxInstances: 100
  minInstances: 0

env:
  - variable: NEXT_PUBLIC_SUPABASE_URL
    value: [YOUR_PROD_SUPABASE_URL]
  - variable: NEXT_PUBLIC_SUPABASE_ANON_KEY
    value: [YOUR_PROD_SUPABASE_ANON_KEY]
  - variable: SUPABASE_SERVICE_ROLE_KEY
    secret: [YOUR_PROD_SERVICE_ROLE_SECRET_NAME]
```

## Service Account Setup

### Development Service Account

**Email**: `[YOUR_SERVICE_ACCOUNT_EMAIL]`

**Required Roles**:
- `roles/firebase.admin`
- `roles/iam.serviceAccountAdmin`
- `roles/run.admin`
- `roles/cloudbuild.builds.editor`
- `roles/storage.admin`
- `roles/compute.networkAdmin`
- `roles/resourcemanager.projectIamAdmin`
- `roles/iam.serviceAccountUser` (for `firebase-app-hosting-compute@[YOUR_PROJECT_ID].iam.gserviceaccount.com`)

### Cấp quyền Service Account

```bash
# Cấp các quyền cần thiết cho service account
SERVICE_ACCOUNT="[YOUR_SERVICE_ACCOUNT_EMAIL]"
PROJECT_ID="[YOUR_PROJECT_ID]"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/iam.serviceAccountAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/compute.networkAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/resourcemanager.projectIamAdmin"

# Cấp quyền actAs cho firebase-app-hosting-compute service account
gcloud iam service-accounts add-iam-policy-binding \
    firebase-app-hosting-compute@$PROJECT_ID.iam.gserviceaccount.com \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/iam.serviceAccountUser" \
    --project=$PROJECT_ID
```

## GitHub Actions Workflow

### Development Auto-Deploy

**File**: `.github/workflows/firebase-deploy-development.yml`  
**Trigger**: Push to `staging` branch  
**Target**: `[YOUR_DEV_BACKEND_ID]` backend

```yaml
name: 🚀 Deploy to Development

on:
  push:
    branches: [ staging ]
  workflow_dispatch:

jobs:
  deploy:
    name: 🔥 Deploy to Firebase App Hosting (Development)
    runs-on: ubuntu-latest
    environment: development

    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4

    - name: 🟢 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: 📦 Install dependencies
      run: npm ci

    - name: 🔍 Lint code
      run: npm run lint

    - name: 🔐 Authenticate to Google Cloud
      uses: google-github-actions/auth@v2
      with:
        credentials_json: |
          {
            "type": "service_account",
            "project_id": "[YOUR_PROJECT_ID]",
            "private_key_id": "[YOUR_PRIVATE_KEY_ID]",
            "private_key": "[YOUR_PRIVATE_KEY]",
            "client_email": "[YOUR_SERVICE_ACCOUNT_EMAIL]",
            "client_id": "[YOUR_CLIENT_ID]",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "[YOUR_CLIENT_X509_CERT_URL]",
            "universe_domain": "googleapis.com"
          }

    - name: ☁️ Setup Google Cloud SDK
      uses: google-github-actions/setup-gcloud@v2

    - name: 🔧 Setup Firebase CLI
      run: npm install -g firebase-tools

    - name: 🚀 Deploy to Firebase App Hosting (Development)
      run: |
        firebase use [YOUR_DEV_PROJECT_ALIAS]
        firebase deploy --only apphosting:[YOUR_DEV_BACKEND_ID]
```

## Manual Deployment Commands

### Development Deployment

```bash
# Switch to development project
firebase use dev

# Deploy to development backend
firebase deploy --only apphosting:[YOUR_DEV_BACKEND_ID]
```

### Production Deployment

```bash
# Switch to production project  
firebase use production

# Deploy to production backend
firebase deploy --only apphosting:[YOUR_PROD_BACKEND_ID]
```

## Monitoring & Management

### Check Backend Status

```bash
# List all backends
firebase apphosting:backends:list --project=[YOUR_PROJECT_ID]

# Get specific backend details
firebase apphosting:backends:get [YOUR_BACKEND_ID] --project=[YOUR_PROJECT_ID]
```

### URLs

- **Development**: https://[YOUR_DEV_BACKEND_URL]
- **Production**: https://[YOUR_PROD_BACKEND_URL]
- **Firebase Console Dev**: https://console.firebase.google.com/project/[YOUR_DEV_PROJECT_ID]/apphosting
- **Firebase Console Prod**: https://console.firebase.google.com/project/[YOUR_PROD_PROJECT_ID]/apphosting

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Kiểm tra service account có đủ quyền
   - Xác nhận service account có thể actAs firebase-app-hosting-compute

2. **Build Failures**
   - Kiểm tra environment variables
   - Xác nhận Supabase credentials đúng
   - Kiểm tra lint errors

3. **Deployment Timeout**
   - Firebase App Hosting build có thể mất 5-10 phút
   - Kiểm tra Cloud Build logs nếu có

### Debug Commands

```bash
# Check authentication
gcloud auth list

# Check project
firebase projects:list

# Check backend status
firebase apphosting:backends:list

# View recent deployments
gcloud logging read "resource.type=cloud_run_revision" --limit=10 --project=[YOUR_PROJECT_ID]
```

## Security Notes

- Service account keys được embed trực tiếp trong GitHub Actions workflow
- Không sử dụng GitHub Secrets để tránh phức tạp
- Production deployment nên sử dụng manual process với proper review
- Secrets trong apphosting.yaml được quản lý qua Firebase Secret Manager

## Next Steps

1. Thiết lập production deployment workflow
2. Cấu hình custom domain cho production
3. Thiết lập monitoring và alerting
4. Backup và disaster recovery plan
