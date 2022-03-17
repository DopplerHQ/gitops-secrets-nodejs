const fs = require("fs");
const path = require("path");
const secrets = require("../src/index");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const read = (file) => fs.readFileSync(path.resolve(file), { encoding: "utf8" });
const rm = (...files) => files.forEach((file) => fs.rmSync(path.resolve(file)));

const PROCESS_ENV = process.env;
const GITOPS_SECRETS_MASTER_KEY = "1e18cc54-1d77-45a1-ae46-fecebce35ae2";
beforeEach(() => (process.env = { ...PROCESS_ENV, GITOPS_SECRETS_MASTER_KEY: GITOPS_SECRETS_MASTER_KEY }));

const SECRETS = {
  API_KEY: "46f181e0-d68c-49d2-aa4c-1dd30d954877",
  AUTH_TOKEN: "cb71114f-22c3-4a66-af06-39d8d39a2af3",
};

const SECRETS_FETCH = async () => SECRETS;

test("Fail when process.env.GITOPS_SECRETS_MASTER_KEY is undefined", () => {
  process.env.GITOPS_SECRETS_MASTER_KEY = undefined;
  expect(() => secrets.encrypt(SECRETS)).toThrow();
  expect(() => secrets.masterKey()).toThrow();
});

test("Fail when process.env.GITOPS_SECRETS_MASTER_KEY is less than 16 chars", () => {
  process.env.GITOPS_SECRETS_MASTER_KEY = "6791f8e3";
  expect(() => secrets.encrypt(SECRETS)).toThrow();
  expect(() => secrets.masterKey()).toThrow();
});

test("Encrypt and decrypt in memory", () => {
  expect(secrets.decrypt(secrets.encrypt(SECRETS))).toHaveProperty("API_KEY");
});

test("Secrets build", async () => {
  await secrets.build(SECRETS_FETCH);
  expect(secrets.loadSecrets()).toHaveProperty(`API_KEY`);
  rm(secrets.DEFAULT_JS_PATH);
});

test("Secrets build with populateEnv", async () => {
  expect(process.env).not.toHaveProperty(`API_KEY`);
  await secrets.build(SECRETS_FETCH);
  secrets.loadSecrets().populateEnv();
  expect(process.env).toHaveProperty(`API_KEY`);
  rm(secrets.DEFAULT_JS_PATH);
});

test("Secrets build with a path", async () => {
  const SECRETS_PATH = ".secrets/custom.enc.js";
  await secrets.build(SECRETS_FETCH, { path: SECRETS_PATH });
  // eslint-disable-next-line security/detect-non-literal-require
  expect(require(`../${SECRETS_PATH}`).loadSecrets()).toHaveProperty("API_KEY");
  rm(SECRETS_PATH);
});

test("Secrets build outputs in CommonJS format, even if project uses modules as require is performed locally", async () => {
  const NPM_PACKAGE_TYPE = process.env.npm_package_type;
  process.env.npm_package_type = "module";
  await secrets.build(SECRETS_FETCH);
  expect(read(secrets.DEFAULT_JS_PATH)).toContain("module.exports");
  rm(secrets.DEFAULT_JS_PATH);
  process.env.npm_package_type = NPM_PACKAGE_TYPE;
});

test("Secrets build outputs in ES modules format path is provided", async () => {
  const SECRETS_PATH = ".secrets/custom.enc.js";
  const NPM_PACKAGE_TYPE = process.env.npm_package_type;
  process.env.npm_package_type = "module";
  await secrets.build(SECRETS_FETCH, { path: SECRETS_PATH });
  expect(read(SECRETS_PATH)).toContain("export {");
  rm(SECRETS_PATH);
  process.env.npm_package_type = NPM_PACKAGE_TYPE;
});

test("Encrypt to JSON file", async () => {
  secrets.encryptToFile(SECRETS);
  expect(secrets.decryptFromFile()).toHaveProperty("API_KEY");
  rm(secrets.DEFAULT_FILE_PATH);
});

test("Encrypt to JSON file with populateEnv", () => {
  secrets.encryptToFile(SECRETS);
  const payload = secrets.decryptFromFile();
  expect(process.env).not.toHaveProperty("API_KEY");
  expect(payload).toHaveProperty("API_KEY");
  payload.populateEnv();
  expect(process.env).toHaveProperty("API_KEY");
  rm(secrets.DEFAULT_FILE_PATH);
});

test("Encrypt to JSON file with path", () => {
  const SECRETS_PATH = ".secrets/custom.enc.json";
  secrets.encryptToFile(SECRETS, { path: SECRETS_PATH });
  const payload = secrets.decryptFromFile(SECRETS_PATH);
  expect(process.env).not.toHaveProperty("API_KEY");
  expect(payload).toHaveProperty("API_KEY");
  payload.populateEnv();
  expect(process.env).toHaveProperty("API_KEY");
  rm(SECRETS_PATH);
});
