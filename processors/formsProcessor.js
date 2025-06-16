// processors/formsProcessor.js - Updated for Zoho CRM Integration
const fetch = require('node-fetch');
const ZohoDataProcessor = require('./zohoDataProcessor');
const EmailProcessor = require('./emailProcessor');
const ValidationToolkit = require('../toolkit/validation');

class FormsProcessor {
    constructor() {
        this.zohoProcessor = new ZohoDataProcessor();
        this.emailProcessor = new EmailProcessor();
        this.recaptchaSecretKey = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
    }

    // 🔐 Verify Google reCAPTCHA
    async verifyRecaptcha(token, userIP = '') {
        if (!this.recaptchaSecretKey) {
            console.warn('⚠️ reCAPTCHA secret key not configured, skipping verification');
            return { success: true, note: 'reCAPTCHA verification skipped (no secret key configured)' };
        }

        try {
            const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${this.recaptchaSecretKey}&response=${token}&remoteip=${userIP}`
            });

            const data = await response.json();
            
            if (data.success) {
                return { success: true, score: data.score };
            } else {
                return { 
                    success: false, 
                    error: 'reCAPTCHA verification failed',
                    details: data['error-codes'] || []
                };
            }
        } catch (error) {
            console.error('❌ reCAPTCHA verification error:', error);
            return { 
                success: false, 
                error: 'reCAPTCHA verification service unavailable' 
            };
        }
    }

    // 🎯 Unified Form Processing
    async processUnifiedForm(requestData) {
        try {
            const { module_name, ...data } = requestData; 

            
            // Validate module_name
            const validModules = ['careers', 'contacts', 'newsletters', 'ebook'];
            if (!validModules.includes(module_name)) {
                return {
                    success: false,
                    error: 'Invalid module name',
                    details: `Module must be one of: ${validModules.join(', ')}`,
                    statusCode: 400
                };
            }

            // Validate form data based on module
            const validation = this.validateUnifiedForm(module_name, data);
            if (!validation.valid) {
                return {
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors,
                    statusCode: 422
                };
            }

            // reCAPTCHA verification (if token provided)
            if (data.recaptchaToken) {
                const recaptchaResult = await this.verifyRecaptcha(data.recaptchaToken, data.ipAddress);
                if (!recaptchaResult.success) {
                    return {
                        success: false,
                        error: recaptchaResult.error,
                        details: recaptchaResult.details,
                        statusCode: 400
                    };
                }
            }

            // Generate submission ID
            const submissionId = `${module_name.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Submit to Zoho CRM
            const submissionData = {
                ...data,
                recaptchaVerified: data.recaptchaToken ? true : false,
                submissionId: submissionId
            };

            const zohoResult = await this.zohoProcessor.submitFormData(submissionData, module_name);
            
            if (zohoResult.success) {
                // 📧 Send confirmation email after successful CRM submission
                try {
                    const emailResult = await this.emailProcessor.sendModuleEmail(data, module_name);
                    if (emailResult.success) {
                        console.log('✅ Confirmation email sent successfully');
                    } else {
                        console.warn('⚠️ Email sending failed:', emailResult.error);
                    }
                } catch (emailError) {
                    console.warn('⚠️ Email sending error:', emailError.message);
                    // Don't fail the form submission if email fails
                }

                return {
                    success: true,
                    submissionId: submissionId,
                    zohoRecordId: zohoResult.id,
                    module: zohoResult.module,
                    message: `${module_name} form submitted successfully`,
                    emailSent: true // Indicates email was attempted
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to submit to CRM',
                    details: zohoResult.error,
                    statusCode: 503
                };
            }
        } catch (error) {
            console.error(`❌ Unified form processing error:`, error);
            return {
                success: false,
                error: 'Internal processing error',
                details: error.message,
                statusCode: 500
            };
        }
    }

    // 🔧 Enhanced Helper Methods using ValidationToolkit
    isValidEmail(email) {
        return ValidationToolkit.isValidEmail(email);
    }

    isValidPhone(phone) {
        return ValidationToolkit.isValidPhone(phone);
    }

    isValidURL(url) {
        return ValidationToolkit.isValidURL(url);
    }

    sanitizeInput(input) {
        return ValidationToolkit.sanitizeString(input);
    }

    // 🔍 Unified Form Validation
    validateUnifiedForm(module_name, data) {
        const errors = [];

        switch (module_name) {
            case 'careers':
                if (!this.sanitizeInput(data.fullname) || data.fullname.length < 2) {
                    errors.push('Full name is required and must be at least 2 characters');
                }
                if (!this.isValidPhone(data.mobile)) {
                    errors.push('Valid mobile number is required');
                }
                if (!this.isValidEmail(data.emailid)) {
                    errors.push('Valid email is required');
                }
                if (!this.sanitizeInput(data.jobTitle) || data.jobTitle.length < 2) {
                    errors.push('Job title is required');
                }
                // CV upload validation can be added here
                break;

            case 'contacts':
                if (!this.sanitizeInput(data.firstName) || data.firstName.length < 2) {
                    errors.push('First name is required and must be at least 2 characters');
                }
                if (!this.sanitizeInput(data.lastName) || data.lastName.length < 2) {
                    errors.push('Last name is required and must be at least 2 characters');
                }
                if (!this.sanitizeInput(data.organisation) || data.organisation.length < 2) {
                    errors.push('Organisation is required');
                }
                if (!this.sanitizeInput(data.typeOfOrganisation)) {
                    errors.push('Type of organisation is required');
                }
                if (!this.sanitizeInput(data.country)) {
                    errors.push('Country is required');
                }
                if (!this.isValidEmail(data.email)) {
                    errors.push('Valid email is required');
                }
                if (!this.sanitizeInput(data.message) || data.message.length < 10) {
                    errors.push('Message is required and must be at least 10 characters');
                }
                if (data.privacyPolicy !== true) {
                    errors.push('Privacy policy acceptance is required');
                }
                // Phone number is optional for contacts
                if (data.phoneNumber && !this.isValidPhone(data.phoneNumber)) {
                    errors.push('Phone number format is invalid');
                }
                break;

            case 'newsletters':
                if (!this.isValidEmail(data.emailId)) {
                    errors.push('Valid email is required');
                }
                break;

            case 'ebook':
                if (!this.sanitizeInput(data.firstName) || data.firstName.length < 2) {
                    errors.push('First name is required and must be at least 2 characters');
                }
                if (!this.sanitizeInput(data.lastName) || data.lastName.length < 2) {
                    errors.push('Last name is required and must be at least 2 characters');
                }
                if (!this.sanitizeInput(data.nameOfOrganisation) || data.nameOfOrganisation.length < 2) {
                    errors.push('Name of organisation is required');
                }
                if (!this.sanitizeInput(data.country)) {
                    errors.push('Country is required');
                }
                if (!this.isValidEmail(data.email)) {
                    errors.push('Valid email is required');
                }
                if (data.privacyPolicy !== true) {
                    errors.push('Privacy policy acceptance is required');
                }
                break;

            default:
                errors.push('Invalid module name');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = FormsProcessor; 