const https = require("https");
const { log } = require("../../utils.js");

/**
 * Fetch secrets from Doppler the API. Requires the `DOPPLER_TOKEN` environment variable to be set. See https://docs.doppler.com/docs/enclave-service-tokens
 * @returns {Promise}
 */
async function fetch() {
  if (!process.env.DOPPLER_TOKEN) {
    throw new Error("Doppler API Error: The 'DOPPLER_TOKEN' environment variable is required");
  }

  log("Fetching secrets from API");

  return new Promise(function (resolve, reject) {
    const encodedAuthData = Buffer.from(`${process.env.DOPPLER_TOKEN}:`).toString("base64");
    const authHeader = `Basic ${encodedAuthData}`;
    https
      .get(
        "https://api.doppler.com/v3/configs/config/secrets/download",
        {
          headers: {
            Authorization: authHeader,
          },
        },
        (res) => {
          let secrets = "";
          res.on("data", (data) => (secrets += data));
          res.on("end", () => {
            resolve(JSON.parse(secrets));
          });
        }
      )
      .on("error", (error) => {
        log(`Doppler API Error - ${error}`);
        reject(new Error(`Doppler API Error: ${error}`));
      });
  });
}

module.exports = { fetch: fetch };
