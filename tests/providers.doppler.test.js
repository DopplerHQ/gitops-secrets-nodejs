// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");
const doppler = require("../src/providers/doppler/index");

// Store service token so it can be removed and restored during tests
const DOPPLER_TOKEN = process.env.DOPPLER_TOKEN;

beforeAll(() => {
  if (spawnSync("doppler").status !== 0) {
    throw "Doppler CLI install check failed";
  }

  if (!process.env.DOPPLER_TOKEN) {
    throw `Doppler CLI auth check failed: The 'DOPPLER_TOKEN' environment variable is required`;
  }

  const secretsCheck = spawnSync("doppler", ["secrets"]);
  if (secretsCheck.status !== 0) {
    throw `Doppler CLI secrets check failed: ${secretsCheck.stderr}`;
  }
});

test("CLI fails without valid format", () => {
  expect(() => doppler.cli.download("aaa")).toThrow();
});

test("CLI succeeds with valid format", () => {
  expect(doppler.cli.download("json")).toBeTruthy();
});

test("API fails without DOPPLER_TOKEN environment variable", async () => {
  delete process.env.DOPPLER_TOKEN;
  await expect(doppler.api.download()).rejects.toContain("Doppler API Error");
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("API fails with invalid format", async () => {
  await expect(doppler.api.download("aaa")).rejects.toContain("'format' must be one of");
});

test("API succeeds with valid format and DOPPLER_TOKEN environment variable", async () => {
  await expect(doppler.api.download("yaml")).resolves.toContain("DOPPLER_PROJECT");
});

test("fetchAsync fails without DOPPLER_TOKEN environment variable", async () => {
  delete process.env.DOPPLER_TOKEN;
  const stdio = await doppler.fetchAsync();
  expect(stdio.stderr).toContain("'DOPPLER_TOKEN' environment variable is required");
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("fetchAsync ignores with invalid format", async () => {
  const PROCESS_ARGV = [...process.argv];
  process.argv = ["", "", "--format", "aaa"];
  const stdio = await doppler.fetchAsync();
  expect(stdio.stderr).toBe(null);
  process.argv = PROCESS_ARGV;
});

test("fetchAsync succeeds with valid format and DOPPLER_TOKEN environment variable", async () => {
  const stdio = await doppler.fetchAsync();
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

test("fetch fails with invalid format", () => {
  expect(() => doppler.fetch("aaa")).toThrow();
});
