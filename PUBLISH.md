# Publish CodexKit to npm

The public package name is `@manhnv319/codexkit`; the executable remains `ckit`.
The GitHub repository is <https://github.com/manhvann/codexkit>.

## Authenticate

Use `npm login` or configure a token outside this repository. Never commit a
real token or a project `.npmrc`.

Example user-level `.npmrc`:

```ini
@manhnv319:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

## Verify and publish

```bash
npm run check
npm run pack:dry
npm publish --access public
```

## Install

```bash
npm install -g @manhnv319/codexkit
ckit --help
```
