# GitOps Secrets

A SecretOps workflow for bundling encrypted secrets into your deployments.

![GitOps SecretsDiagram](https://user-images.githubusercontent.com/133014/158977309-ce9efc17-ba94-4cb7-a7a4-bdb101a67e6d.jpg)

## Usage

1. Install the `gitops-secrets` package:

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

Exceeding AWS Lambda's 4KB environment variable limit is a common problem that also impacts platforms such as [Vercel](https://vercel.com/support/articles/how-do-i-workaround-vercel-s-4-kb-environment-variables-limit) and the [Serverless framework](https://www.serverless.com/framework/docs/providers/aws/guide/variables) which deploy on top of AWS Lambda.

A SecretOps workflow that bundles encrypted secrets into a deployment eliminates such environment variable limits without insecure hacks such as storing unencrypted .env files in your builds.

As creators of the [Doppler SecretOps Platform](https://www.doppler.com/) which provide secrets sync integrations for [Vercel](https://vercel.com/integrations/doppler) and [Serverless](https://docs.doppler.com/docs/enclave-installation-serverless), we built this to provide a secure solution for our customers and the open source community.

Our goal was to design a new way of accessing secrets in production that:

- Allowed for a secrets payload of any size
- Could be up and running in minutes
- Scaled to work in any environment, including local development
- Could support the most restrictive serverless platforms
- Provided first-class support for ES modules
- Prevented unencrypted secrets from ever touching the file system
- Abstracted away the complexity of secrets fetching using community-contributed [providers](./src/providers/)

## Providers

A provider is designed to abstract away the complexities of fetching secrets from any secret manager or secrets store by exposing a single async `fetch` method.

A secrets provider returns a plain Key-Value Object to ensure that serializing to and from JSON during encryption and decryption produces the same object structure initially fetched from the provider.

The current list of providers are:

- [Doppler](./src/providers/doppler.js)

We'd love to see the list of providers grow! Please see our [contributing guide](CONTRIBUTING.md) to get started.

## Encryption and Decryption

There are two file formats available for bundling encrypted secrets into your deployments:

- **JSON**: Encrypted JSON file.
- **JS Module**: Encrypted JSON embedded in JS module.

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

The JS module format is ideal for restricted environments such as Vercel where application-wide access to reading static files is problematic.

Depending upon the deployment platform and framework, you can potentially omit the `path` parameter to have encrypted secrets access and storage managed internally for you.

But if using Vercel with Next.js for example, the `path` configures the module to be output in your codebase with the format of the module matching that of your application.

To encrypt secrets to a JS module:

```js
const secrets = require("gitops-secrets");

async function main() {
  const payload = await secrets.providers.doppler.fetch();

  // Option 1: Internally managed storage
  secrets.build(payload);

  // Option 2: Custom path for restrictive environments
  secrets.build(payload, { path: "lib/secrets.js" });
}

main();
```

To decrypt secrets from a JS module using internally managed storage, use the package-level `loadSecrets` method:

```js
const { loadSecrets } = require("gitops-secrets");

const secrets = loadSecrets();

// Optionally merge secrets into environment variables
secrets.populateEnv();
```

Or use the `loadSecrets` method from the generated module (ES modules also supported):

```ts
const { loadSecrets, Convert } = require("../lib/secrets");
const secrets = loadSecrets();

// Optionally export type safe object
const { populateEnv, ...config } = secrets;
export const configuration = Convert.toConfiguration(config);

// Optionally merge secrets into environment variables
secrets.populateEnv(); // or populateEnv()
```

## Getting Started

We recommend checking out the [Working around Vercel's 4KB Environment Variables Limit for Node.js with GitOps Secrets](https://hashnode.com/preview/623404babef4c71aa6f0d65e) blog post which guides you through the entire process.

Or take a look at the [Vercel GitOps Secrets Next.js sample repository](https://github.com/DopplerUniversity/vercel-gitops-secrets-nextjs) to see a complete working example that you can test and deploy to Vercel.

## Support

You can get support in the [Doppler community forum](https://community.doppler.com/), find us on [Twitter](https://twitter.com/doppler), and for bugs or feature requests, [create an issue](https://github.com/DopplerHQ/gitops-secrets-nodejs/issues) on the [DopplerHQ/gitops-secrets-nodejs](https://github.com/DopplerHQ/gitops-secrets-nodejs) GitHub repository.

We'd also love to see the number of providers grow, and you can check out our [contributing guide](CONTRIBUTING.md) to get started.
