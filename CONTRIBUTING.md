# Contributing to Lee-Su-Threads

Thank you for your interest in contributing! This guide covers the development workflow and release process.

## Development Setup

1. Clone the repository
2. Run `npm install`
3. Run `npm run build` to build both Chrome and Firefox versions
4. Load the extension:
   - **Chrome**: Navigate to `chrome://extensions/`, enable Developer mode, click "Load unpacked", select `dist/chrome/`
   - **Firefox**: Navigate to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select `dist/firefox/manifest.json`

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
```

## Version Management

**During development, DO NOT update version numbers in `src/manifest.json` or `src/manifest.firefox.json`.**

The build system automatically handles versioning:
- **Development builds** (`npm run build:watch`): Auto-increments version from latest git tag (e.g., `v0.3.7` → `0.3.8`)
- **Production builds** (`npm run build`): Uses exact version from source manifests
- **Only update manifest versions when creating a release** (see Release Process below)

## Release Process

### Firefox Distribution Setup

This repository supports two Firefox distribution channels:

#### 1. AMO Unlisted (Manual Review)
- **Package:** `lee-su-threads-firefox-v{version}.zip` (no `update_url`)
- **Purpose:** Submit to AMO for unlisted review
- **Process:** Manual submission to https://addons.mozilla.org/developers/

#### 2. Self-Hosted (Auto-Signed)
- **Package:** `lee-su-threads-firefox-v{version}.0-signed.xpi` (with `update_url`)
- **Purpose:** Direct distribution with auto-updates
- **Process:** Automatically signed via Mozilla API in CI
- **Version:** Appends `.0` to distinguish from AMO version (e.g., `0.3.8` → `0.3.8.0`)

#### Setting up Firefox API Credentials

To enable automatic signing (self-hosted builds), configure Mozilla API credentials:

1. Go to https://addons.mozilla.org/developers/addon/api/key/
2. Generate new API credentials
3. Add to GitHub repository:
   - **Secrets:**
     - `FIREFOX_API_KEY` (format: `user:{user_id}:{key_id}`)
     - `FIREFOX_API_SECRET`
   - **Variables:**
     - `ENABLE_FIREFOX_SIGNING` = `true`

#### How the Release Workflow Works

When you push a version tag (e.g., `v0.3.8`):

**With `ENABLE_FIREFOX_SIGNING=true` (main repository):**
1. Builds Chrome and two Firefox versions:
   - **AMO:** `v0.3.8` without `update_url`
   - **Self-hosted:** `v0.3.8.0` with `update_url`
2. Signs self-hosted version with `--channel=unlisted`
3. Creates GitHub Release with:
   - `lee-su-threads-chrome-v0.3.8.zip` (for Chrome Web Store)
   - `lee-su-threads-firefox-v0.3.8.zip` (for AMO unlisted submission)
   - `lee-su-threads-firefox-v0.3.8.0-signed.xpi` (self-hosted with auto-updates)
   - `updates.json` (update manifest pointing to `.0` version)

**With `ENABLE_FIREFOX_SIGNING=false` (forks):**
1. Builds Chrome and Firefox AMO version only
2. Creates GitHub Release with:
   - `lee-su-threads-chrome-v0.3.8.zip`
   - `lee-su-threads-firefox-v0.3.8.zip`

### Creating a Release

1. Update version in `src/manifest.json` and `src/manifest.firefox.json`
2. Commit and push to main
3. Create and push a version tag:
   ```bash
   git tag v0.3.8
   git push origin v0.3.8
   ```
4. GitHub Actions will automatically:
   - Build the extensions
   - Sign the Firefox extension (if credentials are available)
   - Create a GitHub Release
   - Upload the distribution files

### Installing Self-Hosted Firefox Extension

Users can install the self-hosted Firefox extension from:
```
https://github.com/meettomorrow/lee-su-threads/releases/latest/download/lee-su-threads-firefox-v{version}.0-signed.xpi
```

Firefox will automatically check for updates via the `updates.json` manifest.

### Distribution Channels Summary

- **Chrome Web Store**: Manual upload of unsigned `.zip`
- **Firefox AMO (Unlisted)**: Manual submission of unsigned `.zip` (no `update_url`)
- **Firefox Self-Hosted**: Auto-signed `.xpi` via GitHub Releases with auto-updates

## Questions?

If you have questions about the release process or need help setting up credentials, please open an issue.
