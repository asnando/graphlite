# Graphlite
SQLite ORM to query data as graph and receive it as json (uses the SQLite builtin json1 extension).

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

## Wiki
See the [wiki](https://github.com/ffrm/graphlite/wiki) for reference.
