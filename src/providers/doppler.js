// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");
const path = require("path");
const https = require("https");
const { log } = require("../utils.js");

const FORMATS = ["json", "env", "yaml", "docker", "env-no-quotes"];

/**
 * @param {string} [format=json] json | env | yaml | docker | env-no-quotes
 * @returns {(undefined|string)}
 */
function fetchCLI(format = "json") {
  if (spawnSync("doppler", [], { encoding: "utf8" }).status !== 0) {
    return;
  }

  const command = spawnSync("doppler", ["secrets", "download", "--format", format, "--no-file"], {
    env: process.env,
    encoding: "utf8",
  });

  if (command.status !== 0) {
    throw command.stderr;
  }

  return command.stdout;
}

/**
 * Fetch secrets from Doppler the API. Requires the `DOPPLER_TOKEN` environment variable to be set. See https://docs.doppler.com/docs/enclave-service-tokens
 * @param {string} [format=json] json | env | yaml | docker | env-no-quotes
 * @returns {Promise}
 */
async function fetchAPI(format = "json") {
  // Require Service Token as environment variable to deter hard-coding service token in scripts
  if (!process.env.DOPPLER_TOKEN) {
    return new Promise((_, reject) => reject("Doppler API Error: The 'DOPPLER_TOKEN' environment variable is required"));
  }

  if (!FORMATS.includes(format)) {
    return new Promise((_, reject) => reject(`Invalid format '${format}'. Valid formats are ${FORMATS.join(", ")}`));
  }

  log("Fetching secrets from API");
  return new Promise(function (resolve, reject) {
    https
      .get(`https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=${format}`, (res) => {
        let secrets = "";
        res.on("data", (data) => (secrets += data));
        res.on("end", () => {
          log("Secrets fetched from API");
          resolve(secrets);
        });
      })
      .on("error", (error) => {
        log(`Doppler API Error - ${error}`);
        reject(`Doppler API Error: ${error}`);
      });
  });
}

/**
 * Fetch secrets from Doppler using the Doppler CLI or Doppler API.
 * Requires either the `DOPPLER_TOKEN` environment variable (see https://docs.doppler.com/docs/enclave-service-tokens) or the CLI to be authenticated via `doppler login` if installed
 * @param {string} [format=json]
 * @returns {string}
 */
function fetch(format = "json") {
  // Executing this file as a command so secrets can be returned synchronously
  const command = spawnSync("node", [path.resolve(__filename), "--format", format], { encoding: "utf8", env: process.env });
  if (command.status !== 0) {
    throw command.stderr;
  }

  return command.stdout;
}

async function fetchAsScript() {
  const [, , ...args] = process.argv;
  const format = args[0] === "--format" && FORMATS.includes(args[1]) ? args[1] : "json";
  const stdio = {
    stdout: null,
    stderr: null,
  };

  // Swallow exceptions as using the CLI is an optimistic option as the API will be used in almost all instances
  try {
    const cliSecrets = fetchCLI(format);
    if (cliSecrets) {
      stdio.stdout = cliSecrets;
      return stdio;
    }
  } catch (error) {
    // eslint-disable-next-line no-empty
  }

  try {
    const payload = await fetchAPI(format);
    stdio.stdout = payload;
    return stdio;
  } catch (error) {
    stdio.stderr = error;
    return stdio;
  }
}

// If executed as a script
if (require.main === module) {
  (async () => {
    const stdio = await fetchAsScript();
    stdio.stdout && process.stdout.write(stdio.stdout);
    stdio.stderr && process.stderr.write(stdio.stderr);

    if (stdio.stderr !== null) {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  })();
}

module.exports = { fetch: fetch, fetchAPI: fetchAPI, fetchCLI: fetchCLI, fetchAsScript: fetchAsScript };
