const fs = require('fs');

let api = fs.readFileSync('apps/web/src/lib/api.ts', 'utf8');

// Patch 1: Add `/employees/:id/profile` logic to `apiFetch`
let toFind = /if\s*\(path\s*===\s*'\/employees'\)\s*\{\s*const\s*rows:\s*any\[\]\s*=\s*await\s*invoke\('get_employees'\);\s*return\s*rows\s*as\s*T;\s*\}/;
let replaceWith = `if (path === '/employees') {
        const rows: any[] = await invoke('get_employees');
        return rows as T;
      }
      if (path.startsWith('/employees/') && path.endsWith('/profile')) {
        const id = path.split('/')[2];
        const profile: any = await invoke('get_employee_profile', { id });
        return profile as T;
      }`;

if (toFind.test(api)) {
    api = api.replace(toFind, replaceWith);
    console.log("Successfully patched apiFetch");
} else {
    console.error("Failed to find apiFetch target string.");
}

// Patch 2: Add `getProfile` to `employeesApi`
let toFind2 = /export\s*const\s*employeesApi\s*=\s*\{\s*getAll:\s*async\s*\(\)\s*=>\s*\{\s*const\s*result\s*=\s*await\s*apiFetch<Paginated<Employee>\s*\|\s*Employee\[\]>\('\/employees'\);\s*return\s*Array\.isArray\(result\)\s*\?\s*result\s*:\s*result\.data;\s*\},\s*getOne:\s*\(id:\s*string\)\s*=>\s*apiFetch<Employee>\(`\/employees\/\$\{id\}`\),\s*\};/;
let replaceWith2 = `export const employeesApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<Employee> | Employee[]>('/employees');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<Employee>(\`/employees/\${id}\`),
  getProfile: (id: string) => apiFetch<any>(\`/employees/\${id}/profile\`),
};`;

if (toFind2.test(api)) {
    api = api.replace(toFind2, replaceWith2);
    console.log("Successfully patched employeesApi");
} else {
    console.error("Failed to find employeesApi target string.");
}

fs.writeFileSync('apps/web/src/lib/api.ts', api);
