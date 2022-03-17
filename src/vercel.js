/* Vercel variant for runtime use excludes secret-files module due to fs calls. */
module.exports = require("./secrets.js");
module.exports.providers = {
  doppler: require("./providers/doppler.js"),
};
