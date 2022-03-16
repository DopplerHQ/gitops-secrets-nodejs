module.exports = require("./secrets.js");
module.exports.providers = {
  doppler: {
    fetch: require("./providers/doppler/api.js").fetch,
  },
};
