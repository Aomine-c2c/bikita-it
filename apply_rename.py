import os

ROOT_DIR = r"c:\Users\armut\404\BikitaIT"

REPLACEMENTS = [
    ("Xiphos IT Operations Platform", "Pulse IT Operations Platform"),
    ("XIPHOS IT Operations Platform", "Pulse IT Operations Platform"),
    ("Xiphos IT Operations", "Pulse IT Operations"),
    ("xiphos-platform", "pulse-platform"),
    ("xiphos_tour_completed", "pulse_tour_completed"),
    ("XIPHOS Enterprise", "PULSE Enterprise"),
    ("Xiphos AI", "Pulse AI"),
    ("com.xiphos.itops", "com.pulse.itops"),
    ("Xiphos API Client", "Pulse API Client"),
    ("Xiphos Tauri IPC Client", "Pulse Tauri IPC Client"),
    ("Sign in to Xiphos", "Sign in to Pulse"),
    ("Xiphos Initialization", "Pulse Initialization"),
    ("BikitaIT", "Pulse"),
    ("Bikita IT", "Pulse"),
    ("bikita-api", "pulse-api"),
    ("bikita-web", "pulse-web"),
    ("bikita main wifi", "pulse main wifi"),
    ("com.bikitait.helpdesk", "com.pulse.helpdesk"),
    ("XIPHOS", "PULSE"),
    ("Xiphos", "Pulse"),
    ("xiphos", "pulse"),
]

TARGET_FILES = [
    r"package.json",
    r"package-lock.json",
    r"README.md",
    r"LAUNCH_NOTES.md",
    r"LAUNCH_READINESS.md",
    r"QA_LAUNCH_READINESS.md",
    r"start-wsl.sh",
    r"apps\web\package.json",
    r"apps\web\src-tauri\tauri.conf.json",
    r"apps\web\src-tauri\Cargo.toml",
    r"apps\web\src-tauri\capabilities\default.json",
    r"apps\web\README.md",
    r"apps\web\DOCUMENTATION.md",
    r"apps\web\OPTIMIZATION_REPORT.md",
    r"apps\web\DEPLOYMENT_REPORT.md",
    r"apps\web\src\app\layout.tsx",
    r"apps\web\src\app\login\page.tsx",
    r"apps\web\src\app\login\page.test.tsx",
    r"apps\web\src\app\setup\page.tsx",
    r"apps\web\src\app\settings\page.tsx",
    r"apps\web\src\components\layout\Header.tsx",
    r"apps\web\src\components\layout\Sidebar.tsx",
    r"apps\web\src\components\layout\AIAssistantSidebar.tsx",
    r"apps\web\src\components\updater\UpdateNotification.tsx",
    r"apps\web\src\components\assets\AssetRelationsTab.tsx",
    r"apps\web\src\lib\api.ts",
    r"apps\web\src\lib\tauri.ts",
    r"apps\web\src\lib\ai\modules\NetworkModule.ts",
    r"apps\web\src\lib\modules\HelpDeskModule.ts",
    r"apps\web\test-ai.ts",
    r"apps\web\e2e\smoke.spec.ts",
    r"apps\web\e2e\security.spec.ts",
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
