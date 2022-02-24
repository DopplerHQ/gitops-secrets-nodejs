// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");
const doppler = require("../src/providers/doppler");

// Store service token so it can be removed and restored during tests
const DOPPLER_TOKEN = process.env.DOPPLER_TOKEN;

beforeAll(() => {
  if (spawnSync("doppler").status !== 0) {
    throw "Doppler CLI install check failed";
  }

  if (!process.env.DOPPLER_TOKEN) {
    throw `Doppler CLI auth check failed: The 'DOPPLER_SERVICE_TOKEN' environment variable is required`;
  }

  const secretsCheck = spawnSync("doppler", ["secrets"]);
  if (secretsCheck.status !== 0) {
    throw `Doppler CLI secrets check failed: ${secretsCheck.stderr}`;
  }
});

test("CLI fails without valid format", () => {
  expect(() => doppler.fetchCLI("aaa")).toThrow();
});

test("CLI succeeds with valid format", () => {
  expect(doppler.fetchCLI("json")).toBeTruthy();
});

test("fetchAPI fails without DOPPLER_TOKEN environment variable", async () => {
  delete process.env.DOPPLER_TOKEN;
  await expect(doppler.fetchAPI()).rejects.toContain("Doppler API Error");
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("fetchAPI fails with invalid format", async () => {
  await expect(doppler.fetchAPI("aaa")).rejects.toContain("Invalid format");
});

test("fetchAPI succeeds with valid format and DOPPLER_TOKEN environment variable", async () => {
  await expect(doppler.fetchAPI("yaml")).resolves.toContain("DOPPLER_PROJECT");
});

test("fetchAsScript fails without DOPPLER_TOKEN environment variable", async () => {
  delete process.env.DOPPLER_TOKEN;
  const stdio = await doppler.fetchAsScript();
  expect(stdio.stderr).toContain("'DOPPLER_TOKEN' environment variable is required");
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("fetchAsScript ignores with invalid format", async () => {
  const PROCESS_ARGV = [...process.argv];
  process.argv = ["", "", "--format", "aaa"];
  const stdio = await doppler.fetchAsScript();
  expect(stdio.stderr).toBe(null);
  process.argv = PROCESS_ARGV;
});

test("fetchAsScript succeeds with valid format and DOPPLER_TOKEN environment variable", async () => {
  const stdio = await doppler.fetchAsScript();
  expect(stdio.stdout).toContain("DOPPLER_PROJECT");
});

test("fetch fails without DOPPLER_TOKEN environment variable ", () => {
  delete process.env.DOPPLER_TOKEN;
  expect(() => doppler.fetch()).toThrow();
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("fetch fails without DOPPLER_TOKEN environment variable ", () => {
  delete process.env.DOPPLER_TOKEN;
  expect(() => doppler.fetch()).toThrow();
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("fetch ignores invalid format and falls back to JSON", () => {
  expect(JSON.parse(doppler.fetch("aaa"))).toHaveProperty("DOPPLER_PROJECT");
});
