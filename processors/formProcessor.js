// NEXUS Form Processor - Specialized neural unit for form data processing
const ValidationToolkit = require('../toolkit/validation');

class FormProcessor {
  // Neural function: Process incoming form data through validation algorithms
  async submitForm(request, reply) {
    try {
      // Apply neural validation algorithms
      const validation = ValidationToolkit.validateFormData(request.body);
      
      if (!validation.isValid) {
        return reply.status(400).send({
          success: false,
          error: validation.errors.join(', '),
          processor: 'NEXUS Form Processor',
          validation_status: 'Neural validation failed'
        });
      }
      
      const { name, email, message, formType } = validation.data;
      
      // Neural data processing: Create form submission record
      const formSubmission = {
        id: Date.now(), // Neural timestamp ID
        name,
        email, 
        message,
        formType,
        submittedAt: new Date().toISOString(),
        status: 'processed_by_neural_network',
        processor: 'NEXUS Form Processor'
      };
      
      // Log neural activity for monitoring
      request.log.info('🧠 Form submission processed by neural network:', formSubmission);
      
      // Neural response
      return {
        success: true,
        message: 'Form data successfully processed by neural network',
        data: {
          submissionId: formSubmission.id,
          status: formSubmission.status,
          processor: 'NEXUS Form Processor',
          neural_validation: 'Passed',
          processing_timestamp: formSubmission.submittedAt
        }
      };
    } catch (error) {
      request.log.error('🧠 Form processor error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Neural processing error in form processor',
        processor: 'NEXUS Form Processor'
      });
    }
  }
}

module.exports = new FormProcessor(); 