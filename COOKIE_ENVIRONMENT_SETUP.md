# 🍪 Cookie Domain Configuration Guide

## Environment-Aware Cookie Setup

The NEXUS backend now supports **environment-specific cookie configuration** to handle different domains across development, staging, and production.

## 🔧 Environment Variables

Add these to your `.env` file based on your environment:

### **Development (localhost)**
```bash
NODE_ENV=development
# COOKIE_DOMAIN not needed - defaults to localhost
COOKIE_SECRET=nexus-development-secret-key
```

### **Staging Environment**
```bash
NODE_ENV=staging
COOKIE_DOMAIN=.staging.yourdomain.com
COOKIE_SECRET=nexus-staging-secret-key-2024
```

### **Production Environment**
```bash
NODE_ENV=production
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECRET=nexus-production-super-secret-key-2024
```

## 🎯 Cookie Behavior by Environment

| Environment | Secure | SameSite | Domain | HTTPS Required |
|-------------|--------|----------|---------|----------------|
| **Development** | `false` | `lax` | `localhost` | ❌ No |
| **Staging** | `true` | `lax` | `.staging.yourdomain.com` | ✅ Yes |
| **Production** | `true` | `strict` | `.yourdomain.com` | ✅ Yes |

## 🔑 Domain Configuration Options

### **Option 1: Specific Subdomain**
```bash
COOKIE_DOMAIN=api.yourdomain.com
```
**Result:** Cookie only works on `api.yourdomain.com`

### **Option 2: All Subdomains (Recommended)**
```bash
COOKIE_DOMAIN=.yourdomain.com
```
**Result:** Cookie works on:
- `yourdomain.com`
- `www.yourdomain.com`
- `api.yourdomain.com`
- `staging.yourdomain.com`

### **Option 3: No Domain (Default)**
```bash
# COOKIE_DOMAIN not set
```
**Result:** Cookie works only on the current host

## 🚀 Deployment Examples

### **AWS/Docker Staging**
```bash
NODE_ENV=staging
COOKIE_DOMAIN=.staging-nexus.company.com
COOKIE_SECRET=aws-staging-secret-2024
```

### **Production with Load Balancer**
```bash
NODE_ENV=production
COOKIE_DOMAIN=.nexusapp.com
COOKIE_SECRET=prod-ultra-secret-key-2024-v2
```

### **Multiple Environments**
```bash
# Development
NODE_ENV=development

# Staging
NODE_ENV=staging
COOKIE_DOMAIN=.stg.nexusapi.io

# Production
NODE_ENV=production
COOKIE_DOMAIN=.nexusapi.io
```

## 🔒 Security Features

### **Development**
- ✅ HTTP allowed (for localhost testing)
- ✅ Less strict SameSite policy
- ✅ Easy debugging

### **Staging**
- ✅ HTTPS required
- ✅ Domain-specific cookies
- ✅ Production-like security

### **Production**
- ✅ HTTPS enforced
- ✅ Strict SameSite policy
- ✅ Maximum security
- ✅ Cross-subdomain support

## 🧪 Testing Commands

### **Test Different Environments:**

```bash
# Development
NODE_ENV=development node nexus-core.js

# Staging
NODE_ENV=staging COOKIE_DOMAIN=.staging.test.com node nexus-core.js

# Production
NODE_ENV=production COOKIE_DOMAIN=.myapp.com node nexus-core.js
```

### **Verify Cookie Settings:**

```bash
# Check cookie in response headers
curl -X POST "http://localhost:3000/api/cookie-consent" \
  -H "Content-Type: application/json" \
  -d '{"allowCookie": 1, "ipaddress": "1", "privacy_version": "1", "terms_conditions_version": "1", "cookies_policy_version": "1"}' \
  -i | grep -i "set-cookie"
```

## 📋 Environment Checklist

### **Before Deployment:**

- [ ] Set `NODE_ENV` correctly
- [ ] Configure `COOKIE_DOMAIN` for your domain
- [ ] Use strong `COOKIE_SECRET` (min 32 characters)
- [ ] Ensure HTTPS is available in staging/production
- [ ] Test cookie functionality on target domain
- [ ] Verify cross-subdomain access if needed

### **Production Security:**

- [ ] Use environment-specific secrets
- [ ] Never commit `.env` files
- [ ] Rotate cookie secrets regularly
- [ ] Monitor cookie behavior in browser dev tools
- [ ] Test with actual domain names

## 🎯 Quick Setup Examples

### **Local Development:**
```bash
echo "NODE_ENV=development" >> .env
echo "COOKIE_SECRET=dev-secret-key-2024" >> .env
```

### **Production Setup:**
```bash
echo "NODE_ENV=production" >> .env
echo "COOKIE_DOMAIN=.yourcompany.com" >> .env
echo "COOKIE_SECRET=$(openssl rand -base64 32)" >> .env
```

---

**✅ Your cookie consent API is now environment-ready!** 🚀 