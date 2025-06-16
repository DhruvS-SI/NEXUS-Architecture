// pathways/apiPathways.js - Updated for Zoho CRM Integration
const FormsProcessor = require('../processors/formsProcessor');
const ContentProcessor = require('../processors/contentProcessor');
// const { cacheBuster } = require('../utilities/cacheBuster'); // Disabled for now

// Initialize processors
const formsProcessor = new FormsProcessor();
const contentProcessor = new ContentProcessor();

async function registerApiPathways(nexusCore) {
    
    // 🎯 UNIFIED FORM SUBMISSION ENDPOINT
    nexusCore.post('/api/submit', async (request, reply) => {
        try {
            let formData;
            // Check if the request is multipart (file upload)
            if (request.isMultipart()) {
                formData = {};
                const parts = request.parts();
                for await (const part of parts) {
                    if (part.file) {
                        // Only support one file (cvUpload)
                        formData.cvUpload = {
                            filename: part.filename,
                            mimetype: part.mimetype,
                            buffer: await part.toBuffer(),
                            size: part.file.truncated ? part.file.bytesRead : part.file.size
                        };
                    } else {
                        formData[part.fieldname] = part.value;
                    }
                }
            } else {
                // JSON or urlencoded
                formData = request.body;
            }

            const result = await formsProcessor.processUnifiedForm(formData);
            
            if (result.success) {
                return reply.status(200).send({
                    status: 200,
                    success: true,
                    message: result.message,
                    data: {
                        submissionId: result.submissionId,
                        zohoRecordId: result.zohoRecordId,
                        module: result.module
                    },
                    timestamp: new Date().toISOString()
                });
            } else {
                return reply.status(result.statusCode || 400).send({
                    status: result.statusCode || 400,
                    success: false,
                    error: result.error,
                    details: result.details,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ Unified form submission API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Internal server error',
                message: 'Failed to process form submission',
                timestamp: new Date().toISOString()
            });
        }
    });

    nexusCore.post('/api/cookie-consent', async (request, reply) => {
        try {
            const { 
                allowCookie, 
                ipaddress, 
                privacy_version, 
                terms_conditions_version, 
                cookies_policy_version 
            } = request.body;
            
            // Validate allowCookie parameter
            if (allowCookie === undefined || allowCookie === null) {
                return reply.status(400).send({
                    status: 400,
                    success: false,
                    error: 'Missing allowCookie parameter',
                    message: 'allowCookie parameter is required (0 or 1)',
                    timestamp: new Date().toISOString()
                });
            }

            // Convert to number and validate allowCookie
            const cookieValue = parseInt(allowCookie);
            if (cookieValue !== 0 && cookieValue !== 1) {
                return reply.status(400).send({
                    status: 400,
                    success: false,
                    error: 'Invalid allowCookie value',
                    message: 'allowCookie must be 0 (deny) or 1 (allow)',
                    timestamp: new Date().toISOString()
                });
            }

            // Validate required configuration fields
            const requiredFields = {
                ipaddress,
                privacy_version,
                terms_conditions_version,
                cookies_policy_version
            };

            const missingFields = [];
            for (const [key, value] of Object.entries(requiredFields)) {
                if (value === undefined || value === null || value === '') {
                    missingFields.push(key);
                }
            }

            if (missingFields.length > 0) {
                return reply.status(400).send({
                    status: 400,
                    success: false,
                    error: 'Missing required fields',
                    message: `The following fields are required: ${missingFields.join(', ')}`,
                    missingFields: missingFields,
                    timestamp: new Date().toISOString()
                });
            }

            // Store the configuration from request
            const consentConfig = {
                ipaddress: ipaddress.toString(),
                privacy_version: privacy_version.toString(),
                terms_conditions_version: terms_conditions_version.toString(),
                cookies_policy_version: cookies_policy_version.toString()
            };

            // Environment-aware cookie configuration
            const isProduction = process.env.NODE_ENV === 'production';
            const isStaging = process.env.NODE_ENV === 'staging';
            const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

            // Set cookie for 1 year (365 days) with environment-specific options
            const cookieOptions = {
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
                httpOnly: false, // Allow frontend JavaScript access
                secure: isProduction || isStaging, // HTTPS in production/staging, HTTP in development
                sameSite: isProduction ? 'strict' : 'lax', // Stricter in production
                path: '/', // Available for entire domain
                // Domain configuration based on environment
                ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
            };

            // Set the allowCookie cookie
            reply.setCookie('allowCookie', cookieValue.toString(), cookieOptions);

            // Prepare response based on user choice
            if (cookieValue === 1) {
                return reply.status(200).send({
                    status: 200,
                    success: true,
                    message: 'Cookie consent granted successfully',
                    data: {
                        allowCookie: 1,
                        action: 'consent_granted',
                        cookieExpiry: '1 year',
                        consentConfig: consentConfig
                    },
                    timestamp: new Date().toISOString()
                });
            } else {
                return reply.status(200).send({
                    status: 200,
                    success: true,
                    message: 'Cookie consent denied successfully',
                    data: {
                        allowCookie: 0,
                        action: 'consent_denied',
                        cookieExpiry: '1 year',
                        consentConfig: consentConfig
                    },
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('❌ Cookie consent API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Internal server error',
                message: 'Failed to process cookie consent',
                timestamp: new Date().toISOString()
            });
        }
    });

    // 🍪 GET COOKIE CONSENT STATUS
    nexusCore.get('/api/cookie-consent', async (request, reply) => {
        try {
            const allowCookie = request.cookies.allowCookie;
            
            // Static configuration
            const staticConfig = {
                ipaddress: "1",
                privacy_version: "1",
                terms_conditions_version: "1", 
                cookies_policy_version: "1"
            };

            if (allowCookie === undefined) {
                return reply.status(200).send({
                    status: 200,
                    success: true,
                    message: 'No cookie consent found',
                    data: {
                        allowCookie: null,
                        action: 'no_consent_set',
                        staticConfig: staticConfig
                    },
                    timestamp: new Date().toISOString()
                });
            }

            const cookieValue = parseInt(allowCookie);
            return reply.status(200).send({
                status: 200,
                success: true,
                message: 'Cookie consent status retrieved',
                data: {
                    allowCookie: cookieValue,
                    action: cookieValue === 1 ? 'consent_granted' : 'consent_denied',
                    staticConfig: staticConfig
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get cookie consent status error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Internal server error',
                message: 'Failed to retrieve cookie consent status',
                timestamp: new Date().toISOString()
            });
        }
    });

    // 🎯 UNIFIED CONTENT API - Single endpoint for all content types
    nexusCore.get('/api/content', async (request, reply) => {
        try {
            const { blog, categoryType, query } = request.query;
            let result;
            let contentType = 'all';
            let isSpecific = false;
            let expectedCategoryType = null;

            // 🔍 Validate categoryType filters - Only allow valid ones
            const validFilters = ['blog', 'case-studies', 'media'];
            const invalidFilters = Object.keys(request.query).filter(key => 
                key.endsWith('=true') || (request.query[key] === 'true' && !validFilters.includes(key) && key !== 'query' && key !== 'page' && key !== 'limit')
            );
            
            // Check for invalid filter parameters
            for (const key of Object.keys(request.query)) {
                if (request.query[key] === 'true' && key !== 'query' && key !== 'page' && key !== 'limit' && !validFilters.includes(key)) {
                    return reply.status(400).send({
                        status: 400,
                        success: false,
                        error: `Invalid filter parameter: '${key}'`,
                        message: `Only these filters are allowed: ${validFilters.join(', ')}`,
                        validFilters: validFilters,
                        providedFilter: key,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // 🎯 Determine expected categoryType from filters
            if (blog === 'true') {
                expectedCategoryType = 'blog';
                contentType = 'blog';
            } else if (request.query['case-studies'] === 'true') {
                expectedCategoryType = 'case-studies';
                contentType = 'case-studies';
            } else if (request.query.media === 'true') {
                expectedCategoryType = 'media';
                contentType = 'media';
            } else if (categoryType) {
                expectedCategoryType = categoryType.toLowerCase();
                contentType = categoryType.toLowerCase();
            }

            // 🔍 Handle specific content by slug with categoryType filtering
            if (query) {
                result = await contentProcessor.getBlogBySlug(query);
                isSpecific = true;
                
                if (result.success && result.data) {
                    // ✅ Check if content matches expected categoryType
                    if (expectedCategoryType) {
                        const actualCategoryType = result.data.categoryType ? result.data.categoryType.toLowerCase() : '';
                        
                        if (actualCategoryType !== expectedCategoryType) {
                            return reply.status(404).send({
                                status: 404,
                                success: false,
                                error: `Content not found in '${expectedCategoryType}' category`,
                                message: `The content '${query}' exists but is categorized as '${actualCategoryType}', not '${expectedCategoryType}'.`,
                                actualCategoryType: actualCategoryType,
                                expectedCategoryType: expectedCategoryType,
                                contentType: contentType,
                                isSpecific: true,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                    
                    contentType = result.data.categoryType || 'specific';
                } else {
                    // Content not found
                    return reply.status(404).send({
                        status: 404,
                        success: false,
                        error: 'Content not found',
                        message: `No content found with slug '${query}'`,
                        requestedSlug: query,
                        expectedCategoryType: expectedCategoryType,
                        contentType: contentType,
                        isSpecific: true,
                        timestamp: new Date().toISOString()
                    });
                }
            } 
            // 🔍 Handle filtered content by categoryType (no specific slug)
            else if (expectedCategoryType) {
                const filters = { ...request.query };
                filters.filterCategoryType = expectedCategoryType;
                
                result = await contentProcessor.getBlogs(filters);
            } 
            // 🔍 Handle all content (no filters)
            else {
                result = await contentProcessor.getBlogs(request.query);
                contentType = 'all';
            }

            // 📤 Send response
            if (result.success) {
                const response = {
                    status: 200,
                    success: true,
                    message: result.message || `${contentType} content retrieved successfully`,
                    contentType: contentType,
                    isSpecific: isSpecific,
                    data: result.data,
                    source: result.source,
                    timestamp: result.timestamp
                };

                // Add pagination for list requests
                if (!isSpecific && result.pagination) {
                    response.pagination = result.pagination;
                }

                // Add filter info for filtered requests
                if (expectedCategoryType && !isSpecific) {
                    response.filter = {
                        categoryType: expectedCategoryType,
                        totalResults: result.pagination ? result.pagination.total : (Array.isArray(result.data) ? result.data.length : 0)
                    };
                }

                return reply.status(200).send(response);
            } else {
                return reply.status(result.statusCode || (isSpecific ? 404 : 500)).send({
                    status: result.statusCode || (isSpecific ? 404 : 500),
                    success: false,
                    error: result.error || result.message,
                    contentType: contentType,
                    isSpecific: isSpecific,
                    expectedCategoryType: expectedCategoryType,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ Unified content API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Internal server error',
                message: 'Failed to retrieve content',
                timestamp: new Date().toISOString()
            });
        }
    });

    // 🎯 GET MULTIPLE POSTS BY CATEGORIES - Returns multiple posts from specified categories
    nexusCore.get('/api/getPosts', async (request, reply) => {
        try {
            const { cat, totalcontent } = request.query;
            
            if (!cat) {
                return reply.status(400).send({
                    status: 400,
                    success: false,
                    error: 'Missing category parameter',
                    message: 'Please specify categories using categoryType values',
                    examples: [
                        '/api/getPosts?cat=blog',
                        '/api/getPosts?cat=case-studies', 
                        '/api/getPosts?cat=media',
                        '/api/getPosts?cat=blog,case-studies,media',
                        '/api/getPosts?cat=blog,case-studies&totalcontent=2',
                        '/api/getPosts?cat=blog,case-studies,media&totalcontent=5'
                    ],
                    availableCategories: ['blog', 'case-studies', 'media'],
                    timestamp: new Date().toISOString()
                });
            }

            // Parse totalcontent parameter
            let totalContentPerCategory = null;
            if (totalcontent) {
                const parsed = parseInt(totalcontent);
                if (isNaN(parsed) || parsed < 1) {
                    return reply.status(400).send({
                        status: 400,
                        success: false,
                        error: 'Invalid totalcontent parameter',
                        message: 'totalcontent must be a positive integer',
                        examples: ['totalcontent=1', 'totalcontent=5', 'totalcontent=10'],
                        timestamp: new Date().toISOString()
                    });
                }
                totalContentPerCategory = parsed;
            }

            const result = await contentProcessor.getMultiplePostsByCategories(cat, totalContentPerCategory);
            
            if (result.success) {
                return reply.status(200).send({
                    status: 200,
                    success: true,
                    message: result.message || 'Posts retrieved successfully',
                    requestedCategories: result.requestedCategories,
                    totalContent: result.totalContent,
                    summary: result.summary,
                    source: result.source,
                    data: result.data,
                    timestamp: result.timestamp
                });
            } else {
                return reply.status(result.statusCode || 404).send({
                    status: result.statusCode || 404,
                    success: false,
                    error: result.error || result.message,
                    requestedCategories: result.requestedCategories,
                    totalContent: result.totalContent,
                    summary: result.summary,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ Get multiple posts API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Internal server error',
                message: 'Failed to retrieve posts',
                timestamp: new Date().toISOString()
            });
        }
    });

    // 📊 System Status & Health Check
    nexusCore.get('/api/status', async (request, reply) => {
        try {
            const healthStatus = await contentProcessor.getHealthStatus();
            
            return reply.status(200).send({
                status: 200,
                success: true,
                message: 'System status retrieved successfully',
                data: {
                    system: 'NEXUS Backend Architecture',
                    version: '1.0.0',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    ...healthStatus
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ System status API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Internal server error',
                message: 'Failed to retrieve system status',
                timestamp: new Date().toISOString()
            });
        }
    });

    // 📚 API Documentation Endpoint
    nexusCore.get('/api/docs', async (request, reply) => {
        const apiDocumentation = {
            api_name: "NEXUS Backend Framework API",
            version: "2.0.0",
            description: "Production-ready API suite with Zoho CRM integration, email automation, enhanced security, and comprehensive validation",
            base_url: "http://localhost:3000",
            last_updated: "June 2025",
            codebase_status: "Production Ready",
            
            new_features: {
                email_integration: "✅ Automatic email confirmations via Zoho Mail API",
                oauth_automation: "✅ Token auto-refresh with .env persistence",
                enhanced_validation: "✅ XSS protection and input sanitization",
                module_templates: "✅ 4 professional email templates for each form type"
            },

            system_endpoints: {
                welcome: {
                    method: "GET",
                    path: "/",
                    description: "System overview and quick start guide",
                    response_codes: [200]
                },
                health: {
                    method: "GET", 
                    path: "/health",
                    description: "Detailed system diagnostics including email service status",
                    response_codes: [200]
                },
                status: {
                    method: "GET",
                    path: "/api/status", 
                    description: "System health check with Zoho CRM and Mail connectivity status",
                    response_codes: [200, 500]
                },
                docs: {
                    method: "GET",
                    path: "/api/docs",
                    description: "This comprehensive API documentation",
                    response_codes: [200]
                }
            },

            form_endpoints: {
                unified_submit: {
                    method: "POST",
                    path: "/api/submit",
                    description: "🎯 MAIN ENDPOINT: Unified form submission with automatic CRM integration and email confirmations",
                    content_type: "application/json",
                    flow: "Form Submission → CRM Processing → Email Confirmation → Response",
                    
                    payload_structure: {
                        required: {
                            module_name: {
                                type: "string",
                                values: ["careers", "contacts", "newsletters", "ebook"],
                                description: "Determines which form template and CRM module to use"
                            }
                        },
                        module_specific_fields: "See detailed payload examples below"
                    },

                    detailed_payloads: {
                        careers: {
                            description: "Career application form for job seekers",
                            required_fields: {
                                module_name: "careers",
                                fullname: "string (2-100 chars) - Full name of applicant",
                                mobile: "string (10-15 chars) - Phone number",
                                emailid: "string (valid email) - Email address for confirmation",
                                jobTitle: "string (2-100 chars) - Position applying for"
                            },
                            optional_fields: {
                                cvUpload: "string - URL or file reference (if implementing file upload)"
                            },
                            example_payload: {
                                module_name: "careers",
                                fullname: "John Doe",
                                mobile: "+1-555-123-4567", 
                                emailid: "john.doe@email.com",
                                jobTitle: "Frontend Developer"
                            },
                            email_template: "🎯 Application confirmation with position details and HR follow-up info"
                        },

                        contacts: {
                            description: "General contact/inquiry form for business communications",
                            required_fields: {
                                module_name: "contacts",
                                firstName: "string (2-50 chars) - First name",
                                lastName: "string (2-50 chars) - Last name", 
                                organisation: "string (2-100 chars) - Company/organization name",
                                typeOfOrganisation: "string (2-50 chars) - Business type/industry",
                                country: "string (2-50 chars) - Country location",
                                email: "string (valid email) - Email for confirmation",
                                message: "string (10-1000 chars) - Inquiry message",
                                privacyPolicy: "boolean (true) - Privacy policy acceptance"
                            },
                            optional_fields: {
                                phoneNumber: "string (10-15 chars) - Contact phone number"
                            },
                            example_payload: {
                                module_name: "contacts",
                                firstName: "Jane",
                                lastName: "Smith",
                                organisation: "TechCorp Inc",
                                typeOfOrganisation: "Technology",
                                country: "United States",
                                phoneNumber: "+1-555-987-6543",
                                email: "jane.smith@techcorp.com",
                                message: "Interested in your services for our upcoming project",
                                privacyPolicy: true
                            },
                            email_template: "✅ Thank you confirmation with message details and 24-48h response timeline"
                        },

                        newsletters: {
                            description: "Newsletter subscription for marketing communications",
                            required_fields: {
                                module_name: "newsletters",
                                emailId: "string (valid email) - Subscriber email address"
                            },
                            example_payload: {
                                module_name: "newsletters",
                                emailId: "subscriber@email.com"
                            },
                            email_template: "🎉 Welcome email with subscription benefits and unsubscribe options"
                        },

                        ebook: {
                            description: "eBook download request form for lead generation",
                            required_fields: {
                                module_name: "ebook",
                                firstName: "string (2-50 chars) - First name",
                                lastName: "string (2-50 chars) - Last name",
                                nameOfOrganisation: "string (2-100 chars) - Company name",
                                country: "string (2-50 chars) - Country location", 
                                email: "string (valid email) - Email for download link",
                                privacyPolicy: "boolean (true) - Privacy policy acceptance"
                            },
                            example_payload: {
                                module_name: "ebook",
                                firstName: "Alex",
                                lastName: "Johnson", 
                                nameOfOrganisation: "StartupXYZ",
                                country: "Canada",
                                email: "alex@startupxyz.com",
                                privacyPolicy: true
                            },
                            email_template: "📚 Download confirmation with organization details and next steps"
                        }
                    },

                    validation_rules: {
                        security: "✅ XSS protection, HTML tag removal, input sanitization",
                        length_limits: "✅ Prevents buffer overflow attacks",
                        email_validation: "✅ RFC compliant email format checking", 
                        required_fields: "✅ Missing field validation with detailed error messages"
                    },

                    success_response: {
                        status: 200,
                        success: true,
                        message: "Form submitted successfully",
                        data: {
                            submissionId: "UNIQUE_ID_timestamp_random",
                            zohoRecordId: "934282000000123456", 
                            module: "CRM module used (Leads/Contacts)"
                        },
                        email_status: "✅ Confirmation email sent successfully",
                        timestamp: "2025-06-11T10:30:22.892Z"
                    },

                    error_responses: {
                        validation_error: {
                            status: 422,
                            success: false,
                            error: "Validation failed",
                            details: ["Field-specific error messages"],
                            timestamp: "ISO string"
                        },
                        crm_error: {
                            status: 503,
                            success: false,
                            error: "CRM service temporarily unavailable",
                            message: "Please try again later",
                            timestamp: "ISO string"
                        },
                        server_error: {
                            status: 500,
                            success: false,
                            error: "Internal server error", 
                            message: "Failed to process form submission",
                            timestamp: "ISO string"
                        }
                    },

                    integration_features: {
                        crm_integration: "✅ Automatic submission to Zoho CRM Leads module",
                        email_automation: "✅ Module-specific confirmation emails via Zoho Mail",
                        token_management: "✅ Automatic OAuth token refresh",
                        error_handling: "✅ Graceful fallbacks and detailed error reporting"
                    }
                }
            },

            email_integration: {
                overview: "🔥 NEW FEATURE: Automatic email confirmations after successful form submissions",
                provider: "Zoho Mail API with OAuth 2.0 authentication",
                trigger: "Automatically sent after successful CRM record creation",
                
                email_templates: {
                    careers: {
                        subject: "🎯 Application Received - Thank You!",
                        features: ["Application confirmation", "Position details", "HR follow-up timeline"],
                        personalization: "Uses fullname, emailid, jobTitle, mobile from form"
                    },
                    contacts: {
                        subject: "✅ Thank you for contacting us!",
                        features: ["Message confirmation", "Contact details summary", "24-48h response promise"], 
                        personalization: "Uses firstName, lastName, organisation, country, message from form"
                    },
                    newsletters: {
                        subject: "🎉 Welcome to Our Newsletter!",
                        features: ["Welcome message", "Subscription benefits", "Unsubscribe options"],
                        personalization: "Uses emailId from form"
                    },
                    ebook: {
                        subject: "📚 Your eBook Download Confirmation", 
                        features: ["Download confirmation", "Organization details", "Next steps"],
                        personalization: "Uses firstName, nameOfOrganisation, country from form"
                    }
                },

                technical_details: {
                    delivery_method: "HTML emails via Zoho Mail API",
                    authentication: "OAuth 2.0 with automatic token refresh",
                    error_handling: "Form submission succeeds even if email fails (logged as warning)",
                    rate_limits: "Zoho Mail API rate limits apply",
                    deliverability: "High deliverability through Zoho infrastructure"
                }
            },

            content_endpoints: {
                blogs: {
                    method: "GET",
                    path: "/api/blogs",
                    description: "Get blog posts from Zoho CRM Blog module",
                    query_params: {
                        page: "number - Page number (default: 1)",
                        limit: "number - Items per page (default: 10, max: 100)",
                        category: "string - Filter by category",
                        tag: "string - Filter by tag",
                        author: "string - Filter by author"
                    },
                    example_request: "GET /api/blogs?page=1&limit=5&category=technology",
                    zoho_status: "✅ Active - Connected to Blog module",
                    fallback: "Returns descriptive message if module not found",
                    response_codes: [200, 500]
                },
                unified_content: {
                    method: "GET",
                    path: "/api/content",
                    description: "🎯 UNIFIED CONTENT ENDPOINT: Get all content or filter by type",
                    query_params: {
                        blog: "boolean - Set to 'true' to get only blog content",
                        "case-studies": "boolean - Set to 'true' to get only case-studies content",
                        media: "boolean - Set to 'true' to get only media content",
                        categoryType: "string - Filter by specific categoryType value",
                        query: "string - Get specific content by slug",
                        page: "number - Page number (default: 1)",
                        limit: "number - Items per page (default: 10, max: 50)"
                    },
                    example_requests: [
                        "GET /api/content - All content",
                        "GET /api/content?blog=true - Only blog content",
                        "GET /api/content?case-studies=true - Only case-studies content", 
                        "GET /api/content?media=true - Only media content",
                        "GET /api/content?categoryType=Blogs - Filter by categoryType",
                        "GET /api/content?query=my-blog-slug - Specific content by slug"
                    ],
                    zoho_status: "✅ Active - Uses Blog module with categoryType filtering",
                    response_codes: [200, 404, 500]
                },
                get_posts: {
                    method: "GET",
                    path: "/api/getPosts",
                    description: "🎯 NEW: Get multiple posts from specified categories with optional limit per category",
                    query_params: {
                        cat: "string - Comma-separated categoryType values (e.g., 'blog,case-studies,media')",
                        totalcontent: "number (optional) - Maximum posts per category (e.g., 2, 5, 10)"
                    },
                    example_requests: [
                        "GET /api/getPosts?cat=blog - Get all blog posts",
                        "GET /api/getPosts?cat=case-studies - Get all case-study posts",
                        "GET /api/getPosts?cat=blog,case-studies - Get all from both categories",
                        "GET /api/getPosts?cat=blog,case-studies&totalcontent=2 - Get 2 from each category",
                        "GET /api/getPosts?cat=blog,case-studies,media&totalcontent=5 - Get 5 from each category"
                    ],
                    available_categories: ["blog", "case-studies", "media"],
                    response_structure: {
                        success_response: {
                            status: 200,
                            success: true,
                            message: "Posts retrieved successfully from blog, case-studies categories",
                            requestedCategories: ["blog", "case-studies"],
                            totalContent: 2,
                            summary: {
                                blog: 2,
                                "case-studies": 1,
                                total: 3
                            },
                            data: "Array of posts with categoryType field for FE filtering"
                        }
                    },
                    zoho_status: "✅ Active - Uses Blog module with categoryType filtering",
                    response_codes: [200, 400, 404, 500]
                },
                blog_single: {
                    method: "GET",
                    path: "/api/blogs/:slug",
                    description: "Get individual blog post by slug",
                    path_params: {
                        slug: "string - URL-friendly blog identifier"
                    },
                    example_request: "GET /api/blogs/how-to-integrate-zoho-crm",
                    zoho_status: "✅ Active - Connected to Blog module", 
                    response_codes: [200, 404, 500]
                },
                case_studies: {
                    method: "GET",
                    path: "/api/case-studies",
                    description: "Get case studies from Zoho CRM (Module pending creation)",
                    query_params: ["page", "limit", "industry", "client"],
                    zoho_status: "⚠️ Module not created yet in Zoho CRM",
                    fallback: "Returns clear message: 'Case Studies module not created in Zoho CRM yet'",
                    response_codes: [200, 500]
                },
                case_study_single: {
                    method: "GET",
                    path: "/api/case-studies/:slug",
                    description: "Get individual case study by slug (Module pending creation)",
                    path_params: ["slug"],
                    zoho_status: "⚠️ Module not created yet in Zoho CRM",
                    response_codes: [200, 404, 500]
                },
                media: {
                    method: "GET",
                    path: "/api/media",
                    description: "Get media gallery from Zoho CRM (Module pending creation)",
                    query_params: ["page", "limit", "type", "category"],
                    zoho_status: "⚠️ Module not created yet in Zoho CRM",
                    fallback: "Returns clear message: 'Media module not created in Zoho CRM yet'",
                    response_codes: [200, 500]
                }
            },

            crm_endpoints: {
                zoho_callback: {
                    method: "GET",
                    path: "/zoho/callback",
                    description: "OAuth 2.0 authorization callback for Zoho CRM setup",
                    query_params: ["code"],
                    response_codes: [200, 400, 500]
                },
                zoho_mail_callback: {
                    method: "GET", 
                    path: "/zoho/mail/callback",
                    description: "OAuth 2.0 authorization callback for Zoho Mail setup",
                    query_params: ["code"],
                    response_codes: [200, 400, 500]
                },
                zoho_test: {
                    method: "GET", 
                    path: "/zoho/test",
                    description: "Test Zoho CRM connectivity and authentication",
                    response_codes: [200, 401, 500]
                },
                zoho_mail_test: {
                    method: "GET",
                    path: "/zoho/mail/test", 
                    description: "Test Zoho Mail connectivity and send test email",
                    response_codes: [200, 401, 500]
                }
            },

            frontend_integration_guide: {
                recommended_approach: {
                    method: "Use fetch() or axios for form submissions",
                    content_type: "application/json",
                    error_handling: "Check response.success boolean for status",
                    user_feedback: "Show success/error messages based on response"
                },

                example_javascript: {
                    contact_form: `
// Contact Form Submission Example
const submitContactForm = async (formData) => {
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                module_name: 'contacts',
                firstName: formData.firstName,
                lastName: formData.lastName,
                organisation: formData.organisation,
                typeOfOrganisation: formData.typeOfOrganisation,
                country: formData.country,
                phoneNumber: formData.phoneNumber, // optional
                email: formData.email,
                message: formData.message,
                privacyPolicy: true
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Success: Show confirmation message
            showSuccessMessage('Thank you! We\\'ll respond within 24-48 hours. Check your email for confirmation.');
        } else {
            // Error: Show validation errors
            console.error('❌ Submission failed:', result.error);
            showErrorMessage(result.details || result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        showErrorMessage('Connection failed. Please try again.');
    }
};`,

                    ebook_form: `
// eBook Download Form Example  
const submitEbookForm = async (formData) => {
    const payload = {
        module_name: 'ebook',
        firstName: formData.firstName,
        lastName: formData.lastName,
        nameOfOrganisation: formData.nameOfOrganisation,
        country: formData.country,
        email: formData.email,
        privacyPolicy: formData.privacyPolicy
    };

    const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result;
};`
                },

                form_validation_tips: {
                    client_side: "Validate required fields before submission",
                    email_format: "Use HTML5 email input type for basic validation",
                    privacy_policy: "Ensure checkbox is checked before enabling submit",
                    length_limits: "Match server-side limits (see field descriptions above)",
                    user_experience: "Show loading state during submission"
                },

                response_handling: {
                    success_case: "Show confirmation message + mention email confirmation",
                    validation_errors: "Display field-specific error messages", 
                    server_errors: "Show generic 'try again' message",
                    email_status: "Inform user that confirmation email was sent"
                }
            },

            security_features: {
                input_validation: {
                    toolkit: "ValidationToolkit with comprehensive security",
                    features: ["XSS protection", "HTML tag removal", "Input sanitization", "Length validation", "Buffer overflow protection"]
                },
                recaptcha: {
                    status: "Optional - Configurable via GOOGLE_RECAPTCHA_SECRET_KEY",
                    behavior: "Automatically skipped when not configured for development"
                },
                zoho_integration: {
                    authentication: "OAuth 2.0 with automatic token refresh for both CRM and Mail",
                    data_protection: "Secure API communication with error handling",
                    token_storage: "Encrypted storage in .env file with auto-refresh"
                }
            },

            zoho_integration_status: {
                crm_integration: {
                    status: "✅ Fully Integrated",
                    modules: {
                        leads: "✅ Standard module - Used for all form submissions",
                        blog: "✅ Custom module - Active and retrieving data",
                        case_studies: "⚠️ Custom module - Not created yet",
                        media: "⚠️ Custom module - Not created yet"
                    }
                },
                mail_integration: {
                    status: "✅ Fully Integrated",
                    features: [
                        "✅ OAuth 2.0 authentication with auto-refresh",
                        "✅ 4 professional email templates", 
                        "✅ Automatic sending after form submission",
                        "✅ Multi-region support (India: .in domain)",
                        "✅ Error handling and fallback logging"
                    ],
                    account_details: {
                        primary_email: "dhruv.solanki@sportzinteractive.net",
                        sending_email: "dhruv.solanki@zohomail.in", 
                        account_region: "India (.in)",
                        api_domain: "https://mail.zoho.in/api"
                    }
                }
            },

            response_format: {
                success_response: {
                    status: 200,
                    success: true,
                    message: "Operation completed successfully",
                    data: "Response data",
                    timestamp: "ISO string"
                },
                error_response: {
                    status: "HTTP status code",
                    success: false,
                    error: "Error description",
                    details: "Additional error details (for validation errors)",
                    timestamp: "ISO string"
                }
            },

            development_info: {
                setup_guide: "See docs/EMAIL_INTEGRATION.md for email setup",
                field_management: "See ZOHO_FIELDS_MANAGEMENT.md for CRM field management", 
                environment: "Environment variables in .env file",
                testing: "Use provided curl examples and test endpoints",
                monitoring: "Health endpoint provides real-time diagnostics for both CRM and Mail"
            },

            quick_test_commands: {
                test_contact_form: `curl -X POST http://localhost:3000/api/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "module_name": "contacts",
    "firstName": "Test",
    "lastName": "User", 
    "organisation": "Test Company",
    "typeOfOrganisation": "Technology",
    "country": "India",
    "email": "test@example.com",
    "message": "Test message",
    "privacyPolicy": true
  }'`,
                
                test_ebook_form: `curl -X POST http://localhost:3000/api/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "module_name": "ebook",
    "firstName": "Test",
    "lastName": "User",
    "nameOfOrganisation": "Test Company", 
    "country": "India",
    "email": "test@example.com",
    "privacyPolicy": true
  }'`,

                check_system_health: "curl http://localhost:3000/health",
                check_api_status: "curl http://localhost:3000/api/status",
                
                test_get_posts_all: "curl http://localhost:3000/api/getPosts?cat=blog,case-studies",
                test_get_posts_limited: "curl http://localhost:3000/api/getPosts?cat=blog,case-studies&totalcontent=2",
                test_get_posts_single: "curl http://localhost:3000/api/getPosts?cat=blog"
            },

            /*  // Cache Management - DISABLED FOR NOW
            cache_management: {
                overview: "🗑️ NEW FEATURE: Cache management and busting capabilities for development and troubleshooting",
                purpose: "Clear various cache types to resolve issues with stale data, tokens, or modules",
                
                endpoints: {
                    clear_all: {
                        method: "POST",
                        path: "/api/cache/clear",
                        description: "Clear all cache types (require cache, application cache, tokens)",
                        use_cases: ["Development hot-reloading", "Troubleshooting stale tokens", "Memory cleanup"],
                        response_codes: [200, 500]
                    },
                    clear_specific: {
                        method: "POST", 
                        path: "/api/cache/clear/:type",
                        description: "Clear specific cache type",
                        path_params: {
                            type: "string - Cache type: 'require', 'application', or 'tokens'"
                        },
                        examples: [
                            "POST /api/cache/clear/require - Clear Node.js require cache",
                            "POST /api/cache/clear/tokens - Clear OAuth tokens cache",
                            "POST /api/cache/clear/application - Clear application-level cache"
                        ],
                        response_codes: [200, 400, 500]
                    },
                    cache_stats: {
                        method: "GET",
                        path: "/api/cache/stats", 
                        description: "Get cache statistics and usage information",
                        returns: ["Cache clear history", "Module counts", "Memory usage", "System info"],
                        response_codes: [200, 500]
                    },
                    cache_analyze: {
                        method: "GET",
                        path: "/api/cache/analyze",
                        description: "Analyze current cache state and memory usage",
                        returns: ["Require cache analysis", "Memory breakdown", "Loaded modules count"],
                        response_codes: [200, 500]
                    }
                },

                cache_types: {
                    require_cache: {
                        description: "Node.js module require cache - cleared for hot-reloading",
                        affects: ["Processors", "Pathways", "Utilities"],
                        safe_for_production: false,
                        development_only: true
                    },
                    application_cache: {
                        description: "Application-level cached objects and instances",
                        affects: ["Global cache objects", "Memory cleanup"],
                        safe_for_production: true
                    },
                    tokens_cache: {
                        description: "OAuth tokens and authentication cache",
                        affects: ["Zoho CRM tokens", "Zoho Mail tokens", "Account IDs"],
                        safe_for_production: true,
                        use_case: "Resolve 401 Unauthorized errors"
                    }
                },

                development_workflow: {
                    hot_reload: "POST /api/cache/clear/require - Apply code changes without restart",
                    token_refresh: "POST /api/cache/clear/tokens - Force token re-authentication", 
                    full_reset: "POST /api/cache/clear - Complete cache reset",
                    debugging: "GET /api/cache/analyze - Investigate memory/cache issues"
                }
            }
            */
        };

        return reply.status(200).send({
            status: 200,
            success: true,
            message: 'API documentation retrieved successfully',
            data: apiDocumentation,
            timestamp: new Date().toISOString()
        });
    });

    // 🖼️ IMAGE UPLOAD API - Enhanced with AWS S3 Support
    nexusCore.post('/api/image/upload', async (request, reply) => {
        try {
            const data = await request.file();
            
            if (!data) {
                return reply.status(400).send({
                    status: 400,
                    success: false,
                    error: 'No file uploaded',
                    message: 'Please select an image file to upload',
                    timestamp: new Date().toISOString()
                });
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(data.mimetype)) {
                return reply.status(400).send({
                    status: 400,
                    success: false,
                    error: 'Invalid file type',
                    message: 'Only JPEG, PNG, GIF, and WebP images are allowed',
                    allowedTypes: allowedTypes,
                    receivedType: data.mimetype,
                    timestamp: new Date().toISOString()
                });
            }

            // Generate unique filename
            const fileExtension = data.filename.split('.').pop();
            const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
            
            // Convert stream to buffer for S3 upload
            const chunks = [];
            for await (const chunk of data.file) {
                chunks.push(chunk);
            }
            const fileBuffer = Buffer.concat(chunks);
            
            let uploadResult = {
                filename: uniqueFilename,
                originalName: data.filename,
                size: fileBuffer.length,
                mimetype: data.mimetype,
                storage: 'local', // Default to local
                url: null,
                localPath: null,
                s3Data: null
            };

            // Try AWS S3 upload first (if configured)
            const AWSS3Service = require('../services/awsS3Service');
            const s3Service = new AWSS3Service();
            
            if (s3Service.isAvailable()) {
                try {
                    console.log('🌩️ Attempting S3 upload...');
                    const s3Result = await s3Service.uploadToS3(fileBuffer, uniqueFilename, data.mimetype);
                    
                    if (s3Result.success) {
                        uploadResult.storage = 's3';
                        uploadResult.url = s3Result.url;
                        uploadResult.s3Data = {
                            bucket: s3Result.bucket,
                            key: s3Result.key,
                            etag: s3Result.etag
                        };
                        console.log('✅ S3 upload successful:', s3Result.url);
                    }
                } catch (s3Error) {
                    console.log('⚠️ S3 upload failed, falling back to local storage:', s3Error.message);
                }
            }

            // Fallback to local storage if S3 failed or not configured
            if (!uploadResult.url) {
                const filePath = `uploads/blogs/${uniqueFilename}`;
                
                // Save file to local storage
                const fs = require('fs');
                const path = require('path');
                
                // Ensure directory exists
                const uploadDir = path.dirname(filePath);
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                // Write file from buffer
                fs.writeFileSync(filePath, fileBuffer);
                
                // Generate accessible URL
                uploadResult.url = `${request.protocol}://${request.headers.host}/uploads/blogs/${uniqueFilename}`;
                uploadResult.localPath = filePath;
                uploadResult.storage = 'local';
                console.log('✅ Local upload successful:', uploadResult.url);
            }
            
            return reply.status(200).send({
                status: 200,
                success: true,
                message: `Image uploaded successfully to ${uploadResult.storage.toUpperCase()}`,
                data: uploadResult,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Image upload error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Upload failed',
                message: 'Failed to upload image',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // 📄 EMBEDDED UPLOAD FORM - For Zoho CRM Integration
    nexusCore.get('/upload', async (request, reply) => {
        const embeddedUploadForm = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS Image Upload - Zoho CRM Integration</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 500px; 
            margin: 0 auto; 
            backgroundColor: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            text-align: center;
        }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { opacity: 0.9; font-size: 14px; }
        
        .upload-section { padding: 30px; }
        
        .upload-area { 
            border: 3px dashed #ddd; 
            border-radius: 12px; 
            padding: 40px 20px; 
            text-align: center; 
            margin: 20px 0;
            transition: all 0.3s ease;
            cursor: pointer;
            background: #fafafa;
        }
        .upload-area:hover, .upload-area.dragover { 
            border-color: #667eea; 
            background: #f0f4ff;
            transform: translateY(-2px);
        }
        .upload-area.dragover { 
            border-color: #667eea; 
            background: #e3f2fd; 
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        }
        
        .upload-icon { font-size: 48px; margin-bottom: 15px; color: #667eea; }
        .upload-text { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 8px; }
        .upload-subtext { font-size: 14px; color: #666; }
        
        input[type="file"] { display: none; }
        
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 12px 30px; 
            border: none; 
            border-radius: 25px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            width: 100%;
            margin: 20px 0;
        }
        .btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .result { 
            margin: 20px 0; 
            padding: 20px; 
            border-radius: 12px; 
            display: none;
        }
        .success { 
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
        }
        .error { 
            background: linear-gradient(135deg, #f44336, #e53935);
            color: white;
        }
        .loading {
            background: linear-gradient(135deg, #ff9800, #f57c00);
            color: white;
        }
        
        .uploaded-image { 
            max-width: 100%; 
            margin: 15px 0; 
            border-radius: 10px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .url-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .url-input {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            font-family: monospace;
            background: white;
        }
        .copy-btn {
            background: #28a745;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-top: 10px;
            width: 100%;
        }
        .copy-btn:hover { background: #218838; }
        
        .zoho-integration {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .zoho-integration h4 { color: #333; margin-bottom: 10px; }
        .zoho-integration p { color: #666; font-size: 14px; line-height: 1.4; }
        
        .close-btn {
            background: #6c757d;
            color: white;
            padding: 8px 20px;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 15px;
        }
        .close-btn:hover { background: #5a6268; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖼️ NEXUS Image Upload</h1>
            <p>Zoho CRM Blog Integration</p>
        </div>
        
        <div class="upload-section">
            <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                <div class="upload-icon">📁</div>
                <div class="upload-text">Click here or drag & drop</div>
                <div class="upload-subtext">JPEG, PNG, GIF, WebP supported (Max: 50MB)</div>
            </div>

            <input type="file" id="fileInput" accept="image/*" />
            <button class="btn" onclick="uploadImage()" id="uploadBtn">🚀 Upload Image</button>

            <div id="result" class="result"></div>
            
            <div class="zoho-integration">
                <h4>📋 Zoho CRM Integration</h4>
                <p>After successful upload, copy the generated URL and paste it into your Blog record's image field in Zoho CRM.</p>
            </div>
        </div>
    </div>

    <script>
        const uploadArea = document.querySelector('.upload-area');
        const fileInput = document.getElementById('fileInput');
        const result = document.getElementById('result');
        const uploadBtn = document.getElementById('uploadBtn');

        // Drag & Drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                updateFileInfo(files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) {
                updateFileInfo(fileInput.files[0]);
            }
        });

        function updateFileInfo(file) {
            const uploadText = document.querySelector('.upload-text');
            const uploadSubtext = document.querySelector('.upload-subtext');
            
            uploadText.textContent = file.name;
            uploadSubtext.textContent = \`Size: \${(file.size / 1024 / 1024).toFixed(2)} MB\`;
            uploadArea.style.borderColor = '#667eea';
            uploadArea.style.background = '#f0f4ff';
        }

        async function uploadImage() {
            const file = fileInput.files[0];
            if (!file) {
                showResult('error', '❌ Please select an image file');
                return;
            }

            // Validate file size
            if (file.size > 50 * 1024 * 1024) {
                showResult('error', '❌ File too large. Maximum size is 50MB.');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            // Show loading state
            uploadBtn.disabled = true;
            uploadBtn.textContent = '⏳ Uploading...';
            showResult('loading', '⏳ Uploading your image...');

            try {
                const response = await fetch('/api/image/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    showSuccessResult(data.data);
                } else {
                    showResult('error', \`❌ \${data.error}: \${data.message}\`);
                }
            } catch (error) {
                showResult('error', \`❌ Upload failed: \${error.message}\`);
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = '🚀 Upload Image';
            }
        }

        function showResult(type, message) {
            result.className = \`result \${type}\`;
            result.style.display = 'block';
            result.innerHTML = message;
        }

        function showSuccessResult(data) {
            const storageInfo = data.storage === 's3' ? 
                '<div style="color: #28a745; font-weight: 600; margin-bottom: 10px;">🌩️ Uploaded to AWS S3</div>' :
                '<div style="color: #667eea; font-weight: 600; margin-bottom: 10px;">💾 Uploaded to Local Storage</div>';
                
            const successHTML = \`
                <div style="text-align: center;">
                    <h3 style="margin-bottom: 15px;">✅ Upload Successful!</h3>
                    \${storageInfo}
                    <img src="\${data.url}" alt="Uploaded image" class="uploaded-image" />
                    
                    <div class="url-section">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">📋 Copy this URL for Zoho CRM:</label>
                        <input type="text" class="url-input" value="\${data.url}" id="imageUrl" readonly />
                        <button class="copy-btn" onclick="copyToClipboard()">📋 Copy URL</button>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px;">
                        <strong>File:</strong> \${data.filename}<br>
                        <strong>Size:</strong> \${(data.size / 1024).toFixed(2)} KB<br>
                        <strong>Type:</strong> \${data.mimetype}<br>
                        <strong>Storage:</strong> \${data.storage.toUpperCase()}\${data.s3Data ? \` (Bucket: \${data.s3Data.bucket})\` : ''}
                    </div>
                    
                    <button class="close-btn" onclick="closeWindow()">Close Window</button>
                </div>
            \`;
            
            result.className = 'result success';
            result.style.display = 'block';
            result.innerHTML = successHTML;
        }

        function copyToClipboard() {
            const urlInput = document.getElementById('imageUrl');
            urlInput.select();
            urlInput.setSelectionRange(0, 99999); // For mobile devices
            
            navigator.clipboard.writeText(urlInput.value).then(() => {
                const copyBtn = document.querySelector('.copy-btn');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                copyBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '#28a745';
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                document.execCommand('copy');
                alert('URL copied to clipboard!');
            });
        }

        function closeWindow() {
            // Try to close the window/tab (works if opened by script)
            if (window.opener) {
                window.close();
            } else {
                // If can't close, show message
                alert('Please close this tab and return to Zoho CRM');
            }
        }

        // Auto-focus on file input when page loads
        window.addEventListener('load', () => {
            // Auto-highlight the upload area
            setTimeout(() => {
                uploadArea.style.animation = 'pulse 2s ease-in-out';
            }, 500);
        });
    </script>
</body>
</html>`;

        return reply.type('text/html').send(embeddedUploadForm);
    });

    // 🌩️ AWS S3 HEALTH CHECK ENDPOINT
    nexusCore.get('/api/s3/health', async (request, reply) => {
        try {
            const AWSS3Service = require('../services/awsS3Service');
            const s3Service = new AWSS3Service();
            
            const healthCheck = await s3Service.healthCheck();
            
            return reply.status(200).send({
                status: 200,
                success: true,
                message: 'S3 health check completed',
                data: {
                    s3Status: healthCheck,
                    isConfigured: s3Service.isAvailable(),
                    region: process.env.AWS_REGION || 'ap-south-1',
                    bucket: process.env.AWS_S3_BUCKET || 'assets-spz.sportz.io'
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ S3 health check error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'S3 health check failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    console.log('🔗 API pathways activated with Zoho CRM integration');
}

module.exports = { registerApiPathways }; 