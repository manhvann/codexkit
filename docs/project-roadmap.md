# CodexKit Project Roadmap

**Last Updated:** 2026-08-13  
**Current Version:** 0.1.8  
**Repository:** https://github.com/manhvann/codexkit

## Mission

Make Codex a dependable maintainer workspace for projects that span multiple
repositories. CodexKit focuses on repeatable skills, clear agent roles,
privacy guardrails, plans, documentation, and a predictable installer.

## Current release: 0.1.8

The current package includes:

- 68 documented skills under `.agents/skills/`;
- 14 TOML agent definitions under `.codex/agents/`;
- hook dispatch and shared libraries under `.codex/hooks/`;
- privacy, scout, planning, and development-rule guardrails;
- a cross-platform Node.js installer exposed as `ckit`;
- plan templates, output styles, documentation, and environment examples;
- public contribution, security, support, and changelog documentation.

## Next priorities

### Public repository launch

- Publish the repository under the maintainer's GitHub account.
- Create the first tagged release and verify the npm package metadata.
- Collect real issue, pull-request, download, and usage signals.
- Keep the public README and package installation path synchronized.

### Maintainer experience

- Improve first-run diagnostics and dry-run output.
- Add more focused examples for umbrella repositories and child projects.
- Make skill discovery and `$skill` help output easier to search.
- Add regression coverage for installer edge cases and hook dispatch.

### Security and reliability

- Continue repository-wide secret and personal-data scans before releases.
- Review path handling, environment loading, and hook permissions.
- Document supported platforms and known optional-tool requirements.
- Evaluate a CI workflow only when the maintainer explicitly chooses to add
  one; no CI workflow is part of the current release.

## Non-goals for this release

- Hosted agent execution or a managed SaaS service.
- Guaranteed support for third-party model providers.
- Claims about stars, downloads, or ecosystem adoption before publication.
- Automatic release infrastructure that is not present in the repository.

## Success signals after launch

Success will be measured using public evidence rather than estimates:

- active issues and pull requests from users;
- successful installs and reproducible setup reports;
- package downloads and repository adoption;
- maintainer response time and quality of releases;
- documented downstream projects using the kit.
