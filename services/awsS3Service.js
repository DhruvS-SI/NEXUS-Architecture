const AWS = require('aws-sdk');
const path = require('path');

class AWSS3Service {
    constructor() {
        // Initialize AWS S3 configuration
        this.region = process.env.AWS_REGION || 'ap-south-1';
        this.bucketName = process.env.AWS_S3_BUCKET || 'assets-spz.sportz.io';
        this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        
        // Check if AWS credentials are configured
        this.isConfigured = !!(this.accessKeyId && this.secretAccessKey);
        
        if (this.isConfigured) {
            // Configure AWS SDK
            AWS.config.update({
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
                region: this.region
            });
            
            this.s3 = new AWS.S3();
            console.log('🌩️ AWS S3 service initialized');
        } else {
            console.log('⚠️ AWS S3 credentials not configured - using local storage only');
        }
    }

    // 📤 Upload file to S3
    async uploadToS3(fileBuffer, fileName, mimeType) {
        if (!this.isConfigured) {
            throw new Error('AWS S3 credentials not configured');
        }

        try {
            // Generate S3 key (path) for the file
            const s3Key = `uploads/blogs/${fileName}`;
            
            const uploadParams = {
                Bucket: this.bucketName,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: mimeType,
                ACL: 'public-read', // Make file publicly accessible
                CacheControl: 'max-age=31536000', // Cache for 1 year
                Metadata: {
                    'uploaded-by': 'Admin',
                    'upload-timestamp': Date.now().toString()
                }
            };

            const result = await this.s3.upload(uploadParams).promise();
            
            return {
                success: true,
                url: result.Location,
                key: result.Key,
                bucket: result.Bucket,
                etag: result.ETag
            };
        } catch (error) {
            console.error('❌ S3 upload failed:', error);
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }

    // 🗑️ Delete file from S3
    async deleteFromS3(s3Key) {
        if (!this.isConfigured) {
            throw new Error('AWS S3 credentials not configured');
        }

        try {
            const deleteParams = {
                Bucket: this.bucketName,
                Key: s3Key
            };

            await this.s3.deleteObject(deleteParams).promise();
            
            return {
                success: true,
                message: `File ${s3Key} deleted successfully`
            };
        } catch (error) {
            console.error('❌ S3 delete failed:', error);
            throw new Error(`S3 delete failed: ${error.message}`);
        }
    }

    // 📋 List files in S3 bucket
    async listFiles(prefix = 'uploads/blogs/', maxKeys = 100) {
        if (!this.isConfigured) {
            throw new Error('AWS S3 credentials not configured');
        }

        try {
            const listParams = {
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys
            };

            const result = await this.s3.listObjectsV2(listParams).promise();
            
            return {
                success: true,
                files: result.Contents.map(file => ({
                    key: file.Key,
                    size: file.Size,
                    lastModified: file.LastModified,
                    url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${file.Key}`
                })),
                count: result.KeyCount,
                isTruncated: result.IsTruncated
            };
        } catch (error) {
            console.error('❌ S3 list failed:', error);
            throw new Error(`S3 list failed: ${error.message}`);
        }
    }

    // 🔍 Check if S3 service is available
    isAvailable() {
        return this.isConfigured;
    }

    // 🌐 Get public URL for S3 object
    getPublicUrl(s3Key) {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
    }

    // 🔧 Health check for S3 connection
    async healthCheck() {
        if (!this.isConfigured) {
            return {
                status: 'disabled',
                message: 'AWS S3 credentials not configured'
            };
        }

        try {
            // Try to list bucket contents (minimal operation)
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();
            
            return {
                status: 'connected',
                message: 'AWS S3 connection successful',
                bucket: this.bucketName,
                region: this.region
            };
        } catch (error) {
            return {
                status: 'error',
                message: `AWS S3 connection failed: ${error.message}`,
                bucket: this.bucketName,
                region: this.region
            };
        }
    }
}

module.exports = AWSS3Service; 