# Contributing

We welcome contributions by the community. By contributing to gitops-secrets, you agree to abide by the [code of conduct](CODE_OF_CONDUCT.md).

## Code Style

Please check your code prior to submitting pull requests by running:

```sh
npm run prettier
npm run lint
```

## Commit Messages

Commit messages should be verb based, using the following pattern:

- `Fixing ...`
- `Adding ...`
- `Updating ...`
- `Removing ...`

### Testing

Please update the tests to reflect your code changes. Pull requests will only be reviewed if all checks and tests are passing.

### Documentation

Please update the [docs](README.md) if the change is user facing.

### Releasing

Ensure your change has been added to the [changelog](CHANGELOG.md) and that the version has been bumped in `package.json`

Releasing a new version is automated and is triggered by a merge to the main branch.
