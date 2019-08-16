Query SQLite data using graph notation and receive it as json (uses sqlite ```json1``` builtin extension).

<p align="center">

[![Build Status](https://img.shields.io/travis/com/ffrm/graphlite.svg?logo=travis)](https://travis-ci.com/ffrm/graphlite)
[![codecov](https://img.shields.io/codecov/c/github/ffrm/graphlite?logo=codecov)]()
[![eslint](https://img.shields.io/npm/dependency-version/graphlite/dev/eslint?logo=eslint)]()
[![npm](https://img.shields.io/npm/v/graphlite?label=npm&logo=npm)]()
[![yarn](https://img.shields.io/npm/v/graphlite?logo=yarn)]()
[![downloads](https://img.shields.io/npm/dm/graphlite?logo=npm)]()
[![](https://img.shields.io/github/contributors/ffrm/graphlite)]()
[![license](https://img.shields.io/github/license/ffrm/graphlite?logo=github)]()
[![](https://img.shields.io/github/last-commit/ffrm/graphlite?logo=github)]()
[![](https://img.shields.io/github/release-date/ffrm/graphlite?logo=github)]()

</p>

## Installation
```bash
npm install graphlite --save
```

Another related modules that can work with the Graphlite:

[express-graphlite](https://github.com/ffrm/express-graphlite)

[sqlite-storage](https://github.com/ffrm/sqlite-storage) - Makes easy to manage multiple related databases on Node.js

## Features
- Schemas ```(with association between them)```
- Queries
- Multi level array graph response with ```array``` and ```sub objects``` directly from the database (using the ```json1``` builtin extension)
- Schema properties response types and parsers
- JavaScript response parser for accurate types
- Custom query filters
- Locale support
- Hightlight text match

## Docs
See the [wiki](https://github.com/ffrm/graphlite/wiki) for documentation.
