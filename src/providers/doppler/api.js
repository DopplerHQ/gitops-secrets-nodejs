const https = require("https");
const { log } = require("../../utils.js");

/**
 * Fetch secrets from Doppler the API. Requires the `DOPPLER_TOKEN` environment variable to be set. See https://docs.doppler.com/docs/enclave-service-tokens
 * @param {string} [format=json] json | env | yaml | docker | env-no-quotes
 * @returns {Promise}
 */
async function download(format = "json") {
  // Require Service Token as environment variable to deter hard-coding service token in scripts
  if (!process.env.DOPPLER_TOKEN) {
    return new Promise((_, reject) => reject("Doppler API Error: The 'DOPPLER_TOKEN' environment variable is required"));
  }

  log("Fetching secrets from API");
  return new Promise(function (resolve, reject) {
    https
      .get(`https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=${format}`, (res) => {
        let secrets = "";
        res.on("data", (data) => (secrets += data));
        res.on("end", () => {
          if (secrets.includes("'format' must be one")) {
            reject(JSON.parse(secrets).messages[0]);
          } else {
            resolve(secrets);
          }
        });
      })
      .on("error", (error) => {
        log(`Doppler API Error - ${error}`);
        reject(`Doppler API Error: ${error}`);
      });
  });
}

module.exports = { download: download };
