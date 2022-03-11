const https = require("https");
const { log } = require("../../utils.js");

/**
 * Fetch secrets from Doppler the API. Requires the `DOPPLER_TOKEN` environment variable to be set. See https://docs.doppler.com/docs/enclave-service-tokens
 * @returns {Promise}
 */
async function download() {
  if (!process.env.DOPPLER_TOKEN) {
    return new Promise((_, reject) => reject("Doppler API Error: The 'DOPPLER_TOKEN' environment variable is required"));
  }

  log("Fetching secrets from API");
  return new Promise(function (resolve, reject) {
    https
      .get(`https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download`, (res) => {
        let secrets = "";
        res.on("data", (data) => (secrets += data));
        res.on("end", () => {
          resolve(JSON.parse(secrets));
        });
      })
      .on("error", (error) => {
        log(`Doppler API Error - ${error}`);
        reject(`Doppler API Error: ${error}`);
      });
  });
}

module.exports = { download: download };
