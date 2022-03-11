const fs = require("fs");
const path = require("path");
const { log } = require("./utils.js");
const secrets = require("./secrets.js");
const DEFAULT_SECRETS_PATH = path.join(__dirname, "../secrets.enc.js");

let SECRETS_CACHE;

/**
 * Encrypt contents to a JS module. This is so secret contents can be accessed without the fs module or special handling
 * for static files for cases like Vercel where accessing arbitrary static files is incredibly challenging.
 * @param {{format: string, format: string }} [options={path: null, format: null}]
 */
function encryptToFile(secretsObject, options = { path: null, format: null }) {
  const cipherText = secrets.encrypt(secretsObject);
  const filePath = options.path ? path.resolve(options.path) : DEFAULT_SECRETS_PATH;
  const format = options.format || (process.env.npm_package_type === "module" ? "esm" : "cjs");
  const fileContents = `const CIPHER_TEXT = "${cipherText}"; ${format === "esm" ? 'export default CIPHER_TEXT;' : 'module.exports = CIPHER_TEXT;'}`;

  log(`Writing secrets to ${filePath}`);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath, fileContents, { encoding: "utf-8" });
  } catch (error) {
    log(`Unable to write secrets to ${filePath}`);
    throw error;
  }
}

/**
 * Decrypt secrets saved to a JS module in JSON format
 * @param {{ path: string, cache: boolean, populateEnv: boolean }} [{ path: null, cache: true, populateEnv: false }]
 * @returns
 */
function decryptFromFile(options = { path: null, cache: true, populateEnv: false }) {
  const secretsPath = options.path ? path.resolve(options.path) : DEFAULT_SECRETS_PATH;
  let secretsObject;

  if (SECRETS_CACHE && options.cache) {
    secretsObject = SECRETS_CACHE;
  } else {
    // eslint-disable-next-line security/detect-non-literal-require
    secretsObject = secrets.decrypt(require(secretsPath));
  }

  SECRETS_CACHE = options.cache ? secrets : null;
  process.env = options.populateEnv ? { ...process.env, ...secrets.fetch() } : process.env;

  return secretsObject;
}

module.exports = {
  encryptToFile: encryptToFile,
  decryptFromFile: decryptFromFile,
};
