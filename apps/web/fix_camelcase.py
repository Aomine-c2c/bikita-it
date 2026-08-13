import re
with open('src-tauri/src/commands.rs', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'#\[derive\(Serialize, Deserialize\)\]\n(?:#\[serde.*?\]\n)?pub struct', '#[derive(Serialize, Deserialize)]\n#[serde(rename_all = "camelCase")]\npub struct', content)
with open('src-tauri/src/commands.rs', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
