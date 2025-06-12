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
            const result = await formsProcessor.processUnifiedForm(request.body);
            
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

            // Set cookie for 1 year (365 days)
            const cookieOptions = {
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
                httpOnly: false, // Allow frontend JavaScript access
                secure: false, // Set to true in production with HTTPS
                sameSite: 'lax', // CSRF protection
                path: '/' // Available for entire domain
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

    // 🗑️ Cache Management Endpoints - DISABLED FOR NOW
    /*
    // Clear all caches
    nexusCore.post('/api/cache/clear', async (request, reply) => {
        try {
            const result = cacheBuster.clearAllCaches();
            
            return reply.status(200).send({
                status: 200,
                success: true,
                message: 'All caches cleared successfully',
                data: result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Cache clear API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Failed to clear caches',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Clear specific cache type
    nexusCore.post('/api/cache/clear/:type', async (request, reply) => {
        try {
            const { type } = request.params;
            let result;

            switch (type) {
                case 'require':
                    result = cacheBuster.clearRequireCache();
                    break;
                case 'application':
                    result = cacheBuster.clearApplicationCache();
                    break;
                case 'tokens':
                    result = cacheBuster.clearTokenCache();
                    break;
                default:
                    return reply.status(400).send({
                        status: 400,
                        success: false,
                        error: 'Invalid cache type',
                        validTypes: ['require', 'application', 'tokens'],
                        timestamp: new Date().toISOString()
                    });
            }

            return reply.status(200).send({
                status: 200,
                success: true,
                message: `${type} cache cleared successfully`,
                data: result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`❌ ${request.params.type} cache clear error:`, error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: `Failed to clear ${request.params.type} cache`,
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Get cache statistics
    nexusCore.get('/api/cache/stats', async (request, reply) => {
        try {
            const stats = cacheBuster.getStats();
            
            return reply.status(200).send({
                status: 200,
                success: true,
                message: 'Cache statistics retrieved successfully',
                data: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Cache stats API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Failed to retrieve cache statistics',
                timestamp: new Date().toISOString()
            });
        }
    });

    // Analyze cache state
    nexusCore.get('/api/cache/analyze', async (request, reply) => {
        try {
            const analysis = cacheBuster.analyzeCacheState();
            
            return reply.status(200).send({
                status: 200,
                success: true,
                message: 'Cache analysis completed successfully',
                data: analysis,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Cache analysis API error:', error);
            return reply.status(500).send({
                status: 500,
                success: false,
                error: 'Failed to analyze cache state',
                timestamp: new Date().toISOString()
            });
        }
    });
    */

    console.log('🔗 API pathways activated with Zoho CRM integration');
}

module.exports = { registerApiPathways }; 