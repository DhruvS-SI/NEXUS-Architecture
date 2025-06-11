// NEXUS Content Processor - Pure Zoho CRM Integration
const ZohoDataProcessor = require('./zohoDataProcessor');

class ContentProcessor {
    constructor() {
        this.zohoProcessor = new ZohoDataProcessor();
    }

    // Helper method to check if error is due to missing module (400 Bad Request)
    isModuleMissingError(error) {
        return error.message && (
            error.message.includes('400 Bad Request') ||
            error.message.includes('module not found in Zoho CRM')
        );
    }

    // 📖 Get Blogs (from Zoho CRM only) - Now handles all content types via categoryType
    async getBlogs(queryParams) {
        try {
            const page = parseInt(queryParams.page) || 1;
            const limit = Math.min(parseInt(queryParams.limit) || 10, 50);
            const category = queryParams.category;
            const tag = queryParams.tag;
            const filterCategoryType = queryParams.filterCategoryType; // Client-side filter

            const filters = { page, limit };
            if (category) filters.category = category;
            if (tag) filters.tag = tag;

            // If we're filtering by categoryType, we need to get all results first
            // because Zoho doesn't support server-side categoryType filtering
            if (filterCategoryType) {
                filters.page = 1;
                filters.limit = 100; // Get more results to filter from
            }

            const result = await this.zohoProcessor.getBlogs(filters);
            
            let filteredBlogs = result.blogs;
            
            // Client-side filtering by categoryType if specified
            if (filterCategoryType) {
                filteredBlogs = result.blogs.filter(blog => 
                    blog.categoryType && blog.categoryType.toLowerCase() === filterCategoryType.toLowerCase()
                );
                
                // Apply pagination after filtering
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);
                
                return {
                    success: true,
                    data: paginatedBlogs,
                    pagination: {
                        page: page,
                        limit,
                        total: filteredBlogs.length,
                        totalPages: Math.ceil(filteredBlogs.length / limit),
                        hasNext: page < Math.ceil(filteredBlogs.length / limit),
                        hasPrev: page > 1
                    },
                    source: 'Zoho CRM',
                    timestamp: new Date().toISOString()
                };
            }
            
            return {
                success: true,
                data: filteredBlogs,
                pagination: {
                    page: result.page,
                    limit,
                    total: filteredBlogs.length,
                    totalPages: Math.ceil(filteredBlogs.length / limit),
                    hasNext: page < Math.ceil(filteredBlogs.length / limit),
                    hasPrev: page > 1
                },
                source: 'Zoho CRM',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error in getBlogs:', error);
            
            // Check if this is a module missing error (400 Bad Request)
            if (this.isModuleMissingError(error)) {
                return {
                    success: true,
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    },
                    source: 'Zoho CRM',
                    message: 'Blog module not created in Zoho CRM yet',
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                data: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                },
                source: 'Zoho CRM',
                error: 'Failed to fetch blogs from Zoho CRM',
                timestamp: new Date().toISOString()
            };
        }
    }

    // 📖 Get Single Blog by Slug (from Zoho CRM only)
    async getBlogBySlug(slug) {
        try {
            const blog = await this.zohoProcessor.getBlogBySlug(slug);
            
            if (blog) {
                return {
                    success: true,
                    data: blog,
                    source: 'Zoho CRM',
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    success: false,
                    data: null,
                    error: 'Blog not found in Zoho CRM',
                    source: 'Zoho CRM',
                    statusCode: 404,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('❌ Error in getBlogBySlug:', error);
            
            // Check if this is a module missing error (400 Bad Request)
            if (this.isModuleMissingError(error)) {
                return {
                    success: false,
                    data: null,
                    message: 'Blog module not created in Zoho CRM yet',
                    source: 'Zoho CRM',
                    statusCode: 404,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                data: null,
                error: 'Failed to fetch blog from Zoho CRM',
                source: 'Zoho CRM',
                statusCode: 500,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 📊 Get Case Studies (from Zoho CRM only)
    async getCaseStudies(queryParams) {
        try {
            const page = parseInt(queryParams.page) || 1;
            const limit = Math.min(parseInt(queryParams.limit) || 10, 50);
            const industry = queryParams.industry;

            const filters = { page, limit };
            if (industry) filters.industry = industry;

            const result = await this.zohoProcessor.getCaseStudies(filters);
            
            return {
                success: true,
                data: result.caseStudies,
                pagination: {
                    page: result.page,
                    limit,
                    total: result.total,
                    totalPages: result.totalPages,
                    hasNext: result.page < result.totalPages,
                    hasPrev: result.page > 1
                },
                source: 'Zoho CRM',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error in getCaseStudies:', error);
            
            // Check if this is a module missing error (400 Bad Request)
            if (this.isModuleMissingError(error)) {
                return {
                    success: true,
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    },
                    source: 'Zoho CRM',
                    message: 'Case Studies module not created in Zoho CRM yet',
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                data: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                },
                source: 'Zoho CRM',
                error: 'Failed to fetch case studies from Zoho CRM',
                timestamp: new Date().toISOString()
            };
        }
    }

    // 📊 Get Single Case Study by Slug (from Zoho CRM only)
    async getCaseStudyBySlug(slug) {
        try {
            const caseStudy = await this.zohoProcessor.getCaseStudyBySlug(slug);
            
            if (caseStudy) {
                return {
                    success: true,
                    data: caseStudy,
                    source: 'Zoho CRM',
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    success: false,
                    data: null,
                    error: 'Case study not found in Zoho CRM',
                    source: 'Zoho CRM',
                    statusCode: 404,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('❌ Error in getCaseStudyBySlug:', error);
            
            // Check if this is a module missing error (400 Bad Request)
            if (this.isModuleMissingError(error)) {
                return {
                    success: false,
                    data: null,
                    message: 'Case Studies module not created in Zoho CRM yet',
                    source: 'Zoho CRM',
                    statusCode: 404,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                data: null,
                error: 'Failed to fetch case study from Zoho CRM',
                source: 'Zoho CRM',
                statusCode: 500,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🎬 Get Media (from Zoho CRM only)
    async getMedia(queryParams) {
        try {
            const page = parseInt(queryParams.page) || 1;
            const limit = Math.min(parseInt(queryParams.limit) || 10, 50);
            const type = queryParams.type;
            const category = queryParams.category;

            const filters = { page, limit };
            if (type) filters.type = type;
            if (category) filters.category = category;

            const result = await this.zohoProcessor.getMedia(filters);
            
            return {
                success: true,
                data: result.media,
                pagination: {
                    page: result.page,
                    limit,
                    total: result.total,
                    totalPages: result.totalPages,
                    hasNext: result.page < result.totalPages,
                    hasPrev: result.page > 1
                },
                source: 'Zoho CRM',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error in getMedia:', error);
            
            // Check if this is a module missing error (400 Bad Request)
            if (this.isModuleMissingError(error)) {
                return {
                    success: true,
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    },
                    source: 'Zoho CRM',
                    message: 'Media module not created in Zoho CRM yet',
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                data: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                },
                source: 'Zoho CRM',
                error: 'Failed to fetch media from Zoho CRM',
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🎬 Get Single Media by Slug/ID (from Zoho CRM only)
    async getMediaBySlug(identifier) {
        try {
            const mediaItem = await this.zohoProcessor.getMediaBySlug(identifier);
            
            if (mediaItem) {
                return {
                    success: true,
                    data: mediaItem,
                    source: 'Zoho CRM',
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    success: false,
                    data: null,
                    error: 'Media item not found in Zoho CRM',
                    source: 'Zoho CRM',
                    statusCode: 404,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('❌ Error in getMediaBySlug:', error);
            
            // Check if this is a module missing error (400 Bad Request)
            if (this.isModuleMissingError(error)) {
                return {
                    success: false,
                    data: null,
                    message: 'Media module not created in Zoho CRM yet',
                    source: 'Zoho CRM',
                    statusCode: 404,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                data: null,
                error: 'Failed to fetch media item from Zoho CRM',
                source: 'Zoho CRM',
                statusCode: 500,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🎯 Get Multiple Posts by Categories - Returns posts from each specified category
    async getMultiplePostsByCategories(categoriesString, totalContentPerCategory = null) {
        try {
            // Parse comma-separated categories (now categoryType values)
            const requestedCategories = categoriesString.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
            
            if (requestedCategories.length === 0) {
                return {
                    success: false,
                    error: 'No valid categories provided',
                    requestedCategories: [],
                    statusCode: 400,
                    timestamp: new Date().toISOString()
                };
            }

            console.log('🔍 Getting posts from categories:', requestedCategories);
            console.log('📊 Posts per category:', totalContentPerCategory || 'ALL');

            let allPosts = [];
            let summary = {};
            let foundAnyContent = false;

            // Get posts from each categoryType
            for (const categoryType of requestedCategories) {
                console.log(`🔍 Fetching from categoryType: ${categoryType}...`);
                
                try {
                    const limit = totalContentPerCategory || 100; // Get all if no limit specified
                    const result = await this.getBlogs({ 
                        page: 1, 
                        limit: limit, 
                        filterCategoryType: categoryType 
                    });
                    
                    if (result.success && result.data && result.data.length > 0) {
                        allPosts.push(...result.data);
                        summary[categoryType] = result.data.length;
                        foundAnyContent = true;
                        console.log(`✅ Found ${result.data.length} posts in ${categoryType}`);
                    } else {
                        summary[categoryType] = 0;
                        console.log(`⚠️ No posts found in ${categoryType}`);
                    }
                } catch (error) {
                    console.log(`❌ Error fetching from ${categoryType}:`, error.message);
                    summary[categoryType] = 0;
                    continue; // Continue to next category
                }
            }

            if (!foundAnyContent) {
                return {
                    success: false,
                    error: 'No content found in any of the requested categories',
                    requestedCategories: requestedCategories,
                    totalContent: totalContentPerCategory,
                    summary: summary,
                    availableCategories: ['blog', 'case-studies', 'media'],
                    statusCode: 404,
                    timestamp: new Date().toISOString()
                };
            }

            // Calculate total posts retrieved
            const totalPosts = Object.values(summary).reduce((sum, count) => sum + count, 0);

            return {
                success: true,
                message: `Posts retrieved successfully from ${Object.keys(summary).filter(cat => summary[cat] > 0).join(', ')} categories`,
                data: allPosts,
                requestedCategories: requestedCategories,
                totalContent: totalContentPerCategory,
                summary: {
                    ...summary,
                    total: totalPosts
                },
                source: 'Zoho CRM',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error in getMultiplePostsByCategories:', error);
            return {
                success: false,
                error: 'Failed to search categories',
                requestedCategories: categoriesString ? categoriesString.split(',').map(cat => cat.trim()) : [],
                statusCode: 500,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🎯 Get Health Status
    async getHealthStatus() {
        try {
            const zohoHealth = await this.zohoProcessor.healthCheck();
            
            return {
                success: true,
                data: {
                    system: 'NEXUS Backend Architecture',
                    version: '1.0.0',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    zoho: zohoHealth
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error getting health status:', error);
            return {
                success: false,
                error: 'Failed to get system health status',
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = ContentProcessor; 