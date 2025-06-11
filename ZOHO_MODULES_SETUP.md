# Zoho CRM Custom Modules Setup Guide

## 🎯 Module Creation & Field Configuration

### **1. Blogs Module Setup**

#### **Required Fields:**
```json
{
  "fields": [
    {
      "field_label": "Blog Title",
      "data_type": "text",
      "length": 200,
      "unique": {"case_sensitive": false}
    },
    {
      "field_label": "Blog Slug", 
      "data_type": "text",
      "length": 200,
      "unique": {"case_sensitive": false}
    },
    {
      "field_label": "Excerpt",
      "data_type": "textarea",
      "length": 500,
      "textarea": {"type": "large"}
    },
    {
      "field_label": "Content",
      "data_type": "textarea", 
      "length": 50000,
      "textarea": {"type": "rich_text"}
    },
    {
      "field_label": "Author",
      "data_type": "text",
      "length": 100
    },
    {
      "field_label": "Published Date",
      "data_type": "datetime"
    },
    {
      "field_label": "Category",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "Technology", "actual_value": "technology"},
        {"display_value": "Integration", "actual_value": "integration"},
        {"display_value": "Security", "actual_value": "security"},
        {"display_value": "Business", "actual_value": "business"},
        {"display_value": "Tutorials", "actual_value": "tutorials"}
      ]
    },
    {
      "field_label": "Tags",
      "data_type": "multiselectpicklist",
      "pick_list_values": [
        {"display_value": "API", "actual_value": "api"},
        {"display_value": "Backend", "actual_value": "backend"},
        {"display_value": "Node.js", "actual_value": "nodejs"},
        {"display_value": "Zoho", "actual_value": "zoho"},
        {"display_value": "CRM", "actual_value": "crm"},
        {"display_value": "OAuth", "actual_value": "oauth"},
        {"display_value": "Security", "actual_value": "security"},
        {"display_value": "Integration", "actual_value": "integration"}
      ]
    },
    {
      "field_label": "Featured Image URL",
      "data_type": "website",
      "length": 450
    },
    {
      "field_label": "Status",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "Draft", "actual_value": "draft"},
        {"display_value": "Published", "actual_value": "published"},
        {"display_value": "Archived", "actual_value": "archived"}
      ]
    },
    {
      "field_label": "Read Time (Minutes)",
      "data_type": "integer",
      "length": 3
    },
    {
      "field_label": "Meta Description",
      "data_type": "textarea",
      "length": 160,
      "textarea": {"type": "small"}
    }
  ]
}
```

### **2. Case Studies Module Setup**

#### **Required Fields:**
```json
{
  "fields": [
    {
      "field_label": "Case Study Title",
      "data_type": "text",
      "length": 200,
      "unique": {"case_sensitive": false}
    },
    {
      "field_label": "Case Study Slug",
      "data_type": "text", 
      "length": 200,
      "unique": {"case_sensitive": false}
    },
    {
      "field_label": "Client Name",
      "data_type": "text",
      "length": 100
    },
    {
      "field_label": "Industry",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "E-commerce", "actual_value": "ecommerce"},
        {"display_value": "Healthcare", "actual_value": "healthcare"},
        {"display_value": "Financial Services", "actual_value": "financial"},
        {"display_value": "Manufacturing", "actual_value": "manufacturing"},
        {"display_value": "Education", "actual_value": "education"},
        {"display_value": "Technology", "actual_value": "technology"},
        {"display_value": "Real Estate", "actual_value": "realestate"}
      ]
    },
    {
      "field_label": "Challenge",
      "data_type": "textarea",
      "length": 1000,
      "textarea": {"type": "large"}
    },
    {
      "field_label": "Solution",
      "data_type": "textarea",
      "length": 1000, 
      "textarea": {"type": "large"}
    },
    {
      "field_label": "Performance Improvement",
      "data_type": "text",
      "length": 50
    },
    {
      "field_label": "Cost Reduction",
      "data_type": "text",
      "length": 50
    },
    {
      "field_label": "Development Time Saved",
      "data_type": "text",
      "length": 50
    },
    {
      "field_label": "Other Results",
      "data_type": "textarea",
      "length": 500,
      "textarea": {"type": "large"}
    },
    {
      "field_label": "Technologies Used",
      "data_type": "multiselectpicklist",
      "pick_list_values": [
        {"display_value": "Node.js", "actual_value": "nodejs"},
        {"display_value": "NEXUS", "actual_value": "nexus"},
        {"display_value": "Zoho CRM", "actual_value": "zoho_crm"},
        {"display_value": "Microservices", "actual_value": "microservices"},
        {"display_value": "API Gateway", "actual_value": "api_gateway"},
        {"display_value": "OAuth 2.0", "actual_value": "oauth"},
        {"display_value": "Real-time Monitoring", "actual_value": "monitoring"}
      ]
    },
    {
      "field_label": "Timeline",
      "data_type": "text",
      "length": 50
    },
    {
      "field_label": "Featured Image URL",
      "data_type": "website",
      "length": 450
    },
    {
      "field_label": "Published Date",
      "data_type": "datetime"
    },
    {
      "field_label": "Status",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "Draft", "actual_value": "draft"},
        {"display_value": "Published", "actual_value": "published"},
        {"display_value": "Archived", "actual_value": "archived"}
      ]
    }
  ]
}
```

### **3. Media Module Setup**

#### **Required Fields:**
```json
{
  "fields": [
    {
      "field_label": "Media Title",
      "data_type": "text",
      "length": 200
    },
    {
      "field_label": "Media Type",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "Video", "actual_value": "video"},
        {"display_value": "Image", "actual_value": "image"},
        {"display_value": "Image Gallery", "actual_value": "image_gallery"},
        {"display_value": "Document", "actual_value": "document"},
        {"display_value": "Audio", "actual_value": "audio"}
      ]
    },
    {
      "field_label": "Media URL",
      "data_type": "website",
      "length": 450
    },
    {
      "field_label": "Thumbnail URL",
      "data_type": "website",
      "length": 450
    },
    {
      "field_label": "Description",
      "data_type": "textarea",
      "length": 1000,
      "textarea": {"type": "large"}
    },
    {
      "field_label": "Duration (Seconds)",
      "data_type": "integer",
      "length": 6
    },
    {
      "field_label": "Category",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "Educational", "actual_value": "educational"},
        {"display_value": "Webinar", "actual_value": "webinar"},
        {"display_value": "Product Demo", "actual_value": "demo"},
        {"display_value": "Tutorial", "actual_value": "tutorial"},
        {"display_value": "Marketing", "actual_value": "marketing"}
      ]
    },
    {
      "field_label": "Tags",
      "data_type": "multiselectpicklist",
      "pick_list_values": [
        {"display_value": "Architecture", "actual_value": "architecture"},
        {"display_value": "Tutorial", "actual_value": "tutorial"},
        {"display_value": "Backend", "actual_value": "backend"},
        {"display_value": "API", "actual_value": "api"},
        {"display_value": "Integration", "actual_value": "integration"},
        {"display_value": "Demo", "actual_value": "demo"},
        {"display_value": "Screenshots", "actual_value": "screenshots"}
      ]
    },
    {
      "field_label": "Uploaded Date",
      "data_type": "datetime"
    },
    {
      "field_label": "File Size",
      "data_type": "text",
      "length": 20
    },
    {
      "field_label": "Gallery Images",
      "data_type": "textarea",
      "length": 2000,
      "textarea": {"type": "large"}
    }
  ]
}
```

### **4. Form Submissions Module Setup**

#### **Required Fields:**
```json
{
  "fields": [
    {
      "field_label": "Form Type",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "Contact", "actual_value": "contact"},
        {"display_value": "eBook", "actual_value": "ebook"},
        {"display_value": "Career", "actual_value": "careers"},
        {"display_value": "Newsletter", "actual_value": "newsletter"}
      ]
    },
    {
      "field_label": "Name",
      "data_type": "text",
      "length": 100
    },
    {
      "field_label": "Email",
      "data_type": "email",
      "length": 100
    },
    {
      "field_label": "Phone",
      "data_type": "phone",
      "length": 30
    },
    {
      "field_label": "Company",
      "data_type": "text",
      "length": 100
    },
    {
      "field_label": "Message",
      "data_type": "textarea",
      "length": 2000,
      "textarea": {"type": "large"}
    },
    {
      "field_label": "Position Applied",
      "data_type": "text",
      "length": 100
    },
    {
      "field_label": "Experience",
      "data_type": "text",
      "length": 50
    },
    {
      "field_label": "Skills",
      "data_type": "textarea",
      "length": 500,
      "textarea": {"type": "large"}
    },
    {
      "field_label": "Cover Letter",
      "data_type": "textarea",
      "length": 2000,
      "textarea": {"type": "large"}
    },
    {
      "field_label": "eBook Title",
      "data_type": "text",
      "length": 200
    },
    {
      "field_label": "Job Title",
      "data_type": "text",
      "length": 100
    },
    {
      "field_label": "Interests",
      "data_type": "multiselectpicklist",
      "pick_list_values": [
        {"display_value": "Technology", "actual_value": "technology"},
        {"display_value": "API Development", "actual_value": "api"},
        {"display_value": "Backend Development", "actual_value": "backend"},
        {"display_value": "Integration", "actual_value": "integration"},
        {"display_value": "Security", "actual_value": "security"}
      ]
    },
    {
      "field_label": "Submission Source",
      "data_type": "text",
      "length": 100
    },
    {
      "field_label": "Status",
      "data_type": "picklist",
      "pick_list_values": [
        {"display_value": "New", "actual_value": "new"},
        {"display_value": "In Progress", "actual_value": "in_progress"},
        {"display_value": "Completed", "actual_value": "completed"},
        {"display_value": "Closed", "actual_value": "closed"}
      ]
    },
    {
      "field_label": "Submission Date",
      "data_type": "datetime"
    },
    {
      "field_label": "IP Address",
      "data_type": "text",
      "length": 45
    },
    {
      "field_label": "reCAPTCHA Verified",
      "data_type": "boolean"
    }
  ]
}
```

## 🔧 **Step-by-Step Implementation Instructions**

### **Phase 1: Manual Setup via Zoho CRM UI**

1. **Login to Zoho CRM**
   - Go to your Zoho CRM dashboard
   - Navigate to Setup → Customization

2. **Create Each Module:**
   - Go to Modules → Create New Module
   - Use the configurations above for each module

3. **Add Custom Fields:**
   - For each module, go to Fields & Layout
   - Add all the fields specified above using the field configurations

### **Phase 2: Get Module IDs and API Names**

After creating the modules, you'll need to get their IDs:

1. **Go to Setup → Developer Space → APIs → API Names**
2. **Note down the API names and IDs for:**
   - Blogs module
   - Case_Studies module  
   - Media module
   - Form_Submissions module

### **Phase 3: Update Environment Variables**

Add these to your `.env` file:
```env
# Zoho CRM Module IDs
ZOHO_BLOGS_MODULE_ID=your_blogs_module_id
ZOHO_CASE_STUDIES_MODULE_ID=your_case_studies_module_id
ZOHO_MEDIA_MODULE_ID=your_media_module_id
ZOHO_FORM_SUBMISSIONS_MODULE_ID=your_form_submissions_module_id
```

## 🚀 **Next Steps**

1. **Create the modules in Zoho CRM** using the configurations above
2. **Test POST API endpoints** with real reCAPTCHA validation
3. **Replace sample data** in contentProcessor.js with real Zoho API calls
4. **Update form processors** to submit to the new Zoho modules

Would you like me to proceed with creating the API integration code that connects to these Zoho modules? 