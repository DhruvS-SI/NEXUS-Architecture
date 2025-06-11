# 🧠 NEXUS Environment Configuration

## 📋 **Required Environment Variables**

Create a `.env` file in your project root with these variables:

```bash
# 🧠 NEXUS Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# 🔌 Zoho CRM Neural Configuration
ZOHO_CLIENT_ID=your_zoho_client_id_here
ZOHO_CLIENT_SECRET=your_zoho_client_secret_here
ZOHO_REDIRECT_URL=http://localhost:3000/zoho/callback
ZOHO_REFRESH_TOKEN=your_refresh_token_here
ZOHO_ACCESS_TOKEN=your_access_token_here
ZOHO_DOMAIN=com

# 🔴 Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# 🗄️ Database Configuration (Optional)
DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus_db
DB_USER=
DB_PASSWORD=

# 🔒 Security Configuration (Optional)
JWT_SECRET=your_jwt_secret_here
API_KEY=your_api_key_here
```

## 🔧 **Zoho CRM Setup Instructions**

### 1. **Create Zoho Developer Account:**
- Go to [Zoho Developer Console](https://accounts.zoho.com/developerconsole)
- Create a new Server-based application
- Note down Client ID and Client Secret

### 2. **Generate Refresh Token:**
```bash
# Install Zoho CLI (optional)
npm install -g @zohocrm/nodejs-sdk-2.1

# Generate authorization URL
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=YOUR_REDIRECT_URL

# Exchange code for tokens using Postman or curl
```

### 3. **Test Configuration:**
```bash
# Test CRM connection
npm run up
curl http://localhost:3000/api/crm/health
```

## 🚀 **Quick Setup Commands:**
```bash
# 1. Copy template
cp ENV_TEMPLATE.md .env

# 2. Edit with your values
nano .env

# 3. Install CRM SDK
npm install @zohocrm/nodejs-sdk-2.1

# 4. Test neural CRM
npm run up
npm run health
```

## 🧠 **NEXUS CRM Endpoints:**
- `GET /api/crm/health` - CRM system diagnostics
- `GET /api/crm/leads` - Get leads from CRM
- `POST /api/crm/leads` - Create new lead
- `GET /api/crm/contacts` - Get contacts from CRM 