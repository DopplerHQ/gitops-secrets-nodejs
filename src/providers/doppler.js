const https = require("https");

/**
 * Fetch secrets from Doppler the API.
 * Requires the `DOPPLER_TOKEN` environment variable to be set. See https://docs.doppler.com/docs/enclave-service-tokens
 * @returns {() => Promise<Record<string, string>>}
 */
async function fetch() {
  if (!process.env.DOPPLER_TOKEN) {
    throw new Error("Doppler API Error: The 'DOPPLER_TOKEN' environment variable is required");
  }

  return new Promise(function (resolve, reject) {
    const encodedAuthData = Buffer.from(`${process.env.DOPPLER_TOKEN}:`).toString("base64");
    const authHeader = `Basic ${encodedAuthData}`;
    https
      .get(
        "https://api.doppler.com/v3/configs/config/secrets/download?format=json",
        {
          headers: {
            Authorization: authHeader,
          },
        },
        (res) => {
          let payload = "";
          res.on("data", (data) => (payload += data));
          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(payload));
            } else {
              const error = JSON.parse(payload).messages.join(" ");
              reject(new Error(`Doppler API Error: ${error}`));
            }
          });
        }
      )
      .on("error", (error) => {
        reject(new Error(`Doppler API Error: ${error}`));
      });
  });
}

module.exports = { fetch: fetch };
