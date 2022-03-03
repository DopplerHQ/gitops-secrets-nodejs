// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");

/**
 * @param {string} [format=json] json | env | yaml | docker | env-no-quotes
 * @returns {(undefined|string)}
 */
function download(format = "json") {
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

module.exports = { download: download };
