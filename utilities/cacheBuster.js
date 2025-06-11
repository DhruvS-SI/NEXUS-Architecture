
class CacheBuster {
    constructor() {
        this.stats = {
            lastClearTime: null,
            modulesCleared: 0,
            tokensCleared: 0,
            totalClears: 0
        };
    }

    // 🧹 Clear Node.js require cache (for development)
    clearRequireCache(targetPath = null) {
        let clearedCount = 0;
        const startTime = Date.now();

        try {
            if (targetPath) {
                // Clear specific module
                const resolvedPath = require.resolve(targetPath);
                if (require.cache[resolvedPath]) {
                    delete require.cache[resolvedPath];
                    clearedCount = 1;
                    console.log(`🧹 Cleared cache for: ${targetPath}`);
                }
            } else {
                // Clear all application modules (keep node_modules)
                const appModules = Object.keys(require.cache).filter(path => 
                    !path.includes('node_modules') && 
                    (path.includes('/processors/') || 
                     path.includes('/pathways/') || 
                     path.includes('/utilities/'))
                );

                appModules.forEach(modulePath => {
                    delete require.cache[modulePath];
                    clearedCount++;
                });

                console.log(`🧹 Cleared ${clearedCount} application modules from require cache`);
            }

            this.stats.modulesCleared += clearedCount;
            this.stats.lastClearTime = new Date().toISOString();
            
            return {
                success: true,
                cleared: clearedCount,
                duration: Date.now() - startTime,
                timestamp: this.stats.lastClearTime
            };

        } catch (error) {
            console.error('❌ Error clearing require cache:', error);
            return {
                success: false,
                error: error.message,
                cleared: clearedCount
            };
        }
    }

    // 🎯 Clear application-specific caches
    clearApplicationCache() {
        const results = {
            tokens: false,
            processors: false,
            instances: false
        };

        try {
            // Clear any global cache objects if they exist
            if (global.nexusCache) {
                delete global.nexusCache;
                results.instances = true;
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            console.log('🧹 Application cache cleared');
            return results;

        } catch (error) {
            console.error('❌ Error clearing application cache:', error);
            return results;
        }
    }

    // 🔄 Clear token caches (force re-authentication)
    clearTokenCache() {
        try {
            console.log('🔄 Clearing processor token caches...');
            let clearedCount = 0;
            
            // Try to clear email processor cache
            try {
                const EmailProcessor = require('../processors/emailProcessor');
                const emailProcessor = new EmailProcessor();
                const result = emailProcessor.clearCache();
                if (result.success) clearedCount++;
            } catch (error) {
                console.warn('⚠️ Could not clear EmailProcessor cache:', error.message);
            }
            
            // Try to clear CRM processor cache if it has a clearCache method
            try {
                const CrmProcessor = require('../processors/crmProcessor');
                const crmProcessor = new CrmProcessor();
                if (typeof crmProcessor.clearCache === 'function') {
                    const result = crmProcessor.clearCache();
                    if (result.success) clearedCount++;
                }
            } catch (error) {
                console.warn('⚠️ Could not clear CrmProcessor cache:', error.message);
            }
            
            this.stats.tokensCleared += clearedCount;
            
            return {
                success: true,
                message: `Token caches cleared for ${clearedCount} processors`,
                processorsCleared: clearedCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🌐 Get cache control headers for API responses
    getCacheControlHeaders(type = 'no-cache') {
        const headers = {};

        switch (type) {
            case 'no-cache':
                headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                headers['Pragma'] = 'no-cache';
                headers['Expires'] = '0';
                break;
            
            case 'short':
                headers['Cache-Control'] = 'public, max-age=300'; // 5 minutes
                break;
            
            case 'medium':
                headers['Cache-Control'] = 'public, max-age=3600'; // 1 hour
                break;
            
            case 'long':
                headers['Cache-Control'] = 'public, max-age=86400'; // 24 hours
                break;
            
            default:
                headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        }

        // Add cache-busting timestamp
        headers['X-Cache-Bust'] = Date.now().toString();
        
        return headers;
    }

    // 📊 Full cache clearing operation
    clearAllCaches() {
        const startTime = Date.now();
        const results = {
            requireCache: null,
            applicationCache: null,
            tokenCache: null,
            totalDuration: 0,
            success: true
        };

        try {
            // Clear require cache
            results.requireCache = this.clearRequireCache();
            
            // Clear application cache
            results.applicationCache = this.clearApplicationCache();
            
            // Clear token cache
            results.tokenCache = this.clearTokenCache();
            
            results.totalDuration = Date.now() - startTime;
            this.stats.totalClears++;
            
            console.log(`🎉 All caches cleared in ${results.totalDuration}ms`);
            
            return results;

        } catch (error) {
            results.success = false;
            results.error = error.message;
            console.error('❌ Error in full cache clear:', error);
            return results;
        }
    }

    // 📈 Get cache statistics
    getStats() {
        return {
            ...this.stats,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };
    }

    // 🔍 Analyze current cache state
    analyzeCacheState() {
        const analysis = {
            requireCache: {
                total: Object.keys(require.cache).length,
                appModules: Object.keys(require.cache).filter(path => 
                    !path.includes('node_modules')).length,
                nodeModules: Object.keys(require.cache).filter(path => 
                    path.includes('node_modules')).length
            },
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };

        return analysis;
    }
}

// Export singleton instance
const cacheBuster = new CacheBuster();

module.exports = {
    CacheBuster,
    cacheBuster
}; 