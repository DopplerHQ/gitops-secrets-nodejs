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
  // Swallow CLI excepts as it's only an optimistic case
  try {
    const cliSecrets = cli.fetch();
    if (cliSecrets) {
      return cliSecrets;
    }
  } catch (error) {
    // eslint-disable-next-line no-empty
  }

  return api.fetch();
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
    try {
      const secrets = await fetchAsync();
      process.stdout.write(JSON.stringify(secrets));
    } catch (error) {
      process.stderr.write(error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  })();
}

module.exports = { fetch: fetch, fetchAsync: fetchAsync, api: api, cli: cli };
