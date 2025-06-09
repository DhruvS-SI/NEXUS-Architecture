const fastify = require('fastify');
const config = require('./synapses/server');
const pathways = require('./pathways');

// Create the NEXUS core - Central neural processing hub
const nexusCore = fastify({ logger: config.fastify.logger });

// Initialize neural network startup
async function activateNexus() {
  try {
    console.log('🧠 Initializing NEXUS Architecture...');
    
    // Register neural synapses (CORS & body processing)
    await nexusCore.register(require('@fastify/cors'), config.cors);
    await nexusCore.register(require('@fastify/formbody'));
    
    console.log('⚡ Synaptic connections established');
    
    // Activate neural pathways
    await nexusCore.register(pathways);
    console.log('🛣️ Neural pathways activated');
    
    // Start the neural network
    await nexusCore.listen({ port: config.server.port, host: config.server.host });
    
    console.log('🚀 NEXUS Core is online at http://localhost:' + config.server.port);
    console.log('🧠 Neural network: Fully operational with distributed intelligence');
    
  } catch (error) {
    console.error('❌ NEXUS activation failed:');
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    nexusCore.log.error('NEXUS activation error:', error);
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