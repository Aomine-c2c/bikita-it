const fs = require('fs');

// 1. Process commands_update_delete.rs
let cudFile = 'apps/web/src-tauri/src/commands_update_delete.rs';
let cudCode = fs.readFileSync(cudFile, 'utf8');

// Add allow unused at the top
cudCode = '#![allow(unused_variables)]\n#![allow(unused_assignments)]\n' + cudCode;

// Add #[tauri::command] before every pub fn
cudCode = cudCode.replace(/pub fn /g, '#[tauri::command]\npub fn ');

fs.writeFileSync(cudFile, cudCode);

// 2. Process commands.rs
let cmdFile = 'apps/web/src-tauri/src/commands.rs';
let cmdCode = fs.readFileSync(cmdFile, 'utf8');
cmdCode = '#![allow(unused_variables)]\n#![allow(unused_assignments)]\n' + cmdCode;
fs.writeFileSync(cmdFile, cmdCode);

// 3. Process main.rs
let mainFile = 'apps/web/src-tauri/src/main.rs';
let mainCode = fs.readFileSync(mainFile, 'utf8');

if (!mainCode.includes('mod commands_update_delete;')) {
  mainCode = mainCode.replace('mod commands;', 'mod commands;\nmod commands_update_delete;');
}
if (!mainCode.includes('use commands_update_delete::*;')) {
  mainCode = mainCode.replace('use commands::*;', 'use commands::*;\nuse commands_update_delete::*;');
}

fs.writeFileSync(mainFile, mainCode);
