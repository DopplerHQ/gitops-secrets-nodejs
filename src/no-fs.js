/* No fs variant by excluding secret-files */
module.exports = require("./secrets.js");
module.exports.providers = {
  doppler: require("./providers/doppler.js"),
};
