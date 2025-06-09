// NEXUS Neural Pathways - Main routing hub
const blogPathways = require('./blogPathways');
const formPathways = require('./formPathways');

async function pathways(nexusCore, options) {
  // Register specialized neural pathways
  await nexusCore.register(blogPathways);    // Blog processing pathways
  await nexusCore.register(formPathways);    // Form processing pathways
  
  // Core system pathways
  nexusCore.get('/', async (request, reply) => {
    return {
      success: true,
      message: '🧠 Welcome to NEXUS Architecture - Neural Backend Framework',
      system: 'NEXUS Core',
      status: 'Fully operational',
      neural_pathways: {
        blogs: 'GET /api/blogs - Access memory banks for blog data',
        blog_by_id: 'GET /api/blogs/:id - Retrieve specific neural records',
        forms: 'POST /api/forms - Process incoming data through neural validation',
        health: 'GET /health - Neural network status check'
      },
      architecture: {
        core: 'nexus-core.js - Central processing hub',
        synapses: 'synapses/ - Neural connection configurations', 
        processors: 'processors/ - Specialized logic processing units',
        memory_banks: 'memory-banks/ - Data storage matrices',
        pathways: 'pathways/ - Neural routing network',
        toolkit: 'toolkit/ - Algorithm processing tools',
        interceptors: 'interceptors/ - Data security barriers'
      }
    };
  });

  // Neural network health diagnostics
  nexusCore.get('/health', async (request, reply) => {
    return {
      success: true,
      system: 'NEXUS Architecture',
      status: 'Neural network operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      neural_activity: 'All processors responding normally',
      pathways_active: true,
      synaptic_connections: 'Stable'
    };
  });
}

module.exports = pathways; 