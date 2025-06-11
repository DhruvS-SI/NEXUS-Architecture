# 🔧 Zoho CRM Fields Management Guide

## Overview

When you add new fields to your Zoho CRM modules, you need to update the NEXUS backend code to utilize these fields. This guide covers all the necessary steps and locations where updates are required.

---

## 📖 **For GET Operations (Reading Data from Zoho)**

### Step 1: Update Field Lists in API Calls

**File**: `processors/zohoDataProcessor.js`

**Location**: In each `get` method, find the `fields` parameter and add your new fields.

#### Example: Adding fields to Blog module

```javascript
// BEFORE - Current Blog fields
queryParams.push('fields=Blog_Title,Blog_Slug,Content,Author,Excerpt,Published_Date,Category,Tags,Featured_Image_URL,Read_Time_Minutes,Meta_Description,Status');

// AFTER - Adding new fields: Blog_Views, SEO_Keywords, Reading_Difficulty
queryParams.push('fields=Blog_Title,Blog_Slug,Content,Author,Excerpt,Published_Date,Category,Tags,Featured_Image_URL,Read_Time_Minutes,Meta_Description,Status,Blog_Views,SEO_Keywords,Reading_Difficulty');
```

#### Example: Adding fields to Case Studies module

```javascript
// BEFORE
queryParams.push('fields=Case_Study_Title,Case_Study_Slug,Client_Name,Industry,Challenge,Solution,Performance_Improvement,Cost_Reduction,Development_Time_Saved,Other_Results,Technologies_Used,Timeline,Featured_Image_URL,Published_Date,Status');

// AFTER - Adding: Project_Duration, Team_Size, Budget_Range
queryParams.push('fields=Case_Study_Title,Case_Study_Slug,Client_Name,Industry,Challenge,Solution,Performance_Improvement,Cost_Reduction,Development_Time_Saved,Other_Results,Technologies_Used,Timeline,Featured_Image_URL,Published_Date,Status,Project_Duration,Team_Size,Budget_Range');
```

### Step 2: Update Data Transformation Methods

**File**: `processors/zohoDataProcessor.js`

**Location**: Find the `transform` methods and add your new fields to the returned object.

#### Example: Blog transformation

```javascript
transformBlogData(rawBlog) {
    return {
        id: rawBlog.id,
        title: rawBlog.Blog_Title || rawBlog.Blog || 'Untitled',
        slug: rawBlog.Blog_Slug,
        excerpt: rawBlog.Excerpt,
        content: rawBlog.Content,
        author: rawBlog.Author ? (typeof rawBlog.Author === 'object' ? rawBlog.Author.name : rawBlog.Author) : 'Anonymous',
        publishedAt: rawBlog.Published_Date,
        category: rawBlog.Category,
        tags: rawBlog.Tags ? rawBlog.Tags.split(',').map(tag => tag.trim()) : [],
        featuredImage: rawBlog.Featured_Image_URL,
        readTime: rawBlog.Read_Time_Minutes || 5,
        metaDescription: rawBlog.Meta_Description,
        
        // ✅ NEW FIELDS ADDED
        views: rawBlog.Blog_Views || 0,
        seoKeywords: rawBlog.SEO_Keywords ? rawBlog.SEO_Keywords.split(',').map(kw => kw.trim()) : [],
        difficulty: rawBlog.Reading_Difficulty || 'intermediate'
    };
}
```

#### Example: Case Study transformation

```javascript
transformCaseStudyData(rawCaseStudy) {
    return {
        id: rawCaseStudy.id,
        title: rawCaseStudy.Case_Study_Title,
        slug: rawCaseStudy.Case_Study_Slug,
        client: rawCaseStudy.Client_Name,
        industry: rawCaseStudy.Industry,
        challenge: rawCaseStudy.Challenge,
        solution: rawCaseStudy.Solution,
        results: {
            performance: rawCaseStudy.Performance_Improvement,
            cost: rawCaseStudy.Cost_Reduction,
            time: rawCaseStudy.Development_Time_Saved,
            other: rawCaseStudy.Other_Results
        },
        technologies: rawCaseStudy.Technologies_Used ? rawCaseStudy.Technologies_Used.split(',').map(tech => tech.trim()) : [],
        timeline: rawCaseStudy.Timeline,
        featuredImage: rawCaseStudy.Featured_Image_URL,
        publishedAt: rawCaseStudy.Published_Date,
        
        // ✅ NEW FIELDS ADDED
        projectDuration: rawCaseStudy.Project_Duration || 'Not specified',
        teamSize: rawCaseStudy.Team_Size || 'Not specified',
        budgetRange: rawCaseStudy.Budget_Range || 'Confidential'
    };
}
```

---

## 📝 **For POST Operations (Writing Data to Zoho)**

### Step 1: Update Form Submission Data

**File**: `processors/zohoDataProcessor.js`

**Method**: `submitFormData()`

#### Example: Adding fields to Leads module

```javascript
async submitFormData(formData, formType) {
    try {
        const submissionData = {
            data: [{
                Last_Name: formData.name || formData.lastName || 'Unknown',
                First_Name: formData.firstName || '',
                Email: formData.email,
                Phone: formData.phone || '',
                Company: formData.company || '',
                Lead_Source: `NEXUS API - ${formType}`,
                Description: formData.message || formData.description || '',
                
                // ✅ NEW FIELDS ADDED
                Lead_Status: formData.leadStatus || 'New',
                Website: formData.website || '',
                Annual_Revenue: formData.annualRevenue || '',
                No_of_Employees: formData.employeeCount || '',
                Industry: formData.industry || '',
                Lead_Owner: formData.assignedTo || 'Auto-Assigned',
                
                // Conditional fields based on form type
                ...(formType === 'careers' && {
                    Description: `Position Applied: ${formData.position || 'Not specified'}\nExperience: ${formData.experience || 'Not specified'}\nSkills: ${formData.skills || 'Not specified'}\nCover Letter: ${formData.coverLetter || 'Not provided'}\n\nMessage: ${formData.message || ''}`
                }),
                ...(formType === 'ebook' && {
                    Description: `eBook Download: ${formData.ebookTitle || 'Not specified'}\nJob Title: ${formData.jobTitle || 'Not specified'}\n\nMessage: ${formData.message || ''}`
                })
            }]
        };
        
        // Rest of the method...
    }
}
```

### Step 2: Update Form Validation (Optional)

**File**: `processors/formsProcessor.js`

**Methods**: `validateContactForm()`, `validateEbookRequest()`, etc.

#### Example: Adding validation for new fields

```javascript
validateContactForm(data) {
    const errors = [];
    
    // Existing validations...
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
        errors.push('Valid email address is required');
    }
    
    // ✅ NEW FIELD VALIDATIONS
    if (data.website && !this.isValidURL(data.website)) {
        errors.push('Invalid website URL format');
    }
    
    if (data.employeeCount && (isNaN(data.employeeCount) || data.employeeCount < 0)) {
        errors.push('Employee count must be a positive number');
    }
    
    if (data.annualRevenue && isNaN(data.annualRevenue)) {
        errors.push('Annual revenue must be a number');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ✅ ADD NEW VALIDATION HELPER METHODS
isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
```

---

## 🔄 **Complete Example: Adding a New Field**

Let's say you want to add a `Blog_Views` field to track blog post views.

### Step 1: Add to Zoho CRM
1. Go to Zoho CRM → Settings → Customization → Modules and Fields
2. Select "Blog" module
3. Add new field: `Blog_Views` (Number type)

### Step 2: Update Backend Code

#### A. Update field list in `zohoDataProcessor.js`
```javascript
// Line ~135 in getBlogs method
queryParams.push('fields=Blog_Title,Blog_Slug,Content,Author,Excerpt,Published_Date,Category,Tags,Featured_Image_URL,Read_Time_Minutes,Meta_Description,Status,Blog_Views');
```

#### B. Update transformation in `zohoDataProcessor.js`
```javascript
// Line ~357 in transformBlogData method
transformBlogData(rawBlog) {
    return {
        // ... existing fields ...
        readTime: rawBlog.Read_Time_Minutes || 5,
        metaDescription: rawBlog.Meta_Description,
        views: rawBlog.Blog_Views || 0  // ✅ NEW FIELD
    };
}
```

### Step 3: Test the changes
```bash
curl http://localhost:3000/api/blogs
```

The response should now include the `views` field:
```json
{
  "id": "934282000000424462",
  "title": "Getting Started with NEXUS",
  "slug": "getting-started-nexus-backend",
  "views": 150,
  "readTime": 5
}
```

---

## 📊 **Field Mapping Reference**

### Current Field Mappings

#### Blogs Module
| Zoho Field | API Response Field | Type |
|------------|-------------------|------|
| `Blog_Title` | `title` | String |
| `Blog_Slug` | `slug` | String |
| `Content` | `content` | String |
| `Author` | `author` | String |
| `Blog_Views` | `views` | Number |

#### Leads Module (Forms)
| Zoho Field | Form Input | Type |
|------------|------------|------|
| `Last_Name` | `name` | String |
| `Email` | `email` | String |
| `Phone` | `phone` | String |
| `Company` | `company` | String |
| `Lead_Source` | Auto-generated | String |

---

## 🚀 **Best Practices**

### 1. Field Naming Convention
- **Zoho**: Use snake_case with Capital first letters (`Blog_Title`, `Lead_Source`)
- **API**: Use camelCase (`title`, `leadSource`)

### 2. Handle Missing Data
Always provide fallback values:
```javascript
views: rawBlog.Blog_Views || 0,
category: rawBlog.Category || 'Uncategorized',
tags: rawBlog.Tags ? rawBlog.Tags.split(',') : []
```

### 3. Data Type Conversion
Convert Zoho data types appropriately:
```javascript
// Number fields
views: parseInt(rawBlog.Blog_Views) || 0,

// Date fields  
publishedAt: rawBlog.Published_Date ? new Date(rawBlog.Published_Date) : null,

// Array fields (comma-separated)
tags: rawBlog.Tags ? rawBlog.Tags.split(',').map(tag => tag.trim()) : [],

// Boolean fields
isPublished: rawBlog.Status === 'Published'
```

### 4. Validation for New Fields
Add appropriate validation for new fields:
```javascript
// In form processors
if (data.newField && data.newField.length > 100) {
    errors.push('New field must be less than 100 characters');
}
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### 1. Field Not Appearing in API Response
**Problem**: Added field to Zoho but not showing in API response  
**Solution**: 
- Check if field is added to the `fields` parameter in API call
- Verify field name spelling matches exactly
- Ensure field is added to transformation method

#### 2. Validation Errors on Form Submission
**Problem**: Getting validation errors for new fields  
**Solution**:
- Check if validation rules in form processor are too strict
- Verify field mapping in `submitFormData` method
- Ensure field exists in Zoho CRM module

#### 3. Data Type Mismatch
**Problem**: Getting unexpected data types  
**Solution**:
- Add proper type conversion in transformation methods
- Handle null/undefined values with fallbacks
- Validate data types before sending to Zoho

### Debug Steps

1. **Check Zoho API Response**:
   Add temporary logging to see raw Zoho data:
   ```javascript
   console.log('🔍 Raw Zoho Response:', response.data);
   ```

2. **Verify Field Names**:
   Log field names to ensure they match:
   ```javascript
   console.log('🔍 Available fields:', Object.keys(response.data[0]));
   ```

3. **Test Individual Fields**:
   Test new fields one at a time to isolate issues.

---

## 📞 **Support**

If you encounter issues:

1. **Check Zoho API Documentation**: [Zoho CRM API Fields](https://www.zoho.com/crm/developer/docs/api/v2/field-meta.html)
2. **Validate Field Permissions**: Ensure API user has access to new fields
3. **Test with Postman**: Verify API calls work outside of NEXUS
4. **Check Server Logs**: Look for specific error messages

---

## 🔄 **Quick Reference Checklist**

When adding a new field to any Zoho module:

- [ ] Field added to Zoho CRM module
- [ ] Field added to `fields` parameter in API call
- [ ] Field added to transformation method with appropriate data handling
- [ ] Validation added (if needed for POST operations)
- [ ] API response tested
- [ ] Error handling verified
- [ ] Documentation updated

---

**Last Updated**: December 2024  
**NEXUS Version**: 1.0.0  
**Zoho CRM API**: v2 