// NEXUS Form Neural Pathways - Form data processing routes
const formProcessor = require('../processors/formProcessor');

async function formPathways(nexusCore, options) {
  // Neural pathway: Process incoming form data through validation
  nexusCore.post('/api/forms', formProcessor.submitForm);
}

module.exports = formPathways; 