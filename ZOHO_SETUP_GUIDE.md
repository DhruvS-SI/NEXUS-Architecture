# 🔑 ZOHO CRM Setup Guide for NEXUS

## 🎯 **Quick Setup (Using Your Existing Zoho Account)**

### **Step 1: Create Developer App**
1. Go to: https://accounts.zoho.com/developerconsole
2. Click **"Add Client"** → **"Server-based Applications"**
3. Fill in:
   ```
   Client Name: NEXUS Backend
   Homepage URL: http://localhost:3000
   Authorized redirect URIs: http://localhost:3000/zoho/callback
   ```
4. **Save and copy:** Client ID & Client Secret

### **Step 2: Generate Authorization Code**
Replace `YOUR_CLIENT_ID` with your actual Client ID:
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=http://localhost:3000/zoho/callback
```

**Visit this URL in browser → Login → Allow permissions → Copy the `code` from redirect URL**

### **Step 3: Get Refresh Token**
Use this curl command (replace values):
```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3000/zoho/callback" \
  -d "code=YOUR_AUTHORIZATION_CODE"
```

**Response will contain:** `refresh_token` (save this!)

### **Step 4: Create .env File**
```bash
# Create .env file with your actual values
NODE_ENV=development
PORT=3000
ZOHO_CLIENT_ID=1000.xxxxx
ZOHO_CLIENT_SECRET=xxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxx.xxxxx
ZOHO_DOMAIN=com
```

### **Step 5: Test Integration**
```bash
# Install SDK
npm install @zohocrm/nodejs-sdk-2.1

# Start NEXUS
npm run up

# Test CRM connection
npm run crm
```

## 🧪 **Test Your CRM Data**
Once running, visit:
- http://localhost:3000/api/crm/health
- http://localhost:3000/api/crm/leads
- http://localhost:3000/api/crm/contacts

## 🤝 **Need Help?**
If any step fails, let me know and I'll help debug!

## 🎯 **Want a Simpler Version?**
If this seems too complex, I can create a minimal 50-line version instead of the full neural architecture. 