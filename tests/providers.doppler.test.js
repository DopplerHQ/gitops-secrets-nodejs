// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");
const doppler = require("../src/providers/doppler/index");

// Store service token so it can be removed and restored during tests
const DOPPLER_TOKEN = process.env.DOPPLER_TOKEN;

beforeAll(() => {
  if (spawnSync("doppler").status !== 0) {
    throw new Error("Doppler CLI install check failed");
  }

  if (!process.env.DOPPLER_TOKEN) {
    throw new Error(`Doppler CLI auth check failed: The 'DOPPLER_TOKEN' environment variable is required`);
  }

  const secretsCheck = spawnSync("doppler", ["secrets"]);
  if (secretsCheck.status !== 0) {
    throw new Error(`Doppler CLI secrets check failed: ${secretsCheck.stderr}`);
  }
});

test("API fails without DOPPLER_TOKEN environment variable", async () => {
  delete process.env.DOPPLER_TOKEN;
  await expect(doppler.api.fetch()).rejects.toContain("Doppler API Error");
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("API succeeds with DOPPLER_TOKEN environment variable", async () => {
  await expect(doppler.api.fetch()).resolves.toHaveProperty("DOPPLER_PROJECT");
});

test("fetchAsync fails without DOPPLER_TOKEN environment variable", async () => {
  delete process.env.DOPPLER_TOKEN;
  await expect(doppler.fetchAsync()).rejects.toContain("Doppler API Error");
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("fetchAsync succeeds with DOPPLER_TOKEN environment variable", async () => {
  await expect(doppler.fetchAsync()).resolves.toHaveProperty("DOPPLER_PROJECT");
});

test("fetch fails without DOPPLER_TOKEN environment variable ", () => {
  delete process.env.DOPPLER_TOKEN;
  expect(() => doppler.fetch()).toThrow();
  process.env.DOPPLER_TOKEN = DOPPLER_TOKEN;
});

test("fetch succeeds with DOPPLER_TOKEN environment variable", () => {
  expect(doppler.fetch()).toHaveProperty("DOPPLER_PROJECT");
});
