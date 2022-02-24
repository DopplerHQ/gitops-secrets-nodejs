const log = (message) =>
  process.env.DEBUG && process.env.DEBUG.includes("gitops-secrets") && console.log(`[gitops-secrets]: ${message}`);

module.exports = { log: log };
