const https = require("https");
const querystring = require("querystring");
const { VERSION } = require("../meta");

/**
 * Fetch secrets from Doppler the API.
 * @param {{dopplerToken: string}} [{dopplerToken: process.env.DOPPLER_TOKEN}] Requires a Doppler Token for API authentication. See https://docs.doppler.com/docs/enclave-service-tokens
 * @param {{dopplerProject: string}} [{dopplerProject: null}] Optional Doppler Project. Required when using any token type other than Service Tokens.
 * @param {{dopplerConfig: string}} [{dopplerConfig: null}] Optional Doppler Config. Required when using any token type other than Service Tokens.
 * @returns {() => Promise<Record<string, string>>}
 */
async function fetch({ dopplerToken = process.env.DOPPLER_TOKEN, dopplerProject = null, dopplerConfig = null } = {}) {
  if (!dopplerToken) {
    throw new Error("Doppler API Error: The 'DOPPLER_TOKEN' environment variable is required");
  }

  return new Promise(function (resolve, reject) {
    const authHeader = `Bearer ${dopplerToken}`;
    const userAgent = `gitops-secrets-nodejs/${VERSION}`;
    const query = { format: "json", project: dopplerProject, config: dopplerConfig };
    https
      .get(
        `https://api.doppler.com/v3/configs/config/secrets/download?${querystring.stringify(query)}`,
        {
          headers: {
            Authorization: authHeader,
            "user-agent": userAgent,
          },
        },
        (res) => {
          let payload = "";
          res.on("data", (data) => (payload += data));
          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(payload));
            } else {
              try {
                const error = JSON.parse(payload).messages.join(" ");
                reject(new Error(`Doppler API Error: ${error}`));
              } catch (error) {
                // In the event an upstream issue occurs and no JSON payload is supplied
                reject(new Error(`Doppler API Error: ${res.statusCode} ${res.statusMessage}`));
              }
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
