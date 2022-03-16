const fs = require("fs");
const path = require("path");
const { log } = require("./utils.js");
const secrets = require("./secrets.js");
const DEFAULT_JS_PATH = path.join(__dirname, "../.secrets/.secrets.enc.js");
const DEFAULT_FILE_PATH = path.join(__dirname, "../.secrets/.secrets.enc.json");

/**
 * Build a JS module for accessing encrypted secrets at runtime to avoid needing direct file system access
 * @param {{format: string}} [options={path: null}]
 */
function build(payload, options = { path: null }) {
  const cipherText = secrets.encrypt(payload);
  const filePath = options.path ? path.resolve(options.path) : DEFAULT_JS_PATH;
  const packageType = process.env.npm_package_type === "module" ? "esm" : "cjs";
  const format = filePath === DEFAULT_JS_PATH ? "cjs" : packageType;
  const fileLines = ["/* eslint-disable */"];
  switch (format) {
    case "esm":
      fileLines.push(
        'import secrets from "gitops-secrets";',
        `const CIPHER_TEXT = "${cipherText}";`,
        "const loadSecrets = (options = { populateEnv: false }) => secrets.load(CIPHER_TEXT, options);",
        "export { CIPHER_TEXT, loadSecrets };"
      );
      break;
    case "cjs":
      fileLines.push(
        'const secrets = require("gitops-secrets");',
        `const CIPHER_TEXT = "${cipherText}";`,
        "module.exports = { CIPHER_TEXT: CIPHER_TEXT, loadSecrets: (options = { populateEnv: false }) => secrets.load(CIPHER_TEXT, options) };"
      );
      break;
  }

  writeFile(filePath, fileLines.join("\n"));
}

/**
 * Encrypt JSON-serializable payload to a static file
 * @param {object} payload
 * @param {{path: string}} [options={ path: null }]
 */
function encryptToFile(payload, options = { path: null }) {
  const cipherText = secrets.encrypt(payload);
  const filePath = options.path ? path.resolve(options.path) : DEFAULT_FILE_PATH;
  writeFile(filePath, cipherText);
}

/**
 * Decrypt JSON payload to object with option to merge with process.env
 * @param {string} filePath
 * @param {{ populateEnv: boolean }} [{ path: null, cache: true, populateEnv: false }]
 * @returns
 */
function decryptFromFile(filePath, options = { populateEnv: false }) {
  filePath = filePath ? path.resolve(filePath) : DEFAULT_FILE_PATH;
  log(`Reading secrets from ${filePath}`);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const payload = secrets.decrypt(fs.readFileSync(filePath, { encoding: "utf-8" }));
    process.env = options.populateEnv ? { ...process.env, ...payload } : process.env;
    return payload;
  } catch (error) {
    throw `Unable to read secrets from ${filePath}: ${error}`;
  }
}

function writeFile(filePath, fileContents) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath, fileContents, { encoding: "utf-8" });
  } catch (error) {
    throw `Unable to write secrets to ${filePath}: ${error}`;
  }
}

function loadSecrets(options = { populateEnv: false }) {
  // eslint-disable-next-line security/detect-non-literal-require
  const cipherText = require(DEFAULT_JS_PATH).CIPHER_TEXT;
  return secrets.load(cipherText, options);
}

module.exports = {
  build: build,
  encryptToFile: encryptToFile,
  decryptFromFile: decryptFromFile,
  loadSecrets: loadSecrets,
};
