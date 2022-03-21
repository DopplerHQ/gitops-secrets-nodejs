# Security

## Overview

[PBKDF2](https://en.wikipedia.org/wiki/PBKDF2) is used for key derivation and [AES-256-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode) for encryption.

PBKDF2 uses a passphrase (Master Key) and salt value with a pseudorandom function to derive a cryptographic (secret) key for use by a cryptographic algorithm (AES-256-GCM) to encrypt data.

AES-256-GCM is used as a symmetric-key cipher, meaning the same key is used for encryption and decryption, avoiding the complexity of an asymmetric key where a public key is used for encryption and a private key is required for decryption.

A symmetric-key model was chosen for this library because the fetching, encryption, and decryption of secrets are a machine or application level operation, not a user specific one, thus ruling out the need for asymmetric keys.

The passphrase is provided via a `GITOPS_SECRETS_MASTER_KEY` environment variable. It should be a cryptographically random string unique to each environment and must be 16 characters or more.

You can generate a cryptographically random passphrase in your shell by running:

```sh
node -e 'process.stdout.write(require("crypto").randomBytes(16).toString("hex"))'
```

## Encryption and Decryption

The default 1,000,000 rounds of key-stretching and key length of 32 bytes should be more than sufficient, but can be configured via the `PBKDF2_ROUNDS` and `PBKDF2_KEYLEN` environment variables. These environment variables aren't needed at time of decryption as they are encoded into the final cipher text payload so they can be derived without risk of mismatching values which would prevent decryption.

## Providers

Providers are strongly encouraged to require auth related secrets to be supplied as environment variables to strongly discourage the hard-coding of credentials.]

## Reporting a Vulnerability

Please report any vulnerabilities to [Doppler's Vulnerability Disclosure Program](https://doppler.com/vdp).
