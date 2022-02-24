const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { log } = require("./utils.js");

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
 * Encrypt contents to a file
 * @param {string} encryptedFile
 * @param {string} secrets
 */
function encryptToFile(encryptedFile, secrets) {
  writeFileContents(encryptedFile, encrypt(secrets), "encrypted");
}

/**
 * Encrypt a file. Overwrites the unencrypted file if the encryptedFile is not supplied.
 * @param {string} unencryptedFile
 * @param {string} [encryptedFile]
 */
function encryptFile(unencryptedFile, encryptedFile) {
  encryptedFile = encryptedFile || unencryptedFile;

  try {
    const fileContents = readFileContents(unencryptedFile, "unencrypted");
    const encryptedSecrets = encrypt(fileContents);
    writeFileContents(encryptedFile, encryptedSecrets, "encrypted");
  } catch (error) {
    log(`Unable to encrypt ${unencryptedFile}`);
    throw error;
  }

  log(`Encrypted ${unencryptedFile} to ${encryptedFile}`);
  return encryptedFile;
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
 * return decrypted file contents
 * @param {string} encryptedFile
 * @param {string} secrets
 */
function decryptFromFile(encryptedFile) {
  return decrypt(readFileContents(encryptedFile, "decrypted"));
}

/**
 * Decrypt a file. Overwrites the encrypted file if decryptedFile is not supplied.
 * @param {string} encryptedFile
 * @param {string} [decryptedFile]
 */
function decryptFile(encryptedFile, decryptedFile) {
  decryptedFile = decryptedFile || encryptedFile;

  try {
    const secretsFileContents = readFileContents(encryptedFile, "encrypted");
    const decryptedSecrets = decrypt(secretsFileContents);
    writeFileContents(decryptedFile, decryptedSecrets, "decrypted");
  } catch (error) {
    log(`Unable to decrypt ${encryptedFile}`);
    throw error;
  }

  log(`Decrypted ${encryptedFile} to ${decryptedFile}`);
  return decryptedFile;
}

/**
 * Parse encrypted .env file and return as Key-Value object
 * @param {string} filePath
 * @param {{populateEnv: boolean}} [options={ populateEnv: false }]
 * @returns {object}}
 */
function decryptEnvFile(filePath, options = { populateEnv: false }) {
  const data = dotenv.parse(decryptFromFile(path.resolve(filePath)));
  if (options.populateEnv) {
    process.env = { ...process.env, ...data };
  }

  return data;
}

/**
 * Return parsed decrypted JSON file
 * @param {string} filePath
 * @param {{populateEnv: boolean}} [options={ populateEnv: false }]
 * @returns {object}
 */
function decryptJSON(filePath, options = { populateEnv: false }) {
  const data = JSON.parse(decryptFromFile(filePath));
  if (options.populateEnv) {
    process.env = { ...process.env, ...data };
  }

  return data;
}

/**
 * Read the contents of a file
 * @param {string} filePath
 * @param {string} form encrypted | unencrypted
 * @returns
 */
function readFileContents(filePath, form) {
  filePath = path.resolve(filePath);
  log(`Reading ${form} secrets = require(${filePath}`);

  let fileContents = null;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fileContents = fs.readFileSync(filePath, { encoding: "utf-8" });
  } catch (error) {
    log(`Unable to read ${form} secrets = require(${filePath}`);
    throw error;
  }

  return fileContents;
}

/**
 * Write the contents to a file
 * @param {string} filePath
 * @param {string} fileContents
 * @param {string} form encrypted | unencrypted
 */
function writeFileContents(filePath, fileContents, form) {
  filePath = path.resolve(filePath);
  log(`Writing ${form} secrets to ${filePath}`);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath, fileContents, { encoding: "utf-8" });
  } catch (error) {
    log(`Unable to write ${form} secrets = require(${filePath}`);
    throw error;
  }
}

module.exports = {
  encrypt: encrypt,
  encryptToFile: encryptToFile,
  encryptFile: encryptFile,
  decrypt: decrypt,
  decryptFromFile: decryptFromFile,
  decryptFile: decryptFile,
  decryptEnvFile: decryptEnvFile,
  decryptJSON: decryptJSON,
};
