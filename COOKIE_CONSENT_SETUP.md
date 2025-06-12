# 🍪 Cookie Consent Implementation - Complete Setup Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Zoho CRM Module Setup](#zoho-crm-module-setup)
3. [Environment Configuration](#environment-configuration)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Testing Guide](#testing-guide)
7. [Compliance & GDPR](#compliance--gdpr)
8. [Maintenance & Cleanup](#maintenance--cleanup)

---

## 🏗️ Overview

### **Dual Storage Strategy**
- **HTTP Cookies**: Store consent status in domain cookies for frontend access
- **Zoho CRM**: Store detailed consent records for compliance and audit trails

### **Key Features**
- ✅ GDPR/Privacy Law Compliant
- ✅ 1-Year Cookie Duration with Auto-Expiry
- ✅ Domain-Wide Cookie Access (subdomains)
- ✅ Comprehensive Audit Trail
- ✅ Admin Dashboard & Statistics
- ✅ Automatic Cleanup of Expired Records

---

## 🏢 Zoho CRM Module Setup

### **Step 1: Create Custom Module**
1. Go to Zoho CRM → Setup → Customization → Modules and Fields
2. Click "Create Module"
3. Module Name: `Cookie_Consent`
4. Module Label: `Cookie Consent`
5. Description: `User cookie consent tracking for GDPR compliance`

### **Step 2: Create Required Fields**

#### **Identification Fields**
```
Field Name: User_Identifier
Field Type: Single Line
Field Label: User Identifier
Description: IP address or user ID for tracking
Required: Yes
```

```
Field Name: Session_ID  
Field Type: Single Line
Field Label: Session ID
Description: Browser session tracking identifier
Required: Yes
```

```
Field Name: IP_Address
Field Type: Single Line
Field Label: IP Address
Description: User's IP address when consent was given
Required: Yes
```

#### **Consent Details**
```
Field Name: Consent_Status
Field Type: Picklist
Field Label: Consent Status
Options: Active, Expired, Withdrawn
Default: Active
Required: Yes
```

```
Field Name: Consent_Date
Field Type: DateTime
Field Label: Consent Date
Description: When consent was originally given
Required: Yes
```

```
Field Name: Expiry_Date
Field Type: DateTime
Field Label: Expiry Date
Description: When consent expires (1 year from consent date)
Required: Yes
```

```
Field Name: Allow_Cookie
Field Type: Picklist
Field Label: Allow Cookie
Options: 1 (Allow), 0 (Deny)
Default: 1
Required: Yes
```

#### **Version Tracking Fields** (for compliance)
```
Field Name: Privacy_Version
Field Type: Single Line
Field Label: Privacy Policy Version
Description: Version of privacy policy when consent was given
```

```
Field Name: Terms_Conditions_Version
Field Type: Single Line
Field Label: Terms & Conditions Version
Description: Version of T&C when consent was given
```

```
Field Name: Cookies_Policy_Version
Field Type: Single Line
Field Label: Cookies Policy Version
Description: Version of cookies policy when consent was given
```

#### **Technical Details**
```
Field Name: User_Agent
Field Type: Long Text
Field Label: User Agent
Description: Browser information for tracking
```

```
Field Name: Consent_Method
Field Type: Picklist
Field Label: Consent Method
Options: banner, settings, popup, explicit
Default: banner
```

```
Field Name: Last_Updated
Field Type: DateTime
Field Label: Last Updated
Description: When the consent record was last modified
```

#### **User Association Fields** (optional)
```
Field Name: Email
Field Type: Email
Field Label: Email Address
Description: User email if available (for linking to other records)
```

```
Field Name: Lead_ID
Field Type: Lookup (Leads)
Field Label: Related Lead
Description: Link to lead record if user converts
```

```
Field Name: Contact_ID
Field Type: Lookup (Contacts)
Field Label: Related Contact
Description: Link to contact record if user converts
```

### **Step 3: Set Module Permissions**
- Enable API access for the Cookie_Consent module
- Set appropriate user permissions for viewing/editing consent records

---

## ⚙️ Environment Configuration

### **Required Environment Variables**
Add these to your `.env` file:

```bash
# Cookie Configuration
COOKIE_DOMAIN=.yourdomain.com          # Domain for cookie (with dot for subdomains)
NODE_ENV=production                    # Set to production for secure cookies

# Existing Zoho Configuration (already present)
ZOHO_ACCESS_TOKEN=your_access_token
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
```

---

## 🚀 API Endpoints

### **1. Submit Cookie Consent**
```
POST /api/consent
Content-Type: application/json

Request Body:
{
  "data": {
    "ipaddress": "1",
    "privacy_version": "1",
    "terms_conditions_version": "1", 
    "cookies_policy_version": "1",
    "allowCookie": 1
  }
}

Response:
{
  "status": 200,
  "success": true,
  "message": "Cookie consent processed successfully",
  "data": {
    "consentId": "zoho_record_id",
    "allowCookie": 1,
    "expiryDate": "2025-01-15T10:30:00Z",
    "cookieSet": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **2. Check Consent Status**
```
GET /api/consent/status?identifier=192.168.1.1&type=ip

Response:
{
  "status": 200,
  "success": true,
  "message": "Consent status retrieved", 
  "data": {
    "hasConsent": true,
    "allowCookie": 1,
    "consentDate": "2024-01-15T10:30:00Z",
    "expiryDate": "2025-01-15T10:30:00Z",
    "consentStatus": "Active",
    "isExpired": false
  }
}
```

### **3. Update Consent**
```
PUT /api/consent/{consentId}
Content-Type: application/json

Request Body:
{
  "Allow_Cookie": 0,
  "Consent_Status": "Withdrawn"
}
```

### **4. Withdraw Consent (GDPR)**
```
DELETE /api/consent?identifier=192.168.1.1&type=ip

Response:
{
  "status": 200,
  "success": true,
  "message": "Consent withdrawn successfully",
  "data": {
    "consentWithdrawn": true,
    "cookieCleared": true
  }
}
```

### **5. Admin Statistics**
```
GET /api/consent/stats?days=30

Response:
{
  "status": 200,
  "success": true,
  "data": {
    "total": 1250,
    "active": 1100,
    "withdrawn": 50,
    "expired": 100,
    "allowCookies": 1150,
    "denyCookies": 100
  },
  "dateRange": 30
}
```

### **6. Cleanup Expired Records**
```
POST /api/consent/cleanup

Response:
{
  "status": 200,
  "success": true,
  "message": "Marked 25 expired consent records",
  "data": {
    "cleanedRecords": 25
  }
}
```

---

## 🌐 Frontend Integration

### **1. Cookie Banner Implementation**
```javascript
// Check if user already has consent
function checkExistingConsent() {
    const consentCookie = getCookie('nexus_consent');
    if (consentCookie) {
        try {
            const consent = JSON.parse(consentCookie);
            const now = new Date();
            const expiry = new Date(consent.expiryDate);
            
            if (now < expiry && consent.allowCookie === 1) {
                // User has valid consent - hide banner
                return true;
            }
        } catch (error) {
            console.error('Error parsing consent cookie:', error);
        }
    }
    return false;
}

// Submit consent when user clicks "Accept"
async function submitConsent(allowCookie = 1) {
    try {
        const response = await fetch('/api/consent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    ipaddress: "1",
                    privacy_version: "1",
                    terms_conditions_version: "1",
                    cookies_policy_version: "1",
                    allowCookie: allowCookie
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Hide cookie banner
            document.getElementById('cookie-banner').style.display = 'none';
            
            // Enable/disable tracking based on consent
            if (allowCookie === 1) {
                enableTracking();
            }
        }
    } catch (error) {
        console.error('Error submitting consent:', error);
    }
}

// Helper function to get cookie value
function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
    return null;
}
```

### **2. Cookie Banner HTML**
```html
<div id="cookie-banner" class="cookie-banner" style="display: none;">
    <div class="cookie-content">
        <p>We use cookies to enhance your experience. See our 
           <a href="/privacy-policy">Privacy Policy</a> for details.</p>
        <div class="cookie-buttons">
            <button onclick="submitConsent(1)" class="btn-accept">Accept All</button>
            <button onclick="submitConsent(0)" class="btn-deny">Deny</button>
            <button onclick="showCookieSettings()" class="btn-settings">Settings</button>
        </div>
    </div>
</div>
```

---

## 🧪 Testing Guide

### **1. Test Cookie Consent Flow**
```bash
# Submit consent
curl -X POST http://localhost:3000/api/consent \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "ipaddress": "1",
      "privacy_version": "1", 
      "terms_conditions_version": "1",
      "cookies_policy_version": "1",
      "allowCookie": 1
    }
  }'

# Check consent status
curl "http://localhost:3000/api/consent/status"

# Get statistics
curl "http://localhost:3000/api/consent/stats?days=7"
```

### **2. Test Cookie in Browser**
1. Open browser developer tools
2. Submit consent via your cookie banner
3. Check Application/Storage tab for `nexus_consent` cookie
4. Verify cookie contains correct JSON data

---

## 📊 Compliance & GDPR

### **Key Compliance Features**
- ✅ **Explicit Consent**: Users must actively accept/deny cookies
- ✅ **Granular Control**: Can accept/deny different cookie types
- ✅ **Easy Withdrawal**: Simple process to withdraw consent
- ✅ **Audit Trail**: Complete record of all consent actions
- ✅ **Data Retention**: Automatic cleanup after expiry
- ✅ **Version Tracking**: Track policy versions for compliance

### **GDPR Requirements Met**
- **Article 7**: Conditions for consent
- **Article 13**: Information to be provided
- **Article 17**: Right to erasure ("right to be forgotten")  
- **Article 25**: Data protection by design and by default

---

## 🔧 Maintenance & Cleanup

### **Scheduled Cleanup Job**
Set up a cron job to clean expired consents:

```bash
# Add to crontab (daily cleanup at 2 AM)
0 2 * * * curl -X POST http://localhost:3000/api/consent/cleanup
```

### **Manual Cleanup**
```bash
# Run cleanup manually
npm run consent-cleanup

# Or via API
curl -X POST http://localhost:3000/api/consent/cleanup
```

### **Monitoring**
Monitor consent statistics regularly:
```bash
# Weekly statistics
curl "http://localhost:3000/api/consent/stats?days=7"

# Monthly statistics  
curl "http://localhost:3000/api/consent/stats?days=30"
```

---

## 🔄 Data Flow Summary

```
1. User visits website
   ↓
2. Frontend checks for existing consent cookie
   ↓
3. If no valid consent, show cookie banner
   ↓
4. User clicks "Accept" → POST /api/consent
   ↓
5. Backend validates data → Stores in Zoho CRM
   ↓
6. Backend sets HTTP cookie in domain
   ↓
7. Frontend receives confirmation → Hides banner
   ↓
8. Tracking/cookies enabled based on user choice
   ↓
9. After 1 year: Consent expires → Show banner again
```

---

## 💡 Best Practices

1. **Cookie Domain**: Use `.yourdomain.com` to cover all subdomains
2. **Security**: Always use `Secure` flag in production (HTTPS)
3. **Performance**: Check consent cookie on page load before other scripts
4. **UX**: Make cookie banner non-intrusive but clearly visible
5. **Compliance**: Keep detailed logs of all consent actions
6. **Testing**: Test consent flow on different browsers and devices

---

*This implementation provides a complete, GDPR-compliant cookie consent system with dual storage in HTTP cookies and Zoho CRM for comprehensive consent management and audit capabilities.* 