const crypto = require("crypto");

const PBKDF2_ROUNDS = 50000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";
const ALGORITHM = "aes-256-gcm";
const AES_AUTH_TAG_BYTES = 16;
const AES_IV_BYTES = 12;
const AES_SALT_BYTES = 8;

const ENCODING = "base64";
const ENCODING_PREFIX = "base64:";

function masterKey() {
  if (!process.env.GITOPS_SECRETS_MASTER_KEY || process.env.GITOPS_SECRETS_MASTER_KEY.length < 16) {
    throw `The 'GITOPS_SECRETS_MASTER_KEY' environment variable must be set to a string of 16 characters or more`;
  }

  return process.env.GITOPS_SECRETS_MASTER_KEY;
}

/**
 * Encrypt secrets
 * @param {string} secrets
 * @returns {string}
 */
function encrypt(secrets) {
  const salt = crypto.randomBytes(AES_SALT_BYTES);
  const iv = crypto.randomBytes(AES_IV_BYTES);

  // construct key
  const key = crypto.pbkdf2Sync(masterKey(), salt, PBKDF2_ROUNDS, PBKDF2_KEYLEN, PBKDF2_DIGEST);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const cipherText = Buffer.concat([cipher.update(secrets, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combinedData = Buffer.concat([cipherText, authTag]);

  return `${ENCODING_PREFIX}${salt.toString("base64")}-${iv.toString("base64")}-${combinedData.toString("base64")}`;
}

/**
 * Decrypt secrets
 * @param {string} secrets
 * @returns {string}
 */
function decrypt(secrets) {
  secrets = secrets.substring(ENCODING_PREFIX.length);

  // decode file contents
  const parts = secrets.split("-");
  const salt = Buffer.from(parts[0], ENCODING);
  const iv = Buffer.from(parts[1], ENCODING);
  const data = Buffer.from(parts[2], ENCODING);
  const cipherText = data.slice(0, data.length - AES_AUTH_TAG_BYTES);
  const authTag = data.slice(data.length - AES_AUTH_TAG_BYTES);

  // construct key
  const key = crypto.pbkdf2Sync(masterKey(), salt, PBKDF2_ROUNDS, PBKDF2_KEYLEN, PBKDF2_DIGEST);

  // decrypt cipher text
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv).setAuthTag(authTag);
  const decrypted = decipher.update(cipherText, "binary", "utf8") + decipher.final("utf8");
  return decrypted;
}

/**
 * Return JSON parsed decrypted secrets
 * @param {string} secrets
 * @param {{populateEnv: boolean}} [options={ populateEnv: false }]
 * @returns {object}
 */
function decryptJSON(secrets, options = { populateEnv: false }) {
  const data = JSON.parse(decrypt(secrets));
  if (options.populateEnv) {
    process.env = { ...process.env, ...data };
  }

  return data;
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
  decryptJSON: decryptJSON,
};
