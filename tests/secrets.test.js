const fs = require("fs");
const path = require("path");
const secrets = require("../src/secrets");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const read = (file) => fs.readFileSync(path.resolve(file), { encoding: "utf8" });
const rm = (...files) => files.forEach((file) => fs.rmSync(path.resolve(file)));

const GITOPS_SECRETS_MASTER_KEY = "1e18cc54-1d77-45a1-ae46-fecebce35ae2";
beforeEach(() => (process.env.GITOPS_SECRETS_MASTER_KEY = GITOPS_SECRETS_MASTER_KEY));

const TINY_SECRETS = "A=B";
const JSON_SECRETS = `{ "API_KEY": "dfa64ad2-462e-4751-b46e-3660c91f1811" }`;
const ENV_SECRETS = `API_KEY="dfa64ad2-462e-4751-b46e-3660c91f1811"`;

test("Fail when process.env.GITOPS_SECRETS_MASTER_KEY is undefined", () => {
  process.env.GITOPS_SECRETS_MASTER_KEY = undefined;
  expect(() => secrets.encrypt(JSON_SECRETS)).toThrow();
  expect(() => secrets.masterKey()).toThrow();
});

test("Fail when process.env.GITOPS_SECRETS_MASTER_KEY is less than 16 chars", () => {
  process.env.GITOPS_SECRETS_MASTER_KEY = "6791f8e3";
  expect(() => secrets.encrypt(JSON_SECRETS)).toThrow();
  expect(() => secrets.masterKey()).toThrow();
});

test("Tiny secret string", () => {
  expect(secrets.decrypt(secrets.encrypt(TINY_SECRETS))).toBe(TINY_SECRETS);
});

test("Decrypt with incorrect master key", () => {
  const encrypted = secrets.encrypt(TINY_SECRETS);
  process.env.GITOPS_SECRETS_MASTER_KEY = "bc284ab4-afe3-4284-8c7e-377183808866";
  expect(() => secrets.decrypt(encrypted)).toThrow();
});

test("JSON string", () => {
  expect(secrets.decrypt(secrets.encrypt(JSON_SECRETS))).toBe(JSON_SECRETS);
});

test("ENV string", () => {
  expect(secrets.decrypt(secrets.encrypt(ENV_SECRETS))).toBe(ENV_SECRETS);
});

test("ENV file contents", () => {
  const envFile = read("./tests/fixtures/.env");
  expect(secrets.decrypt(secrets.encrypt(envFile))).toBe(envFile);
});

test("JSON file contents", () => {
  const jsonFile = read("./tests/fixtures/secrets.json");
  expect(secrets.decrypt(secrets.encrypt(jsonFile))).toBe(jsonFile);
});

test("ENV file", () => {
  secrets.encryptFile("./tests/fixtures/.env", "./.env.enc");
  secrets.decryptFile("./.env.enc", "./.env");
  expect(read("./tests/fixtures/.env")).toBe(read("./.env"));
  rm("./.env.enc", "./.env");
});

test("JSON file", () => {
  secrets.encryptFile("./tests/fixtures/secrets.json", "./secrets.json.enc");
  secrets.decryptFile("./secrets.json.enc", "./secrets.json");
  expect(read("./secrets.json")).toBe(read("./tests/fixtures/secrets.json"));
  rm("./secrets.json.enc", "./secrets.json");
});

test("decryptEnvFile", () => {
  const data = secrets.decryptEnvFile("./tests/fixtures/.env.enc");
  expect(data.API_KEY).not.toBeUndefined();
  expect(data.AUTH_TOKEN).not.toBeUndefined();
  expect(process.env.API_KEY).toBeUndefined();
  expect(process.env.AUTH_TOKEN).toBeUndefined();
});

test("decryptEnvFile populate process.env", () => {
  const data = secrets.decryptEnvFile("./tests/fixtures/.env.enc", { populateEnv: true });
  expect(data.API_KEY).not.toBeUndefined();
  expect(data.AUTH_TOKEN).not.toBeUndefined();
  expect(process.env.API_KEY).not.toBeUndefined();
  expect(process.env.AUTH_TOKEN).not.toBeUndefined();
});

test("decryptJSON", () => {
  const data = secrets.decryptJSON("./tests/fixtures/secrets.json.enc");
  expect(data.API_KEY).toBeDefined();
  expect(data.AUTH_TOKEN).toBeDefined();
});

test("decryptJSON populate process.env", () => {
  const data = secrets.decryptJSON("./tests/fixtures/secrets.json.enc", { populateEnv: true });
  expect(data.API_KEY).toBeDefined();
  expect(data.AUTH_TOKEN).toBeDefined();
  expect(process.env.API_KEY).toBeDefined();
  expect(process.env.AUTH_TOKEN).toBeDefined();
});

test("Doppler CLI .env", () => {
  const envFile = read("./tests/fixtures/doppler.env");
  expect(() => secrets.decrypt(envFile)).not.toThrow();
});
