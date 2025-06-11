const fetch = require('node-fetch');

class ZohoDataProcessor {
    constructor() {
        this.accessToken = process.env.ZOHO_ACCESS_TOKEN;
        this.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
        this.clientId = process.env.ZOHO_CLIENT_ID;
        this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
        this.baseUrl = 'https://www.zohoapis.in/crm/v8';
        this.modules = {
            // Content modules
            blogs: 'Blog',
            case_studies: 'Case_Study', 
            media: 'Medium',
            // Form submission modules - Updated organization
            contacts: 'Contacts',        // Contact form → Contacts module
            leads: 'Leads',             // eBook requests → Leads module  
            careers: 'Careers',         // Career applications → Custom Careers module
            newsletter: 'Newsletter'    // Newsletter → Custom Newsletter module
        };
    }

    // 🔄 Automatic Token Refresh
    async refreshAccessToken() {
        try {
            console.log('🔄 Refreshing Zoho access token...');
            
            const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `refresh_token=${this.refreshToken}&client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=refresh_token`
            });

            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            
            // 💾 Update .env file with new token
            await this.updateEnvFile(data.access_token);
            
            console.log('✅ Access token refreshed successfully and saved to .env');
            return data.access_token;
        } catch (error) {
            console.error('❌ Failed to refresh access token:', error);
            throw error;
        }
    }

    // 💾 Update .env file with new access token
    async updateEnvFile(newAccessToken) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const envPath = path.join(process.cwd(), '.env');
            const envContent = await fs.readFile(envPath, 'utf8');
            
            // Replace the access token line
            const updatedContent = envContent.replace(
                /ZOHO_ACCESS_TOKEN=.*/,
                `ZOHO_ACCESS_TOKEN=${newAccessToken}`
            );
            
            await fs.writeFile(envPath, updatedContent);
            console.log('💾 Updated .env file with new access token');
        } catch (error) {
            console.error('❌ Failed to update .env file:', error);
            // Don't throw error - token refresh still worked in memory
        }
    }

    // 🔄 Generic Zoho API Request Handler with Auto-Refresh
    async makeZohoRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {
                'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            };

            const response = await fetch(url, {
                method: options.method || 'GET',
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            // If 401 Unauthorized, try refreshing token and retry once
            if (response.status === 401) {
                console.log('🔄 Access token expired, refreshing...');
                await this.refreshAccessToken();
                
                // Retry the request with new token
                const retryHeaders = {
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                };

                const retryResponse = await fetch(url, {
                    method: options.method || 'GET',
                    headers: retryHeaders,
                    body: options.body ? JSON.stringify(options.body) : undefined
                });

                if (!retryResponse.ok) {
                    throw new Error(`Zoho API Error: ${retryResponse.status} ${retryResponse.statusText}`);
                }

                return await retryResponse.json();
            }

            if (!response.ok) {
                throw new Error(`Zoho API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // 📖 Fetch Blogs from Zoho CRM
    async getBlogs(filters = {}) {
        try {
            let endpoint = `/${this.modules.blogs}`;
            const queryParams = [];

            // Add required fields parameter - Updated to include the actual field name from user's Zoho setup
            queryParams.push('fields=Blog_Title,Blog_Slug,Content,Author,Excerpt,Published_Date,Category,Category_Type,Tags,featuredImage,Read_Time_Minutes,Meta_Description,Status');

            // Add pagination
            if (filters.page && filters.limit) {
                const offset = (filters.page - 1) * filters.limit;
                queryParams.push(`page=${filters.page}`);
                queryParams.push(`per_page=${filters.limit}`);
            }

            // Add category filter
            if (filters.category) {
                queryParams.push(`criteria=Category:equals:${filters.category}`);
            }

            // Add tag filter  
            if (filters.tag) {
                queryParams.push(`criteria=Tags:contains:${filters.tag}`);
            }

            // Add status filter (only published) - TEMPORARILY DISABLED FOR TESTING
            // queryParams.push(`criteria=Status:equals:published`);

            if (queryParams.length > 0) {
                endpoint += `?${queryParams.join('&')}`;
            }

            const response = await this.makeZohoRequest(endpoint);
            
            return {
                blogs: response.data ? response.data.map(blog => this.transformBlogData(blog)) : [],
                total: response.info ? response.info.count : 0,
                page: filters.page || 1,
                totalPages: response.info ? Math.ceil(response.info.count / (filters.limit || 10)) : 1
            };
        } catch (error) {
            // If it's a 400 Bad Request, throw a specific error for missing module
            if (error.message && error.message.includes('400 Bad Request')) {
                throw new Error('Blog module not found in Zoho CRM');
            }
            
            console.error('❌ Error fetching blogs from Zoho:', error);
            return { blogs: [], total: 0, page: 1, totalPages: 1 };
        }
    }

    // 📖 Fetch Single Blog by Slug
    async getBlogBySlug(slug) {
        try {
            // Properly encode the criteria for Zoho API
            const criteria = `Blog_Slug:equals:${encodeURIComponent(slug)}`;
            const endpoint = `/${this.modules.blogs}?criteria=${encodeURIComponent(criteria)}&fields=Blog_Title,Blog_Slug,Content,Author,Excerpt,Published_Date,Category,Category_Type,Tags,featuredImage,Read_Time_Minutes,Meta_Description,Status`;
            
            const response = await this.makeZohoRequest(endpoint);
            
            if (response.data && response.data.length > 0) {
                return this.transformBlogData(response.data[0]);
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching blog by slug:', error);
            return null;
        }
    }

    // 📊 Fetch Case Studies from Zoho CRM
    async getCaseStudies(filters = {}) {
        try {
            let endpoint = `/${this.modules.case_studies}`;
            const queryParams = [];

            // Add required fields parameter
            queryParams.push('fields=Case_Study_Title,Case_Study_Slug,Client_Name,Industry,Challenge,Solution,Performance_Improvement,Cost_Reduction,Development_Time_Saved,Other_Results,Technologies_Used,Timeline,Featured_Image_URL,Published_Date,Status');

            if (filters.page && filters.limit) {
                queryParams.push(`page=${filters.page}`);
                queryParams.push(`per_page=${filters.limit}`);
            }

            if (filters.industry) {
                queryParams.push(`criteria=Industry:equals:${filters.industry}`);
            }

            // Temporarily disable status filter for testing
            // queryParams.push(`criteria=Status:equals:published`);

            if (queryParams.length > 0) {
                endpoint += `?${queryParams.join('&')}`;
            }

            const response = await this.makeZohoRequest(endpoint);
            
            return {
                caseStudies: response.data ? response.data.map(caseStudy => this.transformCaseStudyData(caseStudy)) : [],
                total: response.info ? response.info.count : 0,
                page: filters.page || 1,
                totalPages: response.info ? Math.ceil(response.info.count / (filters.limit || 10)) : 1
            };
        } catch (error) {
            // If it's a 400 Bad Request, throw a specific error for missing module
            if (error.message && error.message.includes('400 Bad Request')) {
                throw new Error('Case Studies module not found in Zoho CRM');
            }
            
            console.error('❌ Error fetching case studies from Zoho:', error);
            return { caseStudies: [], total: 0, page: 1, totalPages: 1 };
        }
    }

    // 📊 Fetch Single Case Study by Slug
    async getCaseStudyBySlug(slug) {
        try {
            const endpoint = `/${this.modules.case_studies}?criteria=Case_Study_Slug:equals:${slug}`;
            const response = await this.makeZohoRequest(endpoint);
            
            if (response.data && response.data.length > 0) {
                return this.transformCaseStudyData(response.data[0]);
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching case study by slug:', error);
            return null;
        }
    }

    // 🎬 Fetch Media from Zoho CRM
    async getMedia(filters = {}) {
        try {
            let endpoint = `/${this.modules.media}`;
            const queryParams = [];

            // Add required fields parameter
            queryParams.push('fields=Media_Title,Media_Type,Media_URL,Thumbnail_URL,Description,Duration_Seconds,Category,Tags,Uploaded_Date,File_Size,Gallery_Images,Status');

            if (filters.page && filters.limit) {
                queryParams.push(`page=${filters.page}`);
                queryParams.push(`per_page=${filters.limit}`);
            }

            if (filters.type) {
                queryParams.push(`criteria=Media_Type:equals:${filters.type}`);
            }

            if (filters.category) {
                queryParams.push(`criteria=Category:equals:${filters.category}`);
            }

            // Temporarily disable status filter for testing  
            // queryParams.push(`criteria=Status:equals:published`);

            if (queryParams.length > 0) {
                endpoint += `?${queryParams.join('&')}`;
            }

            const response = await this.makeZohoRequest(endpoint);
            
            return {
                media: response.data ? response.data.map(mediaItem => this.transformMediaData(mediaItem)) : [],
                total: response.info ? response.info.count : 0,
                page: filters.page || 1,
                totalPages: response.info ? Math.ceil(response.info.count / (filters.limit || 10)) : 1
            };
        } catch (error) {
            // If it's a 400 Bad Request, throw a specific error for missing module
            if (error.message && error.message.includes('400 Bad Request')) {
                throw new Error('Media module not found in Zoho CRM');
            }
            
            console.error('❌ Error fetching media from Zoho:', error);
            return { media: [], total: 0, page: 1, totalPages: 1 };
        }
    }

    // 🎬 Fetch Single Media by Slug/ID
    async getMediaBySlug(identifier) {
        try {
            // Properly encode the criteria for Zoho API
            // Try different field possibilities for media identification
            const criteria = `Media_Title:equals:${encodeURIComponent(identifier)}`;
            const endpoint = `/${this.modules.media}?criteria=${encodeURIComponent(criteria)}&fields=Media_Title,Media_Type,Media_URL,Thumbnail_URL,Description,Duration_Seconds,Category,Tags,Uploaded_Date,File_Size,Gallery_Images,Status`;
            
            const response = await this.makeZohoRequest(endpoint);
            
            if (response.data && response.data.length > 0) {
                return this.transformMediaData(response.data[0]);
            }
            
            // If not found by title, try by ID
            if (!response.data || response.data.length === 0) {
                try {
                    const idEndpoint = `/${this.modules.media}/${encodeURIComponent(identifier)}?fields=Media_Title,Media_Type,Media_URL,Thumbnail_URL,Description,Duration_Seconds,Category,Tags,Uploaded_Date,File_Size,Gallery_Images,Status`;
                    const idResponse = await this.makeZohoRequest(idEndpoint);
                    
                    if (idResponse.data && idResponse.data.length > 0) {
                        return this.transformMediaData(idResponse.data[0]);
                    }
                } catch (idError) {
                    // ID lookup failed, continue to return null
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error fetching media by identifier:', error);
            return null;
        }
    }

    // 📝 Submit Form Data to Zoho CRM (routing to appropriate modules)
    async submitFormData(formData, formType) {
        try {
            let submissionData;
            let targetModule;

            switch (formType) {
                case 'contacts':
                    targetModule = this.modules.contacts;
                    submissionData = {
                        data: [{
                            First_Name: formData.firstName,
                            Last_Name: formData.lastName,
                            Account_Name: formData.organisation,
                            Type_of_Organisation: formData.typeOfOrganisation,
                            Mailing_Country: formData.country,
                            Phone: formData.phoneNumber || '',
                            Email: formData.email,
                            Description: formData.message,
                            Lead_Source: 'NEXUS Contact Form',
                            Privacy_Policy_Accepted: formData.privacyPolicy ? 'Yes' : 'No'
                        }]
                    };
                    break;

                case 'ebook':
                    targetModule = this.modules.leads;
                    submissionData = {
                        data: [{
                            First_Name: formData.firstName,
                            Last_Name: formData.lastName,
                            Email: formData.email,
                            Company: formData.nameOfOrganisation,
                            Lead_Source: 'NEXUS eBook Download',
                            Lead_Status: 'Not Contacted',
                            Mailing_Country: formData.country,
                            Description: `eBook Download Request\nOrganisation: ${formData.nameOfOrganisation}\nCountry: ${formData.country}`,
                            Privacy_Policy_Accepted: formData.privacyPolicy ? 'Yes' : 'No'
                        }]
                    };
                    break;

                case 'careers':
                    targetModule = this.modules.careers;
                    submissionData = {
                        data: [{
                            Full_Name: formData.fullname,
                            Email: formData.emailid,
                            Mobile: formData.mobile,
                            Job_Title: formData.jobTitle,
                            CV_Upload: formData.cvUpload || 'Pending', // File upload handling needed
                            Application_Source: 'NEXUS Career Portal',
                            Application_Status: 'New Application',
                            Application_Date: new Date().toISOString().split('T')[0]
                        }]
                    };
                    break;

                case 'newsletters':
                    targetModule = this.modules.newsletter;
                    submissionData = {
                        data: [{
                            Email: formData.emailId,
                            Subscription_Date: new Date().toISOString().split('T')[0],
                            Subscription_Source: 'NEXUS Newsletter',
                            Status: 'Active'
                        }]
                    };
                    break;

                default:
                    throw new Error(`Unknown form type: ${formType}`);
            }

            const response = await this.makeZohoRequest(`/${targetModule}`, {
                method: 'POST',
                body: submissionData
            });

            return {
                success: true,
                id: response.data[0].details.id,
                message: `Form submitted successfully to ${targetModule}`,
                module: targetModule
            };
        } catch (error) {
            console.error(`❌ Error submitting ${formType} form to Zoho:`, error);
            
            // If it's a 400 Bad Request for custom modules, provide helpful error
            if (error.message && error.message.includes('400 Bad Request') && 
                (formType === 'careers' || formType === 'newsletters')) {
                return {
                    success: false,
                    error: `${formType === 'careers' ? 'Careers' : 'Newsletter'} module not created in Zoho CRM yet. Please create the custom module first.`,
                    moduleRequired: formType === 'careers' ? 'Careers' : 'Newsletter'
                };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🔄 Data Transformation Methods
    transformBlogData(rawBlog) {
        // Simple image handling using the new featuredImage field
        const processedImageUrl = this.processImageUrl(rawBlog.featuredImage);
        const hasImage = !!processedImageUrl;

        const transformed = {
            id: rawBlog.id,
            title: rawBlog.Blog_Title || rawBlog.Blog || 'Untitled',
            slug: rawBlog.Blog_Slug,
            excerpt: rawBlog.Excerpt,
            content: rawBlog.Content,
            author: rawBlog.Author ? (typeof rawBlog.Author === 'object' ? rawBlog.Author.name : rawBlog.Author) : 'Anonymous',
            publishedAt: rawBlog.Published_Date,
            category: rawBlog.Category,
            categoryType: rawBlog.Category_Type, // New picklist field
            tags: rawBlog.Tags ? rawBlog.Tags.split(',').map(tag => tag.trim()) : [],
            featuredImage: processedImageUrl,
            readTime: rawBlog.Read_Time_Minutes || 5,
            metaDescription: rawBlog.Meta_Description,
            // Additional image-related fields
            hasImage: hasImage,
            imageAlt: rawBlog.Blog_Title || 'Blog image', // Use title as alt text fallback
            status: rawBlog.Status || 'draft'
        };
        
        return transformed;
    }

    // 🖼️ Enhanced Image URL Processing
    processImageUrl(imageUrl) {
        // Return null if no image URL provided
        if (!imageUrl) {
            return null;
        }

        // Handle Image Upload field (when imageUrl is an object or array)
        if (typeof imageUrl === 'object') {
            if (Array.isArray(imageUrl) && imageUrl.length > 0) {
                // Array of image objects (Zoho Image Upload format)
                const firstImage = imageUrl[0];
                if (typeof firstImage === 'string') {
                    imageUrl = firstImage;
                } else if (firstImage && (firstImage.File_Name__s || firstImage.File_Id__s || firstImage.Preview_Id__s || firstImage.file_name || firstImage.download_url || firstImage.url)) {
                    // Zoho-specific field names or generic field names
                    if (firstImage.File_Id__s) {
                        // Construct Zoho download URL using File_Id__s
                        imageUrl = `https://www.zohoapis.in/crm/v8/files/${firstImage.File_Id__s}/content`;
                    } else {
                        imageUrl = firstImage.File_Name__s || firstImage.File_Id__s || firstImage.Preview_Id__s || firstImage.file_name || firstImage.download_url || firstImage.url;
                    }
                } else {
                    return null;
                }
            } else if (imageUrl.File_Name__s || imageUrl.File_Id__s || imageUrl.Preview_Id__s || imageUrl.file_name || imageUrl.download_url || imageUrl.url) {
                // Single image object (Zoho or generic format)
                if (imageUrl.File_Id__s) {
                    // Construct Zoho download URL using File_Id__s
                    imageUrl = `https://www.zohoapis.in/crm/v8/files/${imageUrl.File_Id__s}/content`;
                } else {
                    imageUrl = imageUrl.File_Name__s || imageUrl.File_Id__s || imageUrl.Preview_Id__s || imageUrl.file_name || imageUrl.download_url || imageUrl.url;
                }
            } else {
                return null;
            }
        }

        // Now imageUrl should be a string, but let's be safe
        if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
            return null;
        }

        // Clean up the URL
        const cleanUrl = imageUrl.trim();
        
        // Validate URL format (allow both URLs and filenames)
        if (!this.isValidImageUrl(cleanUrl)) {
            console.warn('⚠️ Invalid image URL detected:', cleanUrl);
            return null;
        }

        // Return the processed URL with optimization parameters if needed
        return this.optimizeImageUrl(cleanUrl);
    }

    // 🔍 Validate Image URL
    isValidImageUrl(url) {
        try {
            // Check if it's a filename with image extension
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
            const lowercaseUrl = url.toLowerCase();
            
            // Check for image extension in filename
            const hasImageExtension = imageExtensions.some(ext => lowercaseUrl.endsWith(ext));
            
            // If it has an image extension, it's valid (could be a filename)
            if (hasImageExtension) {
                return true;
            }
            
            // Try to parse as URL
            new URL(url);
            
            // Check if it's an image file or common image hosting patterns
            const isImageHost = lowercaseUrl.includes('imgur.com') || 
                               lowercaseUrl.includes('cloudinary.com') ||
                               lowercaseUrl.includes('unsplash.com') ||
                               lowercaseUrl.includes('pixabay.com') ||
                               lowercaseUrl.includes('zoho.') ||
                               lowercaseUrl.includes('zohoapis.in') ||
                               lowercaseUrl.includes('amazonaws.com');
                               
            return hasImageExtension || isImageHost || lowercaseUrl.includes('image');
        } catch (error) {
            // If URL parsing fails, check if it's just a filename with extension
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
            const lowercaseUrl = url.toLowerCase();
            return imageExtensions.some(ext => lowercaseUrl.endsWith(ext));
        }
    }

    // ⚡ Optimize Image URL (optional - for CDN or resizing)
    optimizeImageUrl(url) {
        // For now, return as-is, but you can add optimization logic here
        // Example: Add query parameters for resizing, format conversion, etc.
        
        // Future enhancement: Add CDN optimization
        // if (url.includes('your-cdn-domain.com')) {
        //     return `${url}?w=800&f=webp&q=80`; // Resize, convert to WebP, 80% quality
        // }
        
        return url;
    }

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
            featuredImage: this.processImageUrl(rawCaseStudy.Featured_Image_URL),
            publishedAt: rawCaseStudy.Published_Date,
            // Additional image-related fields
            hasImage: !!rawCaseStudy.Featured_Image_URL,
            imageAlt: rawCaseStudy.Case_Study_Title || 'Case study image',
            status: rawCaseStudy.Status || 'draft'
        };
    }

    transformMediaData(rawMedia) {
        return {
            id: rawMedia.id,
            title: rawMedia.Media_Title,
            type: rawMedia.Media_Type,
            url: this.processImageUrl(rawMedia.Media_URL), // Process main media URL
            thumbnail: this.processImageUrl(rawMedia.Thumbnail_URL), // Process thumbnail URL
            description: rawMedia.Description,
            duration: rawMedia.Duration_Seconds,
            category: rawMedia.Category,
            tags: rawMedia.Tags ? rawMedia.Tags.split(',').map(tag => tag.trim()) : [],
            uploadedAt: rawMedia.Uploaded_Date,
            fileSize: rawMedia.File_Size,
            galleryImages: this.processGalleryImages(rawMedia.Gallery_Images),
            // Additional media-related fields
            hasMainImage: !!rawMedia.Media_URL,
            hasThumbnail: !!rawMedia.Thumbnail_URL,
            hasGallery: !!(rawMedia.Gallery_Images && rawMedia.Gallery_Images.trim()),
            imageAlt: rawMedia.Media_Title || 'Media image'
        };
    }

    // 🖼️ Process Gallery Images (for media module)
    processGalleryImages(galleryImagesString) {
        if (!galleryImagesString || galleryImagesString.trim() === '') {
            return [];
        }

        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(galleryImagesString);
            if (Array.isArray(parsed)) {
                return parsed.map(url => this.processImageUrl(url)).filter(url => url !== null);
            }
        } catch (error) {
            // If JSON parsing fails, treat as comma-separated URLs
            const urls = galleryImagesString.split(',').map(url => url.trim());
            return urls.map(url => this.processImageUrl(url)).filter(url => url !== null);
        }

        return [];
    }

    // 🔍 Health Check for Zoho Connection
    async healthCheck() {
        try {
            const response = await this.makeZohoRequest('/settings/modules');
            return {
                status: 'connected',
                message: 'Zoho CRM connection successful',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'disconnected',
                message: 'Zoho CRM connection failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = ZohoDataProcessor; 