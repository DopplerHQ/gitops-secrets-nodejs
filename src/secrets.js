const crypto = require("crypto");

const PBKDF2_ROUNDS = process.env.GITOPS_SECRETS_PBKDF2_ROUNDS || 1000000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";
const ALGORITHM = "aes-256-gcm";
const AES_AUTH_TAG_BYTES = 16;
const AES_IV_BYTES = 12;
const AES_SALT_BYTES = 8;
const ENCODING = "base64";
const TEXT_ENCODING = "utf8";

function masterKey() {
  if (!process.env.GITOPS_SECRETS_MASTER_KEY || process.env.GITOPS_SECRETS_MASTER_KEY.length < 16) {
    throw new Error(`The 'GITOPS_SECRETS_MASTER_KEY' environment variable must be set to a string of 16 characters or more`);
  }

  return process.env.GITOPS_SECRETS_MASTER_KEY;
}

/**
 * Encrypt secrets from Object to JSON format
 * @param {string} secrets
 * @returns {string}
 */
function encrypt(secrets) {
  const salt = crypto.randomBytes(AES_SALT_BYTES);
  const iv = crypto.randomBytes(AES_IV_BYTES);
  const key = crypto.pbkdf2Sync(masterKey(), salt, PBKDF2_ROUNDS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const cipherText = Buffer.concat([cipher.update(JSON.stringify(secrets), TEXT_ENCODING), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combinedData = Buffer.concat([cipherText, authTag]);

  return `${ENCODING}:${PBKDF2_ROUNDS}:${salt.toString(ENCODING)}:${iv.toString(ENCODING)}:${combinedData.toString(ENCODING)}`;
}

/**
 * Decrypt secrets in JSON format to Object
 * @param {string} secrets
 * @returns {string}
 */
function decrypt(secrets) {
  secrets = secrets.substring(`${ENCODING}:`.length);

  // Decode file contents
  const parts = secrets.split(":");
  if (parts.length !== 4) {
    throw new Error(`Encrypted payload invalid. Expected 4 sections but only got ${parts.length}`);
  }

  const rounds = parseInt(Buffer.from(parts[0], TEXT_ENCODING), 10);
  const salt = Buffer.from(parts[1], ENCODING);
  const iv = Buffer.from(parts[2], ENCODING);
  const data = Buffer.from(parts[3], ENCODING);
  const cipherText = data.slice(0, data.length - AES_AUTH_TAG_BYTES);
  const authTag = data.slice(data.length - AES_AUTH_TAG_BYTES);

  // construct key
  const key = crypto.pbkdf2Sync(masterKey(), salt, rounds, PBKDF2_KEYLEN, PBKDF2_DIGEST);

  // decrypt cipher text
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv).setAuthTag(authTag);
  const decrypted = decipher.update(cipherText, "binary", TEXT_ENCODING) + decipher.final("utf8");
  return JSON.parse(decrypted);
}

/**
 * Merge the payload object with process.env
 * @param {Record<string, any>} payload
 */
function populateEnv(payload) {
  process.env = { ...process.env, ...payload };
  return payload;
}

/**
 * Decrypt secrets and supply a `populateEnv` method for convenience
 * @param {string} cipherText
 * @returns {Record<string, any>}
 */
function loadSecretsFromCipher(cipherText) {
  const payload = decrypt(cipherText);
  return { ...payload, populateEnv: () => populateEnv(payload) };
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
  populateEnv: populateEnv,
  loadSecretsFromCipher: loadSecretsFromCipher,
};
