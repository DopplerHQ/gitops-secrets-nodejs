// eslint-disable-next-line security/detect-child-process
const doppler = require("../src/providers/doppler");

if (!process.env.DOPPLER_TOKEN) {
  throw new Error(`Doppler provider tests require a valid 'DOPPLER_TOKEN' environment variable`);
}

// Store service token so it can be removed and restored
const DOPPLER_TOKEN = process.env.DOPPLER_TOKEN;
beforeEach(() => (process.env.DOPPLER_TOKEN = DOPPLER_TOKEN));

test("fetch fails if DOPPLER_TOKEN environment variable and dopplerToken param are null", async () => {
  delete process.env.DOPPLER_TOKEN;
  await expect(doppler.fetch()).rejects.toThrowError("Doppler API Error");
});

test("fetch fails with invalid DOPPLER_TOKEN environment variable", async () => {
  process.env.DOPPLER_TOKEN = "XXXX";
  await expect(doppler.fetch()).rejects.toThrowError();
});

test("fetch fails with invalid dopplerToken param", async () => {
  await expect(doppler.fetch({ dopplerToken: "XXXX" })).rejects.toThrowError();
});

test("fetch succeeds with DOPPLER_TOKEN environment variable", async () => {
  await expect(doppler.fetch()).resolves.toHaveProperty("DOPPLER_PROJECT");
});

test("fetch succeeds with valid dopplerToken param", async () => {
  delete process.env.DOPPLER_TOKEN;
  await expect(doppler.fetch({ dopplerToken: DOPPLER_TOKEN })).resolves.toHaveProperty("DOPPLER_PROJECT");
});
