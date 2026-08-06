const fs = require('fs');
const main = fs.readFileSync('apps/web/src-tauri/src/main.rs', 'utf8');
let commands = fs.readFileSync('apps/web/src-tauri/src/commands.rs', 'utf8');
let cud = fs.readFileSync('apps/web/src-tauri/src/commands_update_delete.rs', 'utf8');

const handlerMatch = main.match(/invoke_handler\(tauri::generate_handler!\[([\s\S]*?)\]\)/);
const fns = handlerMatch[1].split(',').map(s => s.trim()).filter(s => s);

let newStubs = '';

fns.forEach(fn => {
  if (!commands.includes('pub fn ' + fn) && !cud.includes('pub fn ' + fn)) {
    console.log('Generating stub for:', fn);
    newStubs += `\n#[tauri::command]\npub fn ${fn}() -> Result<serde_json::Value, String> { Ok(serde_json::Value::Null) }\n`;
  }
});

if (newStubs) {
  fs.writeFileSync('apps/web/src-tauri/src/commands.rs', commands + newStubs);
}

// Also remove duplicate `create_asset` from commands_update_delete.rs if it's in commands.rs
if (commands.includes('pub fn create_asset') && cud.includes('pub fn create_asset')) {
  console.log('Removing duplicate create_asset from cud');
  // simplistic replace, wait it might be multi-line
  // let's just rename it in cud
  cud = cud.replace('pub fn create_asset', 'pub fn create_asset_dup');
  fs.writeFileSync('apps/web/src-tauri/src/commands_update_delete.rs', cud);
}
