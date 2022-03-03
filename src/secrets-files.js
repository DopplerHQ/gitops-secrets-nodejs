const fs = require("fs");
const path = require("path");
const { log } = require("./utils.js");
const { encrypt, decrypt } = require("./secrets.js");

/**
 * Encrypt contents to a file
 * @param {string} encryptedFile
 * @param {string} secrets
 * @param {{format: string}} [options={format: null}] formats: cjs | esm
 */

function encryptToFile(encryptedFile, secrets, options = { format: null }) {
  const encryptedSecrets = encrypt(secrets);
  let fileContents;

  /**
   * Provide wrappers around encrypted data for environments like Vercel
   * where including and reading adhoc files is tricky.
   */
  switch (options.format) {
    case "cjs":
      fileContents = `const CIPHER_TEXT = "${encryptedSecrets}";\nmodule.exports = CIPHER_TEXT;`;
      break;
    case "esm":
      fileContents = `const CIPHER_TEXT = "${encryptedSecrets}";\nexport default CIPHER_TEXT;`;
      break;
    default:
      fileContents = encryptedSecrets;
      break;
  }

  writeFileContents(encryptedFile, fileContents, "encrypted");
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
 * Return parsed decrypted JSON file
 * @param {string} filePath
 * @param {{populateEnv: boolean}} [options={ populateEnv: false }]
 * @returns {object}
 */
function decryptJSONFile(filePath, options = { populateEnv: false }) {
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
  if (!fs) {
    throw "Unable to write to file system as the fs module is not available in this execution environment.";
  }

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
  if (!fs) {
    throw "Unable to write to file system as the fs module is not available in this execution environment.";
  }

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
  encryptToFile: encryptToFile,
  encryptFile: encryptFile,
  decryptFromFile: decryptFromFile,
  decryptJSONFile: decryptJSONFile,
  decryptFile: decryptFile,
};
