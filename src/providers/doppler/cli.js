// eslint-disable-next-line security/detect-child-process
const { spawnSync } = require("child_process");

/**
 * @returns {(undefined|string)}
 */
function download() {
  if (spawnSync("doppler", [], { encoding: "utf8" }).status !== 0) {
    return;
  }

  const command = spawnSync("doppler", ["secrets", "download", "--no-file"], {
    env: process.env,
    encoding: "utf8",
  });

  if (command.status !== 0) {
    throw command.stderr;
  }

  return JSON.parse(command.stdout);
}

module.exports = { download: download };
