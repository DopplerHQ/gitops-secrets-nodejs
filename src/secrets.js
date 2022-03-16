const crypto = require("crypto");

const PBKDF2_ROUNDS = process.env.GITOPS_SECRETS_PBKDF2_ROUNDS || 1000000;
const PBKDF2_KEYLEN = process.env.GITOPS_SECRETS_PBKDF2_KEYLEN || 32;
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

const populateEnv = (payload) => (process.env = { ...process.env, ...payload });

/**
 * Encrypt secrets from Object to JSON format
 * @param {string} secrets
 * @returns {string}
 */
function encrypt(secrets) {
  const salt = crypto.randomBytes(AES_SALT_BYTES);
  const iv = crypto.randomBytes(AES_IV_BYTES);

  // construct key
  const key = crypto.pbkdf2Sync(masterKey(), salt, PBKDF2_ROUNDS, PBKDF2_KEYLEN, PBKDF2_DIGEST);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const cipherText = Buffer.concat([cipher.update(JSON.stringify(secrets), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combinedData = Buffer.concat([cipherText, authTag]);

  return `${ENCODING_PREFIX}${PBKDF2_ROUNDS}-${PBKDF2_KEYLEN}-${salt.toString("base64")}-${iv.toString(
    "base64"
  )}-${combinedData.toString("base64")}`;
}

/**
 * Decrypt secrets in JSON format to Object
 * @param {string} secrets
 * @returns {string}
 */
function decrypt(secrets) {
  secrets = secrets.substring(ENCODING_PREFIX.length);

  // decode file contents
  const parts = secrets.split("-");
  const rounds = parseInt(Buffer.from(parts[0], "utf8"), 10);
  const keyLength = parseInt(Buffer.from(parts[1], "utf8"), 10);
  const salt = Buffer.from(parts[2], ENCODING);
  const iv = Buffer.from(parts[3], ENCODING);
  const data = Buffer.from(parts[4], ENCODING);
  const cipherText = data.slice(0, data.length - AES_AUTH_TAG_BYTES);
  const authTag = data.slice(data.length - AES_AUTH_TAG_BYTES);

  // construct key
  const key = crypto.pbkdf2Sync(masterKey(), salt, rounds, keyLength, PBKDF2_DIGEST);

  // decrypt cipher text
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv).setAuthTag(authTag);
  const decrypted = decipher.update(cipherText, "binary", "utf8") + decipher.final("utf8");
  return JSON.parse(decrypted);
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
  populateEnv: populateEnv,
};
