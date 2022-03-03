// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");
const path = require("path");
const cli = require("./cli");
const api = require("./api");

/**
 * Fetch secrets from Doppler using the Doppler CLI or Doppler API.
 * Requires either the `DOPPLER_TOKEN` environment variable (see https://docs.doppler.com/docs/enclave-service-tokens) or the CLI to be authenticated via `doppler login` if installed
 * @param {string} format
 * @returns
 */
async function fetchAsync(format) {
  const stdio = {
    stdout: null,
    stderr: null,
  };

  // Swallow exceptions as using the CLI is an optimistic option as the API will be used in most instances
  try {
    const cliSecrets = cli.download(format);
    if (cliSecrets) {
      stdio.stdout = cliSecrets;
      return stdio;
    }
  } catch (error) {
    // eslint-disable-next-line no-empty
  }

  try {
    const payload = await api.download(format);
    stdio.stdout = payload;
    return stdio;
  } catch (error) {
    stdio.stderr = error;
    return stdio;
  }
}

/**
 * Fetch secrets from Doppler using the Doppler CLI or Doppler API.
 * Requires either the `DOPPLER_TOKEN` environment variable (see https://docs.doppler.com/docs/enclave-service-tokens) or the CLI to be authenticated via `doppler login` if installed
 * @param {string} [format=json] json | env | yaml | docker | env-no-quotes
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

// If executed as a script
if (require.main === module) {
  (async () => {
    const [, , ...args] = process.argv;
    const format = args[0] === "--format" && args[1] ? args[1] : "json";
    const stdio = await fetchAsync(format);
    stdio.stdout && process.stdout.write(stdio.stdout);
    stdio.stderr && process.stderr.write(stdio.stderr);

    if (stdio.stderr !== null) {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  })();
}

module.exports = { fetch: fetch, fetchAsync: fetchAsync, api: api, cli: cli };
