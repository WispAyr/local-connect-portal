const fs = require('fs');
const path = require('path');

function loadModules(db, app) {
  const modulesDir = path.join(__dirname, 'modules');
  const loaded = [];

  if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
    return loaded;
  }

  const dirs = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dir of dirs) {
    const modPath = path.join(modulesDir, dir, 'index.js');
    if (!fs.existsSync(modPath)) continue;

    try {
      const mod = require(modPath);
      if (!mod.name) { console.warn(`Module ${dir} missing name, skipping`); continue; }

      // Run setup if provided
      if (typeof mod.setup === 'function') mod.setup(db);

      // Mount routes
      if (mod.routes) {
        app.use(`/api/modules/${mod.name}`, mod.routes);
      }

      const record = {
        id: mod.name,
        name: mod.displayName || mod.name,
        productLine: mod.productLine || 'shared',
        version: mod.version || '1.0.0',
        permissions: mod.permissions || []
      };

      // Upsert into modules table
      db.prepare('INSERT OR REPLACE INTO modules (id, name, product_line, version, is_active) VALUES (?,?,?,?,1)').run(
        record.id, record.name, record.productLine, record.version
      );

      loaded.push(record);
      console.log(`Module loaded: ${record.name} (${record.productLine})`);
    } catch (e) {
      console.error(`Failed to load module ${dir}:`, e.message);
    }
  }

  return loaded;
}

module.exports = { loadModules };
