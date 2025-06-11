# NEXUS API Setup Guide

## 🔧 Environment Configuration

Create a `.env` file in your project root with the following variables:

```env
# NEXUS Backend Environment Configuration

# Server Configuration
NODE_ENV=development
PORT=3000

# Zoho CRM Configuration
ZOHO_CLIENT_ID=1000.ZPJOCOLGGUP6JGK9PHES5N6HZ9Q5MI
ZOHO_CLIENT_SECRET=8f441921a1e331e815df29fb1e55081e5b611a0e9f
ZOHO_REFRESH_TOKEN=your_actual_refresh_token_here
ZOHO_REDIRECT_URL=http://localhost:3000/zoho/callback
ZOHO_DOMAIN=com

# Google reCAPTCHA Configuration (Required for form submissions)
GOOGLE_RECAPTCHA_SECRET_KEY=your_google_recaptcha_secret_key_here
GOOGLE_RECAPTCHA_SITE_KEY=your_google_recaptcha_site_key_here

# Security Configuration
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting (requests per minute)
RATE_LIMIT=100
```

## 🔐 Google reCAPTCHA Setup

1. **Go to Google reCAPTCHA Console:**
   - Visit: https://www.google.com/recaptcha/admin
   - Sign in with your Google account

2. **Create New Site:**
   - Click "+" to add a new site
   - Enter a label (e.g., "NEXUS Backend")
   - Choose reCAPTCHA type: **reCAPTCHA v2** → **"I'm not a robot" Checkbox**

3. **Configure Domains:**
   - Add your domains:
     - `localhost` (for development)
     - Your production domain

4. **Get Keys:**
   - **Site Key:** Use in frontend forms
   - **Secret Key:** Add to your `.env` file as `GOOGLE_RECAPTCHA_SECRET_KEY`

## 📋 Available API Endpoints

### 🔄 POST APIs (Form Submissions)

All POST endpoints require `recaptcha_token` field for security.

#### Contact Form - `POST /api/contact`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'm interested in your services",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "recaptcha_token": "03AGdBq25..."
}
```

#### eBook Request - `POST /api/ebook`
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "ebook_title": "Complete Guide to APIs",
  "company": "StartupXYZ",
  "job_title": "Developer",
  "recaptcha_token": "03AGdBq25..."
}
```

#### Career Application - `POST /api/careers`
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "position": "Senior Developer",
  "experience": "5 years",
  "phone": "+1234567890",
  "skills": "Node.js, React, API Development",
  "cover_letter": "I am excited to apply for this position...",
  "recaptcha_token": "03AGdBq25..."
}
```

#### Newsletter Subscription - `POST /api/newsletter`
```json
{
  "email": "subscriber@example.com",
  "name": "Newsletter Subscriber",
  "interests": ["technology", "api", "development"],
  "recaptcha_token": "03AGdBq25..."
}
```

### 📖 GET APIs (Content Retrieval)

All GET endpoints support pagination and filtering.

#### Blogs - `GET /api/blogs`
**Query Parameters:**
- `page=1` - Page number
- `limit=10` - Items per page
- `category=Technology` - Filter by category
- `tag=api` - Filter by tag
- `status=published` - Filter by status

**Example:** `GET /api/blogs?page=1&limit=5&category=Technology`

#### Single Blog - `GET /api/blogs/:slug`
**Example:** `GET /api/blogs/getting-started-nexus-backend`

#### Media - `GET /api/media`
**Query Parameters:**
- `page=1` - Page number
- `limit=10` - Items per page
- `type=video` - Filter by media type
- `category=Educational` - Filter by category

#### Case Studies - `GET /api/case-studies`
**Query Parameters:**
- `page=1` - Page number
- `limit=10` - Items per page
- `industry=E-commerce` - Filter by industry
- `status=published` - Filter by status

#### Single Case Study - `GET /api/case-studies/:slug`
**Example:** `GET /api/case-studies/ecommerce-platform-transformation`

## 🧪 Testing the APIs

### Using cURL (POST Example):
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "message": "This is a test message",
    "recaptcha_token": "test_token_for_development"
  }'
```

### Using cURL (GET Example):
```bash
curl http://localhost:3000/api/blogs?page=1&limit=2
```

## ✨ Features Included

- ✅ **Google reCAPTCHA Integration** - All forms protected
- ✅ **Comprehensive Validation** - Field validation with error messages
- ✅ **Zoho CRM Integration** - Automatic lead submission
- ✅ **Pagination Support** - Efficient data loading
- ✅ **Advanced Filtering** - Category, tag, type filtering
- ✅ **Professional Responses** - Consistent API response format
- ✅ **Error Handling** - Detailed error messages and HTTP status codes
- ✅ **Documentation** - Complete API documentation at `/api/docs`

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   - Copy the environment variables above to your `.env` file
   - Get your Google reCAPTCHA keys
   - Ensure your Zoho refresh token is set

3. **Start Server:**
   ```bash
   npm run start
   ```

4. **Test APIs:**
   - Visit: `http://localhost:3000/` for API overview
   - Visit: `http://localhost:3000/api/docs` for complete documentation
   - Test endpoints using Postman or cURL

## 🔒 Security Notes

- All POST endpoints require valid reCAPTCHA tokens
- Form validation prevents malicious input
- Rate limiting recommended for production
- CORS configured for specified origins only
- All data submitted to CRM for lead tracking

Your NEXUS backend is now ready with a complete API suite! 🎉 