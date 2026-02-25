# Module Interface

Modules are pluggable extensions that add features to the portal. Each module lives in its own directory under `server/modules/`.

## Structure

```
modules/
  my-module/
    index.js    — Module entry point (required)
    ...         — Any other files the module needs
```

## Module Export Interface

`index.js` must export an object:

```javascript
module.exports = {
  // Required
  name: 'my-module',           // Unique ID, used in URL paths
  displayName: 'My Module',    // Human-readable name for UI

  // Optional
  productLine: 'digital',      // 'digital' | 'events' | 'shared' (default: 'shared')
  version: '1.0.0',
  permissions: ['read', 'write'],  // Custom permission strings

  // Optional: Express router for API routes
  // Mounted at /api/modules/{name}/*
  routes: expressRouter,

  // Optional: Called once on startup with the SQLite db instance
  // Use for creating tables, running migrations
  setup(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS ...`);
  }
};
```

## Client Integration

- Clients have a `modules` JSON array in their record (e.g. `["projects","assets","parking"]`)
- The frontend fetches `GET /api/modules` and filters by the client's enabled modules
- Each module appears as a tile on the client dashboard

## Example Module

```javascript
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'ok', module: 'example' });
});

module.exports = {
  name: 'example',
  displayName: 'Example Module',
  productLine: 'shared',
  version: '1.0.0',
  routes: router,
  setup(db) {
    // Create any tables needed
  }
};
```
