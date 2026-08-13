import os

ROOT_DIR = r"c:\Users\armut\404\BikitaIT"

REPLACEMENTS = [
    ("xiphos.log", "pulse.log"),
    ("Xiphos IT Operations", "Pulse IT Operations"),
    ("error while running xiphos", "error while running pulse"),
    ("xiphos.db", "pulse.db"),
    ("com.bikita.xiphos", "com.pulse.itops"),
]

TARGET_FILES = [
    r"apps\web\src-tauri\src\main.rs",
    r"apps\web\src-tauri\src\db.rs",
    r"apps\web\src-tauri\src\bin\setup_db.rs",
]

def apply_replacements():
    for rel_path in TARGET_FILES:
        filepath = os.path.join(ROOT_DIR, rel_path)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        for old, new in REPLACEMENTS:
            content = content.replace(old, new)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")
        else:
            print(f"No changes in {filepath}")

if __name__ == '__main__':
    apply_replacements()
