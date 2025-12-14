# rara-website

<!-- Badges -->

[![CI](https://github.com/garethstockwell/rara-website/actions/workflows/build.yaml/badge.svg)](https://github.com/garethstockwell/rara-website/actions/workflows/build.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Source for the Riverside Area Residents Association (RARA) website at https://rar.org.uk

This repository is a monorepo which contains [WordPress](https://wordpress.com/) themes and plugins which are used by the RARA website.

The main functionality provided is a set of interactive maps of the area, rendered using [MapLibre GL JS][maplibre].
This is delivered as a [WordPress][wordpress] plugin.

## Getting started

To build the plugins, install [npm][npm] and then execute the following:

```
npm ci
npm start
```

This starts a process which watches for the contents of the repository, and automatically triggers a rebuild in response to a change.

## Testing

### Test locally without WordPress

The repository contains a set of HTML files which test functionality exposed by JavaScript modules which are encapsulated inside the plugins.
There are two ways to use these, described below.

#### Development mode

The following command runs `npx webpack serve`, which watches the source code.
When a file is changed, a rebuild is triggered and the page is refreshed.

```
npm start
```

To view the test pages, point a browser at http://localhost:3000/test

#### Production mode

To test the output of a production build, run the following:

```
npm run build
npm run serve
```

To view the test pages, point a browser at http://localhost:3000/test

### Test locally using WordPress in Docker

The following instructions show how the themes and plugins can be tested using a local WordPress instance, running in a [Docker][docker] container.

1. Create a local directory where the WordPress content will be stored, and set the `RARA_WP_CONTENT` environment variable to point to it.

```
export RARA_WP_CONTENT=/some/local/directory
mkdir -p ${RARA_WP_CONTENT}
```

2. Download Updraft backup files (*.zip and *db.gz) from rar.org.uk and store in `${RARA_WP_CONTENT}/updraft`.

```
mkdir -p ${RARA_WP_CONTENT}/updraft
cp <files> ${RARA_WP_CONTENT}/updraft
```

3. Start the Docker container

```
./docker/compose.sh up
```

This maps the themes and plugins folders from the working directory of this repository into the container.

4. Open Wordpress by browsing to http://localhost:8000

5. Create a user.
   The login details don't matter since this will be overwritten by the credentials restored via Updraft - so username "test" and password "test" are fine.

6. Log in

- Activate the "RARA" theme.
- Activate all "RARA" plugins.
- Install [UpdraftPlus: WP Backup & Migration Plugin][updraft].

7. Go to the Updraft settings page.
   Under "Existing backups" you should see one entry, with the following components:

- Database
- Plugins
- Themes
- Uploads
- Others
  Restore this backup, ticking all components.

8. Log in with the credential restored from the remote server via Updraft.

### Deploy GitHub build to remote WordPress instance

As described in the [Continuous Integration](#continuous-integration) section below, a GitHub action publishes build artifacts to a "deploy" branch.
The [WP Pusher][wp-pusher] plugin can be used to fetch these artifacts from GitHub and install the plugins / themes directly on the WordPress server.

## Continuous Integration

This repository defines a [GitHub workflow][github-workflow] which includes the following steps:

- Build plugins.
- Push the build outputs to a branch called `deploy-<source branch>`.
  For example, when a commit is pushed to `main` the build outputs are pushed to `deploy-main`.

## Structure of the plugin

The plugin consist of the following parts, each of which is a subdirectory of the `plugins/rara-maps` directory:

- `app`: a [React][react] application which includes a map view, a "content panel" which can display information relevant to the map and a settings panel.
- `assets`: static image files.
- `data`: data which is loaded at runtime.
  This includes:
  - Routes, boundary lines and locations, in [GeoJSON][geojson] format.
  - Georeferenced overlays (with the images themselves loaded from `assets`.)
  - Attributions / credits for the assets.
  - Map styling information.
  - A set of "views", each of which is a configuration of the application that includes the above set of objects.
- `lib`: a [TypeScript][typescript] library which uses [MapLibre GL JS][maplibre] and [Turf.js][turf] to render the maps.
- `scripts`: build helpers and admin tools.
- `test`: a set of static HTML files which can be used to exercise both the library and the app.

The build system makes use of the following tools:

- [eslint][eslint] to check JavaScript code.
- [prettier][prettier] to format CSS and JavaScript code.
- [webpack][webpack] to build and bundle the app, assets and library.
  It is also used to serve build outputs for testing during development.

<!-- References -->

[docker]: https://www.docker.com/
[eslint]: https://eslint.org/
[github-workflow]: https://docs.github.com/en/actions
[geojson]: https://geojson.org/
[react]: https://react.dev/
[maplibre]: https://maplibre.org/maplibre-gl-js/docs/
[npm]: https://www.npmjs.com/
[prettier]: https://prettier.io/
[turf]: https://turfjs.org/
[typescript]: https://www.typescriptlang.org/
[updraft]: https://teamupdraft.com/updraftplus/
[webpack]: https://webpack.js.org/
[wordpress]: https://wordpress.com/
[wp-pusher]: https://wppusher.com/
