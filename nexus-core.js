// Load environment variables
require('dotenv').config();

const fastify = require('fastify');
const config = require('./synapses/server');
const crmPathways = require('./pathways/crmPathways');
const systemPathways = require('./pathways/index');
const { registerApiPathways } = require('./pathways/apiPathways');
const { activateNeuralCRM } = require('./synapses/zoho');

// Create the NEXUS core - Central neural processing hub
const nexusCore = fastify({ logger: config.fastify.logger });

// Initialize neural network startup
async function activateNexus() {
  console.log('🧠 Initializing NEXUS Architecture...');
  
  try {
    // Initialize Neural CRM
    const crmActivated = await activateNeuralCRM();
    if (crmActivated) {
      console.log('🔗 Neural CRM integration activated');
    } else {
      console.log('⚠️ Neural CRM offline (check environment configuration)');
    }
  } catch (crmError) {
    console.log('⚠️ Neural CRM unavailable:', crmError.message);
  }
  
  // Register essential middleware
  await nexusCore.register(require('@fastify/cors'), config.cors);
  await nexusCore.register(require('@fastify/formbody'));
  await nexusCore.register(require('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'nexus-cookie-secret-key-change-in-production',
    parseOptions: {}
  });
  
  // Welcome route - Show all available endpoints
  nexusCore.get('/', async (request, reply) => {
    return {
      status: 200,
      message: '🚀 Welcome to NEXUS Backend Framework',
      system: 'NEXUS Core v1.0.0',
      description: 'Production-ready backend architecture with Zoho CRM integration, enhanced security, and comprehensive validation',
      architecture: {
        core: 'Fastify-based high-performance server',
        processors: 'Specialized business logic processors',
        pathways: 'Clean routing architecture',
        validation: 'Advanced ValidationToolkit with XSS protection',
        integration: 'Native Zoho CRM connectivity'
      },
      endpoints: {
        system: {
          docs: 'GET /api/docs - Complete API documentation',
          status: 'GET /api/status - System health and component status',
          health: 'GET /health - Detailed system diagnostics'
        },
        content_apis: {
          unified_content: 'GET /api/content?blog=true - Unified content API (all content types)',
          blogs: 'GET /api/content?blog=true - Blog posts from Zoho CRM',
          blog_single: 'GET /api/content?blog=true&query=slug - Individual blog post',
          case_studies: 'GET /api/content?case-studies=true - Case studies (module creation needed)',
          case_study_single: 'GET /api/content?case-studies=true&query=slug - Individual case study',
          media: 'GET /api/content?media=true - Media gallery (module creation needed)',
          get_post: 'GET /api/getPost?cat=blog,media,case-studies - Get single post from specified modules'
        },
        form_apis: {
          unified_submit: 'POST /api/submit - Unified form submission (careers, contacts, newsletters, ebook)'
        },
        crm_integration: {
          zoho_callback: 'GET /zoho/callback - OAuth authorization callback',
          zoho_test: 'GET /zoho/test - Test CRM connectivity'
        }
      },
      features: [
        '✅ Zoho CRM Integration with Auto Token Refresh',
        '✅ Enhanced Input Validation & XSS Protection',
        '✅ Google reCAPTCHA Verification (Optional)',
        '✅ Real-time Content Management',
        '✅ Professional API Design with Error Handling',
        '✅ Health Monitoring & System Diagnostics',
        '✅ Production-Ready Security Features',
        '✅ Clean & Maintainable Codebase'
      ],
      quick_start: {
        test_health: 'curl http://localhost:3000/health',
        view_blogs: 'curl http://localhost:3000/api/content?blog=true',
        get_single_post: 'curl http://localhost:3000/api/getPost?cat=blog',
        get_mixed_content: 'curl http://localhost:3000/api/getPost?cat=blog,media,case-studies',
        submit_form: 'curl -X POST http://localhost:3000/api/submit -H "Content-Type: application/json" -d \'{"module_name":"contacts","firstName":"Test","lastName":"User","organisation":"Company","typeOfOrganisation":"Tech","country":"India","email":"test@example.com","message":"Hello NEXUS!","privacyPolicy":true}\'',
        documentation: 'curl http://localhost:3000/api/docs'
      },
      status: {
        server: 'Online',
        codebase: 'Cleaned & Optimized',
        validation: 'Enhanced Security',
        crm_integration: 'Active'
      },
      timestamp: new Date().toISOString()
    };
  });
  
  // Register Neural Pathways (Routes)
  await nexusCore.register(crmPathways);
  await nexusCore.register(systemPathways);
  await registerApiPathways(nexusCore);
  
  // Activate Core Listeners
  try {
    await nexusCore.listen({ host: '0.0.0.0', port: config.server.port });
    console.log('🚀 NEXUS Core is online at http://localhost:' + config.server.port);
    
  } catch (error) {
    console.error('❌ NEXUS activation failed:');
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Graceful neural shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Initiating neural shutdown sequence...');
  try {
    await nexusCore.close();
    console.log('🧠 NEXUS Core safely deactivated');
    process.exit(0);
  } catch (error) {
    console.log('⚠️ Error during neural shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception in NEXUS:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection in NEXUS:', reason);
  process.exit(1);
});

// Activate the NEXUS neural network
activateNexus(); 