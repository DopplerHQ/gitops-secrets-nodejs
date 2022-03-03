module.exports = { ...require("./secrets.js"), ...require("./secrets-files.js") };
module.exports.providers = {
  doppler: require("./providers/doppler/index.js"),
};
