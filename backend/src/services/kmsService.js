const crypto = require('crypto');
const AWS = require('aws-sdk');
const { KeyManagementServiceClient, SignCommand, VerifyCommand } = require('@google-cloud/kms');
const { KeyClient } = require('@azure/keyvault-keys');
const { DefaultAzureCredential } = require('@azure/identity');

const logger = require('../utils/logger');

class KMSService {
  constructor() {
    this.provider = this.detectProvider();
    this.initializeProvider();
  }

  detectProvider() {
    if (process.env.AWS_REGION && process.env.KMS_KEY_ID) {
      return 'aws';
    } else if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GCP_KMS_KEY) {
      return 'gcp';
    } else if (process.env.AZURE_KEY_VAULT_URL) {
      return 'azure';
    } else {
      logger.warn('No KMS provider configured, using local signing (NOT RECOMMENDED FOR PRODUCTION)');
      return 'local';
    }
  }

  initializeProvider() {
    switch (this.provider) {
      case 'aws':
        this.awsKms = new AWS.KMS({
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        break;
      
      case 'gcp':
        this.gcpKms = new KeyManagementServiceClient({
          projectId: process.env.GOOGLE_CLOUD_PROJECT,
          keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
        });
        this.gcpKeyName = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/${process.env.GCP_KMS_LOCATION || 'global'}/keyRings/${process.env.GCP_KMS_KEY_RING}/cryptoKeys/${process.env.GCP_KMS_KEY}/cryptoKeyVersions/1`;
        break;
      
      case 'azure':
        this.azureCredential = new DefaultAzureCredential();
        this.azureKeyClient = new KeyClient(process.env.AZURE_KEY_VAULT_URL, this.azureCredential);
        break;
      
      case 'local':
        this.initializeLocalKeys();
        break;
    }
  }

  initializeLocalKeys() {
    const keyDir = require('path').join(__dirname, '../../../keys');
    const fs = require('fs');
    
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }

    const privateKeyPath = require('path').join(keyDir, 'private.pem');
    const publicKeyPath = require('path').join(keyDir, 'public.pem');

    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
      logger.info('Generating local RSA key pair for development');
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      fs.writeFileSync(privateKeyPath, privateKey);
      fs.writeFileSync(publicKeyPath, publicKey);
    }

    this.localPrivateKey = fs.readFileSync(privateKeyPath, 'utf8');
    this.localPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
  }

  async signData(data) {
    try {
      const dataBuffer = Buffer.from(data, 'utf8');
      
      switch (this.provider) {
        case 'aws':
          return await this.signWithAWS(dataBuffer);
        case 'gcp':
          return await this.signWithGCP(dataBuffer);
        case 'azure':
          return await this.signWithAzure(dataBuffer);
        case 'local':
          return this.signWithLocal(dataBuffer);
        default:
          throw new Error('No KMS provider configured');
      }
    } catch (error) {
      logger.error('Data signing failed', {
        provider: this.provider,
        error: error.message
      });
      throw error;
    }
  }

  async signWithAWS(dataBuffer) {
    const params = {
      KeyId: process.env.KMS_KEY_ID,
      Message: dataBuffer,
      MessageType: 'RAW',
      SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
    };

    const result = await this.awsKms.sign(params).promise();
    return result.Signature.toString('base64');
  }

  async signWithGCP(dataBuffer) {
    const digest = crypto.createHash('sha256').update(dataBuffer).digest();
    
    const request = {
      name: this.gcpKeyName,
      digest: {
        sha256: digest
      }
    };

    const [response] = await this.gcpKms.asymmetricSign(request);
    return Buffer.from(response.signature).toString('base64');
  }

  async signWithAzure(dataBuffer) {
    // Azure Key Vault implementation would go here
    // This is a simplified version
    const digest = crypto.createHash('sha256').update(dataBuffer).digest();
    
    // In a real implementation, you would use Azure Key Vault's sign operation
    // For now, we'll use a placeholder
    throw new Error('Azure KMS signing not fully implemented in this demo');
  }

  signWithLocal(dataBuffer) {
    const sign = crypto.createSign('SHA256');
    sign.update(dataBuffer);
    sign.end();
    
    const signature = sign.sign(this.localPrivateKey);
    return signature.toString('base64');
  }

  async verifySignature(data, signature) {
    try {
      const dataBuffer = Buffer.from(data, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');
      
      switch (this.provider) {
        case 'aws':
          return await this.verifyWithAWS(dataBuffer, signatureBuffer);
        case 'gcp':
          return await this.verifyWithGCP(dataBuffer, signatureBuffer);
        case 'azure':
          return await this.verifyWithAzure(dataBuffer, signatureBuffer);
        case 'local':
          return this.verifyWithLocal(dataBuffer, signatureBuffer);
        default:
          throw new Error('No KMS provider configured');
      }
    } catch (error) {
      logger.error('Signature verification failed', {
        provider: this.provider,
        error: error.message
      });
      return false;
    }
  }

  async verifyWithAWS(dataBuffer, signatureBuffer) {
    const params = {
      KeyId: process.env.KMS_KEY_ID,
      Message: dataBuffer,
      MessageType: 'RAW',
      Signature: signatureBuffer,
      SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
    };

    try {
      const result = await this.awsKms.verify(params).promise();
      return result.SignatureValid;
    } catch (error) {
      return false;
    }
  }

  async verifyWithGCP(dataBuffer, signatureBuffer) {
    const digest = crypto.createHash('sha256').update(dataBuffer).digest();
    
    const request = {
      name: this.gcpKeyName,
      digest: {
        sha256: digest
      },
      signature: signatureBuffer
    };

    try {
      const [response] = await this.gcpKms.asymmetricVerify(request);
      return response.verified;
    } catch (error) {
      return false;
    }
  }

  async verifyWithAzure(dataBuffer, signatureBuffer) {
    // Azure Key Vault verification would go here
    throw new Error('Azure KMS verification not fully implemented in this demo');
  }

  verifyWithLocal(dataBuffer, signatureBuffer) {
    const verify = crypto.createVerify('SHA256');
    verify.update(dataBuffer);
    verify.end();
    
    return verify.verify(this.localPublicKey, signatureBuffer);
  }

  getPublicKey() {
    switch (this.provider) {
      case 'local':
        return this.localPublicKey;
      default:
        // For cloud providers, you would retrieve the public key from the service
        return 'Public key retrieval not implemented for cloud providers in this demo';
    }
  }
}

module.exports = new KMSService();
