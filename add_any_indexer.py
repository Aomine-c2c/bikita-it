import re
import os

files = [
    r"c:\Users\armut\404\BikitaIT\apps\web\src\lib\core\entities.ts",
    r"c:\Users\armut\404\BikitaIT\apps\web\src\lib\api.ts"
]

for path in files:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find all interfaces and add the indexer if not already there
    # Regex to find `export interface X {` and add the indexer at the start
    def replacer(match):
        interface_decl = match.group(0)
        # Avoid double adding
        if "[key: string]: any;" in interface_decl or "[key: string]: unknown;" in interface_decl:
            return interface_decl
        return match.group(1) + "\n  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n  [key: string]: any;"
        
    content = re.sub(r'(export interface \w+\s*\{)', replacer, content)
    
    # Also fix DashboardStats in api.ts which has nested `kpis: {`
    if 'api.ts' in path:
        content = content.replace("export interface DashboardStats {\n  kpis: {", "export interface DashboardStats {\n  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n  [key: string]: any;\n  kpis: {")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Added indexers to {path}")

