# GitOps Secrets for Node.js

Hello, GitOps Secrets! Goodbye environment variable storage limits.

![GitOps SecretsDiagram](https://user-images.githubusercontent.com/133014/158977309-ce9efc17-ba94-4cb7-a7a4-bdb101a67e6d.jpg)

It's been a long-standing frustration that AWS Lambda deployments have a 4KB environment variable limit. This limit also impacts other environments such as [Vercel](https://vercel.com/support/articles/how-do-i-workaround-vercel-s-4-kb-environment-variables-limit) and the [Serverless framework](https://www.serverless.com/framework/docs/providers/aws/guide/variables) who use AWS Lambda as their infrastructure provider.

A GitOps Secrets workflow eliminates environment variable limits without insecure hacks such as storing unencrypted .env files in your builds and only takes three steps:

1. Install the GitOps Secrets package (currently in developer preview):

```sh
npm install gitops-secrets
```

2. Bundle encrypted secrets into your build

```js
// ./bin/encrypt-secrets.js
const secrets = require("gitops-secrets");

async function main() {
  const payload = await secrets.providers.doppler.fetch();
  secrets.build(payload);
}

main();
```

```js
// package.json
{
  "scripts: {
    ...
    "encrypt-secrets": "node ./bin/encrypt-secrets.js"
  }
}
```

3. Decrypt secrets at runtime

```js
const { loadSecrets } = require("gitops-secrets");
const secrets = loadSecrets();
```

## Background and Motivation

As creators of the [Doppler Universal Secrets Platform](https://www.doppler.com/) who provide secrets sync integrations for [Vercel](https://vercel.com/integrations/doppler) and [Serverless](https://docs.doppler.com/docs/enclave-installation-serverless), we've helped customers individually to work around this limitation.

But long-term, we wanted a generic, flexible and open source solution that both our customers and other teams experiencing the same issue could use.

Our goal was to design a new way of accessing secrets in production that:

- [x] Allowed for a secrets payload of any size
- [x] Could be up and running in minutes
- [x] Scaled to work in any environment, including local development
- [x] Could support the most restrictive serverless platforms
- [x] Provided first class support for ES modules
- [x] Prevented unencrypted secrets from ever touching the file system
- [x] Abstracted away the complexity of secrets fetching using community contributed [providers](./src/providers/)

## Providers

A provider is designed to abstract away the complexities of fetching secrets from any secret manager or secrets store by exposing a single async `fetch` method.

A secrets provider returns a plain Key-Value Object to ensure that serializing to and from JSON during encryption and decryption produces the same object structure originally fetched from the provider.

The current list of providers are:

- [Doppler](./src/providers/doppler.js)

We'd love to see the list of providers grow! Please see our [contributing guide](CONTRIBUTING.md) to get started.

## Encryption and Decryption

There are two file formats available for bundling secrets into your build:

- **JSON**: Encrypted JSON file.
- **JS Module**: Encrypted JSON embedded in JS module.

You may be forced to use the JS module format if reading static JSON at runtime is problematic, e.g. [Vercel prefers a JS module with a custom path](https://github.com/DopplerUniversity/vercel-gitops-secrets-nextjs), but otherwise, there isn't a compelling reason to use one format over another.

### JSON

To encrypt secrets to a JSON file:

```js
const secrets = require("gitops-secrets");

async function main() {
  const payload = await secrets.providers.doppler.fetch();

  // Internally managed storage
  secrets.encryptToFile(payload);

  // Custom path
  secrets.encryptToFile(payload, { path: ".secrets.enc.json" });
}

main();
```

To decrypt secrets from a JSON file:

```js
const { decryptFromFile } = require("gitops-secrets");

// Internally managed storage
const secrets = decryptFromFile();

// Custom Path
const secrets = decryptFromFile(".secrets.enc.json");

// Optionally merge secrets into environment variables
secrets.populateEnv();
```

### JS Module

The JS module format suits restricted environments where reading static files is problematic and depending upon the platform, building with a custom path may be required.

To encrypt secrets to a JS module:

```js
const secrets = require("gitops-secrets");

async function main() {
  const payload = await secrets.providers.doppler.fetch();

  // Internally managed storage
  secrets.build(payload);

  // Custom path for restrictive environments
  secrets.build(payload, { path: "lib/secrets.js" });
}

main();
```

Then to decrypt secrets from a JS module, you can rely on internally managed storage:

```js
const { loadSecrets } = require("gitops-secrets");
const secrets = loadSecrets();

// Optionally merge secrets into environment variables
secrets.populateEnv();
```

Or import directly from the generated JS module:

```js
const { loadSecrets } = require("../lib/secrets");
const secrets = loadSecrets();

// Optionally merge secrets into environment variables
secrets.populateEnv();
```

### Getting Started

We recommend checking out the [Working around Vercel’s 4KB Environment Variables Limit for Node.js with GitOps Secrets article](https://hashnode.com/preview/623404babef4c71aa6f0d65e) which takes you through the entire process step-by-step.

## Examples

Take a look at the [Vercel GitOps Secrets Next.js sample repository](https://github.com/DopplerUniversity/vercel-gitops-secrets-nextjs) and deploy to Vercel to see it in action.

## Contributing

As this package is still in developer preview, a huge contribution you can make is simply testing this with your preferred framework and serverless provider as we'd love your feedback!

You can get support in the [Doppler community forum](https://community.doppler.com/), find us on [Twitter](https://twitter.com/doppler), and for bugs or feature requests, [create an issue](https://github.com/DopplerHQ/gitops-secrets-nodejs/issues) on this repository.

We'd also love to see the number of providers grow and you can check out our [contributing guide](CONTRIBUTING.md) to get started.
