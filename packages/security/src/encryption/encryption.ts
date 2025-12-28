import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT = 'bosdb-salt-v1'; // In production, use a secure random salt

/**
 * Credential encryption service using AES-256-GCM
 * Provides authenticated encryption for sensitive database credentials
 */
export class CredentialEncryption {
    private key: Buffer;

    constructor(masterKey?: string) {
        // In production, this should come from environment variable or secret manager
        const keySource = masterKey || process.env.ENCRYPTION_MASTER_KEY;
        if (!keySource) {
            throw new Error('Encryption master key not configured. Set ENCRYPTION_MASTER_KEY environment variable.');
        }

        // Derive encryption key from master key using scrypt
        this.key = crypto.scryptSync(keySource, SALT, KEY_LENGTH);
    }

    /**
     * Encrypt credentials data
     * @param data Credentials object to encrypt
     * @returns Base64-encoded encrypted string
     */
    encrypt(data: any): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

        const plaintext = JSON.stringify(data);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        // Combine IV + encrypted data + auth tag
        const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), tag]);

        return combined.toString('base64');
    }

    /**
     * Decrypt credentials data
     * @param encryptedData Base64-encoded encrypted string
     * @returns Decrypted credentials object
     */
    decrypt(encryptedData: string): any {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');

            const iv = buffer.subarray(0, IV_LENGTH);
            const tag = buffer.subarray(buffer.length - TAG_LENGTH);
            const encrypted = buffer.subarray(IV_LENGTH, buffer.length - TAG_LENGTH);

            const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return JSON.parse(decrypted.toString('utf8'));
        } catch (error: any) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Hash a password or sensitive string (one-way)
     * @param value Value to hash
     * @returns Hex-encoded hash
     */
    hash(value: string): string {
        return crypto.createHash('sha256').update(value).digest('hex');
    }

    /**
     * Generate a secure random token
     * @param length Token length in bytes (default: 32)
     * @returns Hex-encoded random token
     */
    static generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }
}

/**
 * Helper functions for credential encryption
 */

let encryptionInstance: CredentialEncryption | null = null;

export function getEncryptionInstance(): CredentialEncryption {
    if (!encryptionInstance) {
        encryptionInstance = new CredentialEncryption();
    }
    return encryptionInstance;
}

export function encryptCredentials(credentials: any): string {
    return getEncryptionInstance().encrypt(credentials);
}

export function decryptCredentials(encryptedData: string): any {
    return getEncryptionInstance().decrypt(encryptedData);
}
