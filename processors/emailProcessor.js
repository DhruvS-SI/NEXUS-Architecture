// processors/emailProcessor.js - Zoho Mail Integration
const fetch = require('node-fetch');

class EmailProcessor {
    constructor() {
        this.accessToken = process.env.ZOHO_MAIL_ACCESS_TOKEN;
        this.refreshToken = process.env.ZOHO_MAIL_REFRESH_TOKEN;
        this.clientId = process.env.ZOHO_MAIL_CLIENT_ID;
        this.clientSecret = process.env.ZOHO_MAIL_CLIENT_SECRET;
        this.baseUrl = 'https://mail.zoho.in/api';
        this.fromEmail = process.env.FROM_EMAIL || 'dhruv.solanki@sportzinteractive.net';
        this.fromName = process.env.FROM_NAME || 'NEXUS Team';
        this.accountId = null; // Will be fetched when needed
        this.tokenExpiryTime = null;
    }

    // 🔄 Refresh Access Token for Mail API
    async refreshAccessToken() {
        try {
            console.log('🔄 Refreshing Zoho Mail access token...');
            
            const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `refresh_token=${this.refreshToken}&client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=refresh_token`
            });

            if (!response.ok) {
                throw new Error(`Mail token refresh failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            
            // Update .env file with new token
            await this.updateEnvFile(data.access_token);
            
            console.log('✅ Mail access token refreshed successfully');
            return data.access_token;
        } catch (error) {
            console.error('❌ Failed to refresh mail access token:', error);
            throw error;
        }
    }

    // 💾 Update .env file with new mail access token
    async updateEnvFile(newAccessToken) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const envPath = path.join(process.cwd(), '.env');
            const envContent = await fs.readFile(envPath, 'utf8');
            
            // Replace the mail access token line
            const updatedContent = envContent.replace(
                /ZOHO_MAIL_ACCESS_TOKEN=.*/,
                `ZOHO_MAIL_ACCESS_TOKEN=${newAccessToken}`
            );
            
            await fs.writeFile(envPath, updatedContent);
            console.log('💾 Updated .env file with new mail access token');
        } catch (error) {
            console.error('❌ Failed to update .env file with mail token:', error);
        }
    }

    // 🔄 Generic Zoho Mail API Request Handler
    async makeMailRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {
                'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            };

            const response = await fetch(url, {
                method: options.method || 'GET',
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            // If 401 Unauthorized, try refreshing token and retry once
            if (response.status === 401) {
                console.log('🔄 Mail access token expired, refreshing...');
                await this.refreshAccessToken();
                
                // Retry the request with new token
                const retryHeaders = {
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                };

                const retryResponse = await fetch(url, {
                    method: options.method || 'GET',
                    headers: retryHeaders,
                    body: options.body ? JSON.stringify(options.body) : undefined
                });

                if (!retryResponse.ok) {
                    const errorText = await retryResponse.text();
                    throw new Error(`Zoho Mail API Error: ${retryResponse.status} ${retryResponse.statusText} - ${errorText}`);
                }

                return await retryResponse.json();
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Zoho Mail API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Mail API request failed:', error.message);
            throw error;
        }
    }

    // 📧 Send Email using Zoho Mail API
    async sendEmail(to, subject, htmlContent, textContent = '') {
        try {
            if (!this.accessToken) {
                console.warn('⚠️ Zoho Mail not configured, skipping email');
                return { success: false, error: 'Mail not configured' };
            }

            console.log('📧 Sending email to:', to);

            // Get account ID first
            const accountId = await this.getAccountId();

            const emailData = {
                fromAddress: this.fromEmail,
                toAddress: to,
                subject: subject,
                content: htmlContent,
                mailFormat: 'html'
            };

            // Use correct endpoint with account ID
            const response = await this.makeMailRequest(`/accounts/${accountId}/messages`, {
                method: 'POST',
                body: emailData
            });

            console.log('✅ Email sent successfully to:', to);
            return {
                success: true,
                messageId: response.data?.messageId,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send email:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🎯 Email Templates
    getWelcomeEmailTemplate(userData, module_name) {
        const templates = {
            newsletters: {
                subject: '🎉 Welcome to Our Newsletter!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Welcome to Our Newsletter! 📧</h2>
                        <p>Hi there!</p>
                        <p>Thank you for subscribing to our newsletter. You'll receive the latest updates, insights, and news directly in your inbox.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1e293b; margin-top: 0;">What to expect:</h3>
                            <ul style="color: #475569;">
                                <li>📈 Industry insights and trends</li>
                                <li>🚀 Product updates and announcements</li>
                                <li>💡 Tips and best practices</li>
                                <li>🎯 Exclusive content and offers</li>
                            </ul>
                        </div>
                        <p>If you have any questions, feel free to reply to this email.</p>
                        <p>Best regards,<br><strong>${this.fromName}</strong></p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="font-size: 12px; color: #64748b;">
                            You're receiving this email because you subscribed to our newsletter.
                            If you no longer wish to receive these emails, you can unsubscribe at any time.
                        </p>
                    </div>
                `
            },
            contacts: {
                subject: '✅ Thank you for contacting us!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Thank you for reaching out! 👋</h2>
                        <p>Hi ${userData.firstName}!</p>
                        <p>We've received your message and appreciate you taking the time to contact us.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1e293b; margin-top: 0;">Your message details:</h3>
                            <p style="color: #475569;"><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</p>
                            <p style="color: #475569;"><strong>Organization:</strong> ${userData.organisation}</p>
                            <p style="color: #475569;"><strong>Country:</strong> ${userData.country}</p>
                            <p style="color: #475569;"><strong>Message:</strong> ${userData.message}</p>
                        </div>
                        <p>Our team will review your message and get back to you within 24-48 hours.</p>
                        <p>Best regards,<br><strong>${this.fromName}</strong></p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="font-size: 12px; color: #64748b;">
                            This is an automated confirmation email. Please do not reply to this message.
                        </p>
                    </div>
                `
            },
            ebook: {
                subject: '📚 Your eBook Download Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Your eBook is Ready! 📚</h2>
                        <p>Hi ${userData.firstName}!</p>
                        <p>Thank you for your interest in our resources. Your eBook request has been processed successfully.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1e293b; margin-top: 0;">Download Details:</h3>
                            <p style="color: #475569;"><strong>Organization:</strong> ${userData.nameOfOrganisation}</p>
                            <p style="color: #475569;"><strong>Country:</strong> ${userData.country}</p>
                            <p style="color: #475569;">Your download link will be available shortly in a separate email.</p>
                        </div>
                        <p>We hope you find the content valuable for your business needs.</p>
                        <p>Best regards,<br><strong>${this.fromName}</strong></p>
                    </div>
                `
            },
            careers: {
                subject: '🎯 Application Received - Thank You!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Application Received! 🎯</h2>
                        <p>Hi ${userData.fullname}!</p>
                        <p>Thank you for applying to join our team. We've successfully received your application.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1e293b; margin-top: 0;">Application Details:</h3>
                            <p style="color: #475569;"><strong>Position:</strong> ${userData.jobTitle}</p>
                            <p style="color: #475569;"><strong>Email:</strong> ${userData.emailid}</p>
                            <p style="color: #475569;"><strong>Mobile:</strong> ${userData.mobile}</p>
                        </div>
                        <p>Our HR team will review your application and contact you if your profile matches our requirements.</p>
                        <p>We appreciate your interest in working with us!</p>
                        <p>Best regards,<br><strong>${this.fromName} - HR Team</strong></p>
                    </div>
                `
            }
        };

        return templates[module_name] || templates.contacts;
    }

    // 🚀 Send Module-specific Email
    async sendModuleEmail(userData, module_name) {
        try {
            const template = this.getWelcomeEmailTemplate(userData, module_name);
            const userEmail = userData.email || userData.emailId || userData.emailid;
            
            if (!userEmail) {
                return { success: false, error: 'No email address provided' };
            }

            return await this.sendEmail(userEmail, template.subject, template.html);
        } catch (error) {
            console.error('❌ Error sending module email:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔍 Health Check for Mail Service
    async healthCheck() {
        try {
            if (!this.accessToken) {
                return {
                    status: 'not_configured',
                    message: 'Zoho Mail not configured',
                    timestamp: new Date().toISOString()
                };
            }

            // Try to get account info as health check
            const response = await this.makeMailRequest('/accounts');
            return {
                status: 'connected',
                message: 'Zoho Mail service operational',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'disconnected',
                message: 'Zoho Mail service unavailable',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🔍 Get Account ID
    async getAccountId() {
        try {
            if (this.accountId) {
                return this.accountId;
            }

            const response = await this.makeMailRequest('/accounts');
            
            if (response && response.data && response.data.length > 0) {
                this.accountId = response.data[0].accountId || response.data[0].id;
                console.log('✅ Retrieved Zoho Mail Account ID');
                return this.accountId;
            } else if (response && response.data) {
                throw new Error('No mail accounts found in response');
            } else {
                throw new Error('Invalid accounts API response structure');
            }
        } catch (error) {
            console.error('❌ Failed to get account ID:', error.message);
            throw error;
        }
    }

    // 🗑️ Clear cached tokens and data (for cache busting)
    clearCache() {
        try {
            console.log('🧹 Clearing EmailProcessor cache...');
            
            // Clear cached tokens
            this.accessToken = null;
            this.refreshToken = null;
            this.accountId = null;
            
            // Clear any other cached data
            this.tokenExpiryTime = null;
            
            console.log('✅ EmailProcessor cache cleared');
            return {
                success: true,
                message: 'Email processor cache cleared',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error clearing EmailProcessor cache:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = EmailProcessor; 