const fs = require('fs');
let db = fs.readFileSync('apps/web/src-tauri/src/db.rs', 'utf8');

const newTable = `
            CREATE TABLE IF NOT EXISTS asset_assignments (
                id TEXT PRIMARY KEY NOT NULL,
                asset_id TEXT NOT NULL REFERENCES hardware_assets(id),
                employee_id TEXT NOT NULL REFERENCES employees(employee_id),
                assignment_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                issued_at TEXT NOT NULL DEFAULT (datetime('now')),
                returned_at TEXT,
                notes TEXT
            );
`;

const newTriggers = `
            -- Triggers for ASSET ASSIGNMENTS
            CREATE TRIGGER IF NOT EXISTS assignment_insert_trigger
            AFTER INSERT ON asset_assignments
            BEGIN
              INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description)
              VALUES (lower(hex(randomblob(16))), 'ASSIGNMENT', NEW.asset_id, 'ISSUED', 'Asset issued to employee: ' || NEW.employee_id);
            END;

            CREATE TRIGGER IF NOT EXISTS assignment_update_trigger
            AFTER UPDATE ON asset_assignments
            BEGIN
              INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description)
              VALUES (lower(hex(randomblob(16))), 'ASSIGNMENT', NEW.asset_id, 'RETURNED', 'Asset returned by employee: ' || NEW.employee_id);
            END;
`;

// Insert newTable before timeline_events
if (!db.includes('asset_assignments')) {
  db = db.replace('CREATE TABLE IF NOT EXISTS timeline_events', newTable + '\n            CREATE TABLE IF NOT EXISTS timeline_events');
}

// Insert newTriggers before the end of the query string `        ")?;`
if (!db.includes('assignment_insert_trigger')) {
  db = db.replace('        ")?;', newTriggers + '\n        ")?;');
}

fs.writeFileSync('apps/web/src-tauri/src/db.rs', db);
