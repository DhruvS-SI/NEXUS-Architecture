# 🖼️ Zoho CRM Custom Button Setup for NEXUS Image Upload

## Overview
This guide will help you create a custom button in your Zoho CRM Blog module that integrates with the NEXUS local image upload system.

## Prerequisites
- ✅ NEXUS backend running on `http://localhost:3000`
- ✅ Zoho CRM access with admin privileges
- ✅ Blog module exists in your Zoho CRM

## Step 1: Access Zoho CRM Setup

1. **Login to Zoho CRM**
   - Go to: https://crm.zoho.com/
   - Login with your credentials

2. **Navigate to Setup**
   - Click on **Settings** (gear icon) in the top right
   - Go to **Customization** → **Modules and Fields**

## Step 2: Configure Blog Module

1. **Select Blog Module**
   - Find and click on **"Blog"** module
   - Click **"Layout"** tab

2. **Add Custom Button**
   - Click **"Links & Buttons"** section
   - Click **"+ New Button"**

## Step 3: Custom Button Configuration

### Basic Settings:
```
Button Name: Upload Image
Button Type: Invoke URL
Button Style: Link
Position: Standard Button (Detail Page)
```

### URL Configuration:
```
URL: http://localhost:3000/upload
Open in: New Window
Window Parameters: width=600,height=700,scrollbars=yes,resizable=yes
```

### Advanced Configuration (Optional):
```javascript
// If you want to pass context data from Zoho to your upload form
http://localhost:3000/upload?record_id=${Blog.id}&record_name=${Blog.Blog_Title}
```

## Step 4: Alternative - Custom Function Integration

For a more seamless integration, you can create a **Custom Function** instead:

### Custom Function Code:
```javascript
// Function Name: openImageUpload
// Description: Open NEXUS Image Upload in popup

void openImageUpload(string recordId) {
    // Open upload form in popup
    openUrl("http://localhost:3000/upload?record_id=" + recordId, "popup", "width=600,height=700");
}
```

### Function Button Setup:
```
Button Name: 🖼️ Upload Image
Function Name: openImageUpload
Parameters: ${Blog.id}
```

## Step 5: Enhanced Integration (Advanced)

For auto-populating uploaded URLs back to Zoho fields:

### 1. Create Custom Field in Blog Module:
```
Field Name: Featured_Image_URL
Field Type: URL
Field Label: Featured Image URL
```

### 2. Enhanced Upload URL:
```
http://localhost:3000/upload?zoho_record_id=${Blog.id}&field_name=Featured_Image_URL
```

### 3. Backend Enhancement (Future):
We can enhance the backend to automatically update Zoho CRM fields after upload.

## Step 6: Testing the Integration

1. **Navigate to Blog Record**
   - Open any blog record in your CRM
   - You should see the **"Upload Image"** button

2. **Test Upload Flow**
   - Click **"Upload Image"** button
   - Upload form opens in new window
   - Upload an image
   - Copy the generated URL
   - Paste URL into appropriate field in Blog record

## Step 7: User Workflow

The complete workflow will be:

```
1. User opens Blog record in Zoho CRM
   ↓
2. Clicks "Upload Image" button
   ↓  
3. Upload form opens in popup/new window
   ↓
4. User selects and uploads image
   ↓
5. System generates unique filename and URL
   ↓
6. User copies URL from upload form
   ↓
7. User pastes URL into Blog image field
   ↓  
8. User closes upload window
   ↓
9. User saves Blog record in CRM
```

## Configuration Screenshots Needed:

You'll need to navigate through these sections in Zoho CRM:
1. **Settings** → **Customization** → **Modules and Fields**
2. **Blog** module → **Layouts** 
3. **Links & Buttons** section
4. **+ New Button** configuration

## Production Considerations

When deploying to production:

### 1. Update Upload URL:
```
Change: http://localhost:3000/upload
To: https://your-domain.com/upload
```

### 2. SSL Certificate:
- Ensure your domain has valid SSL certificate
- Zoho CRM requires HTTPS for external integrations

### 3. CORS Configuration:
Update `synapses/server.js`:
```javascript
cors: {
  origin: [
    'https://*.zoho.com',
    'https://*.zohocrm.com', 
    'https://your-domain.com'
  ]
}
```

## Troubleshooting

### Common Issues:

1. **Button doesn't appear**
   - Check if button is added to correct layout
   - Verify user permissions for custom buttons

2. **Upload form doesn't load**
   - Verify NEXUS backend is running
   - Check CORS configuration
   - Ensure port 3000 is accessible

3. **Upload fails**
   - Check server logs for errors
   - Verify file size limits (10MB max)
   - Check supported file types

### Debug Commands:
```bash
# Check if server is running
curl http://localhost:3000/health

# Test upload form
curl http://localhost:3000/upload

# Check server logs
npm start (view console output)
```

## Next Steps

1. ✅ **Test Local Integration**: Set up the custom button
2. 🔄 **Enhance Automation**: Auto-populate URLs back to CRM
3. 🔄 **Deploy to Production**: Move to hosted environment
4. 🔄 **AWS S3 Integration**: Migrate to cloud storage

## Support

If you encounter issues:
1. Check server logs in terminal
2. Verify Zoho CRM custom button configuration  
3. Test upload form directly at `http://localhost:3000/upload`
4. Ensure CORS and network connectivity

---

**Created for NEXUS Backend Architecture**  
**Image Upload Integration with Zoho CRM** 