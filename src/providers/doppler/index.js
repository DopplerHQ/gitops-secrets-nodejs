// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");
const path = require("path");
const cli = require("./cli");
const api = require("./api");

/**
 * Fetch secrets from Doppler using the Doppler CLI or Doppler API.
 * @returns {object}
 */
async function fetchAsync() {
  const stdio = {
    stdout: null,
    stderr: null,
  };

  // Swallow exceptions as using the CLI is an optimistic option as the API will be used in most instances
  try {
    const cliSecrets = cli.download();
    if (cliSecrets) {
      stdio.stdout = JSON.stringify(cliSecrets);
      return stdio;
    }
  } catch (error) {
    // eslint-disable-next-line no-empty
  }

  try {
    const payload = await api.download();
    stdio.stdout = JSON.stringify(payload);
    return stdio;
  } catch (error) {
    stdio.stderr = error;
    return stdio;
  }
}

/**
 * Fetch secrets from Doppler
 * @returns {string}
 */
function fetch() {
  // Executing this file as a command so secrets can be returned synchronously
  const command = spawnSync("node", [path.resolve(__filename)], { encoding: "utf8", env: process.env });
  if (command.status !== 0) {
    throw command.stderr;
  }

  return JSON.parse(command.stdout);
}

// If executed as a script
if (require.main === module) {
  (async () => {
    const stdio = await fetchAsync();
    stdio.stdout && process.stdout.write(stdio.stdout);
    stdio.stderr && process.stderr.write(stdio.stderr);

    if (stdio.stderr !== null) {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  })();
}

module.exports = { fetch: fetch, fetchAsync: fetchAsync, api: api, cli: cli };
