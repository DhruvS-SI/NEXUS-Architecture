# 📧 Email Integration Documentation

## Overview

The NEXUS Backend Framework features a complete email integration system using **Zoho Mail API** that automatically sends confirmation emails after form submissions. This document covers setup, configuration, usage, and troubleshooting.

## ✨ Features

- **🔄 Automatic Email Sending** - Triggers after successful CRM submissions
- **🎨 Module-Specific Templates** - Different email templates for each form type
- **🔐 OAuth 2.0 Authentication** - Secure integration with Zoho Mail
- **♻️ Token Auto-Refresh** - Handles expired tokens automatically
- **🌍 Multi-Region Support** - Works with different Zoho data centers
- **📧 Professional Templates** - Beautiful HTML email templates

## 🏗️ Architecture

```
Form Submission → CRM Processing → Email Processor → Zoho Mail API → User Inbox
```

### Core Components

1. **EmailProcessor** (`processors/emailProcessor.js`) - Main email handling logic
2. **FormsProcessor** (`processors/formsProcessor.js`) - Triggers email after CRM submission
3. **OAuth Callback** (`pathways/crmPathways.js`) - Handles Zoho Mail authorization

## 🚀 Setup & Configuration

### 1. Zoho Mail API Setup

1. **Create Zoho Application:**
   - Go to [Zoho API Console](https://api-console.zoho.in/)
   - Create a new application
   - Set redirect URI: `http://localhost:3000/zoho/mail/callback`

2. **Required OAuth Scopes:**
   ```
   ZohoMail.messages.ALL
   ZohoMail.accounts.READ
   ```

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Zoho Mail API Configuration
ZOHO_MAIL_CLIENT_ID=your_client_id_here
ZOHO_MAIL_CLIENT_SECRET=your_client_secret_here
ZOHO_MAIL_ACCESS_TOKEN=will_be_auto_generated
ZOHO_MAIL_REFRESH_TOKEN=will_be_auto_generated

# Email Settings
FROM_EMAIL=your-email@domain.com
FROM_NAME=Your Company Name
```

### 3. Authorization Process

1. **Generate Authorization URL:**
   ```
   https://accounts.zoho.in/oauth/v2/auth?scope=ZohoMail.messages.ALL,ZohoMail.accounts.READ&client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/zoho/mail/callback&access_type=offline
   ```

2. **Complete Authorization:**
   - Visit the URL in your browser
   - Grant permissions
   - Tokens will be automatically saved to `.env`

## 📝 Email Templates

### Available Templates

#### 1. **Newsletter Subscription** (`newsletters`)
- Subject: `🎉 Welcome to Our Newsletter!`
- Features: Welcome message, subscription benefits, unsubscribe info

#### 2. **Contact Form** (`contacts`) 
- Subject: `✅ Thank you for contacting us!`
- Features: Message confirmation, contact details summary, response timeline

#### 3. **eBook Download** (`ebook`)
- Subject: `📚 Your eBook Download Confirmation`
- Features: Download confirmation, organization details, next steps

#### 4. **Career Application** (`careers`)
- Subject: `🎯 Application Received - Thank You!`
- Features: Application confirmation, position details, HR follow-up info

### Template Structure

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Email Title</h2>
    <p>Personalized greeting with user data</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
        <!-- Dynamic content based on form data -->
    </div>
    
    <p>Call to action or next steps</p>
    <p>Best regards,<br><strong>Company Name</strong></p>
</div>
```

## 🔧 API Usage

### Basic Email Sending

```javascript
const emailProcessor = new EmailProcessor();

// Send a module-specific email
const result = await emailProcessor.sendModuleEmail(userData, 'ebook');

if (result.success) {
    console.log('Email sent:', result.messageId);
} else {
    console.error('Email failed:', result.error);
}
```

### Custom Email Sending

```javascript
const result = await emailProcessor.sendEmail(
    'user@example.com',
    'Custom Subject',
    '<h1>Custom HTML Content</h1>'
);
```

### Health Check

```javascript
const health = await emailProcessor.healthCheck();
console.log('Email service status:', health.status);
```

## 🔄 Integration Flow

### 1. Form Submission Process

```javascript
// In FormsProcessor.processUnifiedForm()
try {
    // 1. Submit to Zoho CRM
    const crmResult = await this.crmProcessor.submitToCRM(module_name, data);
    
    // 2. Send confirmation email
    const emailResult = await this.emailProcessor.sendModuleEmail(data, module_name);
    
    if (emailResult.success) {
        console.log('✅ Confirmation email sent successfully');
    } else {
        console.warn('⚠️ Email sending failed:', emailResult.error);
    }
    
    return { success: true, crmResult, emailResult };
} catch (error) {
    console.error('❌ Form processing failed:', error);
    return { success: false, error: error.message };
}
```

### 2. Automatic Token Refresh

The system automatically handles token expiration:

```javascript
// If API returns 401 Unauthorized
if (response.status === 401) {
    console.log('🔄 Mail access token expired, refreshing...');
    await this.refreshAccessToken();
    // Retry the original request with new token
}
```

## 📊 Response Format

### Successful Email Response

```json
{
    "success": true,
    "messageId": "1749638198142100700",
    "message": "Email sent successfully"
}
```

### Failed Email Response

```json
{
    "success": false,
    "error": "Zoho Mail API Error: 404 Not Found - Invalid Input"
}
```

### Zoho Mail API Response

```json
{
    "status": {
        "code": 200,
        "description": "success"
    },
    "data": {
        "subject": "📚 Your eBook Download Confirmation",
        "messageId": "1749638198142100700",
        "fromAddress": "noreply@yourcompany.com",
        "mailFormat": "html",
        "mailId": "<unique@zohomail.in>",
        "toAddress": "user@example.com"
    }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. **401 Unauthorized Error**
**Cause:** Expired or invalid access token
**Solution:** 
- Check if refresh token is valid
- Re-authorize if refresh token expired
- Verify OAuth scopes are correct

#### 2. **404 Not Found - EXTRA_KEY_FOUND_IN_JSON**
**Cause:** Invalid fields in API payload
**Solution:** 
- Use only supported fields: `fromAddress`, `toAddress`, `subject`, `content`, `mailFormat`
- Avoid extra fields like `textContent`

#### 3. **Email Not Configured**
**Cause:** Missing environment variables
**Solution:**
```bash
# Check required variables
echo $ZOHO_MAIL_CLIENT_ID
echo $ZOHO_MAIL_ACCESS_TOKEN
echo $FROM_EMAIL
```

#### 4. **Invalid FROM Address**
**Cause:** Using email address not configured in Zoho Mail account
**Solution:**
- Use email address from your Zoho Mail account
- Check account details via `/accounts` API endpoint

### Debug Mode

Enable verbose logging by adding debug logs temporarily:

```javascript
// In emailProcessor.js
console.log('🔍 Debug info:', {
    accountId: this.accountId,
    fromEmail: this.fromEmail,
    hasToken: !!this.accessToken
});
```

## 🔐 Security Considerations

### Environment Variables
- Store all credentials in `.env` file
- Never commit tokens to version control
- Use different credentials for production

### Token Management
- Refresh tokens have longer validity than access tokens
- System automatically refreshes access tokens
- Monitor token expiration and refresh failures

### API Rate Limits
- Zoho Mail API has rate limits
- Implement exponential backoff for failures
- Consider queue system for high-volume applications

## 📈 Monitoring & Analytics

### Success Metrics
- Track email delivery success rates
- Monitor response times
- Log failed email attempts

### Health Checks
```javascript
// Regular health check endpoint
app.get('/health/email', async (req, res) => {
    const health = await emailProcessor.healthCheck();
    res.json(health);
});
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] OAuth tokens generated and tested
- [ ] Email templates reviewed
- [ ] FROM email address verified
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Monitoring configured

### Performance Optimization
- Cache account ID after first retrieval
- Implement connection pooling
- Use asynchronous processing for high volume
- Consider email queue for reliability

## 📚 Additional Resources

- [Zoho Mail API Documentation](https://www.zoho.com/mail/help/api/)
- [OAuth 2.0 Flow Documentation](https://www.zoho.com/accounts/protocol/oauth.html)
- [NEXUS Backend Framework Documentation](./README.md)

---

## 📞 Support

For issues or questions about email integration:
1. Check this documentation
2. Review error logs
3. Test with curl commands for API debugging
4. Verify Zoho Mail account access

**Last Updated:** June 2025
**Version:** 1.0.0 