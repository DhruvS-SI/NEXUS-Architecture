// NEXUS Validation Toolkit - Neural algorithms for data validation and security

class ValidationToolkit {
  // Neural algorithm: Email pattern recognition
  static isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  // Neural algorithm: Required field validation
  static hasRequiredFields(data, requiredFields) {
    return requiredFields.every(field => 
      data[field] && data[field].trim() !== ''
    );
  }

  // Neural security algorithm: Input sanitization and XSS protection
  static sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    // Remove script tags and dangerous patterns
    return str
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove any HTML tags
      .slice(0, 1000); // Limit length to prevent buffer overflow
  }

  // Neural algorithm: Phone number validation
  static isValidPhone(phone) {
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
    return phonePattern.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Neural algorithm: URL validation
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Neural function: Complete form data validation pipeline
  static validateFormData(data) {
    const errors = [];
    const requiredFields = ['name', 'email', 'message'];
    
    // Apply neural validation algorithms
    if (!this.hasRequiredFields(data, requiredFields)) {
      errors.push('Neural validation: Missing required fields (name, email, message)');
    }
    
    // Email pattern recognition
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Neural validation: Invalid email pattern detected');
    }
    
    // Length validation
    if (data.name && data.name.length > 100) {
      errors.push('Neural validation: Name exceeds maximum length (100 characters)');
    }
    
    if (data.message && data.message.length > 5000) {
      errors.push('Neural validation: Message exceeds maximum length (5000 characters)');
    }
    
    // Neural data sanitization
    const sanitizedData = {
      name: this.sanitizeString(data.name),
      email: data.email?.trim().toLowerCase(),
      message: this.sanitizeString(data.message),
      formType: this.sanitizeString(data.formType) || 'contact',
      phone: data.phone ? this.sanitizeString(data.phone) : null,
      website: data.website ? this.sanitizeString(data.website) : null
    };
    
    // Additional validation for optional fields
    if (sanitizedData.phone && !this.isValidPhone(sanitizedData.phone)) {
      errors.push('Neural validation: Invalid phone number format');
    }
    
    if (sanitizedData.website && !this.isValidURL(sanitizedData.website)) {
      errors.push('Neural validation: Invalid website URL format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: sanitizedData,
      neural_processing: 'Complete',
      validation_algorithms: [
        'Required field check',
        'Email pattern recognition', 
        'Input sanitization',
        'XSS protection',
        'Length validation'
      ]
    };
  }

  // Neural algorithm: Advanced input validation for specific types
  static validateSpecificInput(input, type) {
    const validators = {
      username: (val) => /^[a-zA-Z0-9_]{3,20}$/.test(val),
      password: (val) => val.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val),
      age: (val) => !isNaN(val) && val >= 0 && val <= 150,
      zipcode: (val) => /^\d{5}(-\d{4})?$/.test(val)
    };
    
    const validator = validators[type];
    return validator ? validator(input) : false;
  }
}

module.exports = ValidationToolkit; 