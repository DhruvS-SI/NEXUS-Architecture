// NEXUS CRM Neural Pathways - Zoho CRM routing network
const crmProcessor = require('../processors/crmProcessor');

async function crmPathways(nexusCore, options) {
  // Neural pathway: CRM system health diagnostics
  nexusCore.get('/api/crm/health', crmProcessor.crmHealth);
  
  // Neural pathway: Access leads memory bank
  nexusCore.get('/api/crm/leads', crmProcessor.getLeads);
  
  // Neural pathway: Create new lead record
  nexusCore.post('/api/crm/leads', crmProcessor.createLead);
  
  // Neural pathway: Access contacts memory bank
  nexusCore.get('/api/crm/contacts', crmProcessor.getContacts);
  
  // Zoho Mail OAuth Callback
  nexusCore.get('/zoho/mail/callback', async (request, reply) => {
    try {
      const authCode = request.query.code;
      if (!authCode) {
        return reply.status(400).send({
          status: 400,
          success: false,
          error: 'Authorization code not received from Zoho Mail'
        });
      }

      console.log('📧 Received Zoho Mail authorization code:', authCode);
      
      // Automatically exchange code for tokens
      const tokenResult = await exchangeMailCodeForTokens(authCode);
      
      if (tokenResult.success) {
        return reply.status(200).send({
          status: 200,
          success: true,
          message: '🎉 Zoho Mail setup completed successfully!',
          data: {
            accessToken: tokenResult.accessToken ? tokenResult.accessToken.substring(0, 30) + '...' : 'Generated',
            refreshToken: tokenResult.refreshToken ? tokenResult.refreshToken.substring(0, 30) + '...' : 'Generated',
            expiresIn: tokenResult.expiresIn || 'Unknown'
          },
          instructions: [
            '✅ Tokens automatically generated and saved to .env file',
            '🔄 Restart your NEXUS server to use the new tokens',
            '📧 Configure FROM_EMAIL and FROM_NAME in your .env file',
            '🧪 Test with: curl http://localhost:3000/zoho/mail/test'
          ],
          nextSteps: 'Your Zoho Mail integration is ready! Restart the server and test email sending.'
        });
      } else {
        return reply.status(500).send({
          status: 500,
          success: false,
          error: 'Failed to exchange authorization code for tokens',
          details: tokenResult.error,
          fallback: 'You can manually run: node scripts/generate-mail-tokens.js'
        });
      }
    } catch (error) {
      console.error('❌ Error processing Zoho Mail OAuth callback:', error);
      return reply.status(500).send({
        status: 500,
        success: false,
        error: 'Failed to process Zoho Mail authorization callback',
        details: error.message
      });
    }
  });

  // Test Zoho Mail Connection
  nexusCore.get('/zoho/mail/test', async (request, reply) => {
    try {
      const EmailProcessor = require('../processors/emailProcessor');
      const emailProcessor = new EmailProcessor();
      const healthStatus = await emailProcessor.healthCheck();
      
      return reply.status(200).send({
        status: 200,
        success: true,
        message: 'Zoho Mail connectivity test completed',
        data: healthStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error testing Zoho Mail connectivity:', error);
      return reply.status(500).send({
        status: 500,
        success: false,
        error: 'Zoho Mail connectivity test failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Zoho OAuth callback route
  nexusCore.get('/zoho/callback', async (request, reply) => {
    try {
      const { code } = request.query;
      
      if (!code) {
        return reply.status(400).send({
          status: 400,
          status_message: 'Bad Request',
          error: 'Authorization code missing from callback',
          processor: 'NEXUS CRM OAuth Handler'
        });
      }

      // Exchange authorization code for refresh token
      const tokenResponse = await exchangeCodeForToken(code);
      
      return reply.status(200).send({
        status: 200,
        status_message: 'OK',
        message: 'Authorization successful! Copy the refresh token to your .env file.',
        refresh_token: tokenResponse.refresh_token,
        instructions: {
          step_1: `Copy this refresh token: ${tokenResponse.refresh_token}`,
          step_2: 'Update ZOHO_REFRESH_TOKEN in your .env file',
          step_3: 'Restart NEXUS server'
        },
        processor: 'NEXUS CRM OAuth Handler'
      });
      
    } catch (error) {
      console.error('🧠 OAuth callback error:', error);
      return reply.status(500).send({
        status: 500,
        status_message: 'Internal Server Error',
        error: 'Failed to exchange authorization code for refresh token',
        details: error.message,
        processor: 'NEXUS CRM OAuth Handler'
      });
    }
  });
  
}

// Function to exchange authorization code for refresh token
async function exchangeCodeForToken(authCode) {
  const fetch = require('node-fetch');
  
  const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    redirect_uri: 'http://localhost:3000/zoho/callback',
    code: authCode
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
  }

  return await response.json();
}

// Function to exchange Zoho Mail authorization code for tokens
async function exchangeMailCodeForTokens(authCode) {
  try {
    const fetch = require('node-fetch');
    
    const clientId = process.env.ZOHO_MAIL_CLIENT_ID;
    const clientSecret = process.env.ZOHO_MAIL_CLIENT_SECRET;
    const redirectUri = process.env.ZOHO_MAIL_REDIRECT_URI || 'http://localhost:3000/zoho/mail/callback';

    console.log('🔍 Debug - Mail token exchange starting...');
    console.log('Client ID:', clientId ? 'Present' : 'Missing');
    console.log('Client Secret:', clientSecret ? 'Present' : 'Missing');
    console.log('Redirect URI:', redirectUri);
    console.log('Auth Code:', authCode.substring(0, 20) + '...');

    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: 'Missing Zoho Mail client credentials in environment variables'
      };
    }

    const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: authCode
    });

    console.log('🔄 Making token exchange request to:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams
    });

    console.log('📡 Token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Token exchange error response:', errorText);
      return {
        success: false,
        error: `Token exchange failed: ${response.status} - ${errorText}`
      };
    }

    const tokenData = await response.json();
    console.log('✅ Token exchange successful, received data:', {
      access_token: tokenData.access_token ? 'Present' : 'Missing',
      refresh_token: tokenData.refresh_token ? 'Present' : 'Missing',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type
    });
    console.log('🔍 FULL TOKEN RESPONSE:', JSON.stringify(tokenData, null, 2));
    
    // Update .env file with new tokens
    const envUpdateResult = await updateEnvFileWithTokens({
      ZOHO_MAIL_ACCESS_TOKEN: tokenData.access_token,
      ZOHO_MAIL_REFRESH_TOKEN: tokenData.refresh_token
    });

    if (!envUpdateResult.success) {
      return {
        success: false,
        error: 'Failed to update .env file with tokens'
      };
    }

    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    };
  } catch (error) {
    console.log('❌ Token exchange exception:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to update .env file with new tokens
async function updateEnvFileWithTokens(tokens) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf8');

    // Update or add each token
    for (const [key, value] of Object.entries(tokens)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    await fs.writeFile(envPath, envContent);
    console.log('💾 Updated .env file with new mail tokens');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = crmPathways; 