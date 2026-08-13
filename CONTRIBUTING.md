# Contributing to CodexKit

Thanks for helping improve CodexKit. Contributions should be focused, tested,
and documented when they change user-facing behavior.

## Before opening an issue or pull request

1. Search existing issues and discussions.
2. Reproduce bugs with the smallest useful example.
3. Keep changes scoped to one concern.
4. Do not include secrets, personal data, generated artifacts, or private paths.

## Local development

```bash
npm install
npm run check
npm run pack:dry
```

The package currently validates its JavaScript entry points and metadata with
`npm run check`. Run targeted tests for any changed skill or hook as well.

## Pull requests

Use a clear title, explain the user impact, list validation performed, and call
out compatibility or security implications. Maintainers may request changes
before merging.

By contributing, you agree that your work is provided under the repository's
MIT license and that you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).
