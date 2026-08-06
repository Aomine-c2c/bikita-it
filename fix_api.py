import re
import os

path = 'apps/web/src/lib/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Deduplicate [key: string]: any;
# We will just replace all instances of multiple [key: string]: any; within interfaces.
# A simpler way: just remove all `[key: string]: any;` and then we can optionally add them back, or just let TS complain if it needs it.
# Actually, the duplicate index signature only happened in specific interfaces at the bottom of the file (added by patches).
# Let's just find interfaces that have duplicate `[key: string]: any;` and remove the second one.
lines = content.split('\n')
out_lines = []
in_interface = False
seen_indexer = False
for line in lines:
    if 'interface ' in line:
        in_interface = True
        seen_indexer = False
    if in_interface and '[key: string]: any;' in line:
        if seen_indexer:
            # duplicate, replace it with empty
            line = line.replace('[key: string]: any;', '')
        else:
            seen_indexer = True
    if '}' in line and in_interface:
        in_interface = False
    out_lines.append(line)

content = '\n'.join(out_lines)

# 2. Add properties
def insert_before(content, search, add):
    if add in content: return content
    return content.replace(search, add + '\n' + search)

content = insert_before(content, 
                        '  assignedUser?:', 
                        '  assigneeId?: string | null;')
                        
content = insert_before(content, 
                        '  binLocation?:', 
                        '  status?: string | null;')
                        
content = insert_before(content, 
                        '  technician?:', 
                        '  scheduledDate?: string | null;\n  completedDate?: string | null;\n  type?: string | null;')
                        
content = insert_before(content, 
                        '  employee?:', 
                        '  locationId?: string | null;\n  networkName?: string | null;')

# 3. Update operationsApi
operations_api = """export const operationsApi = {
  getHistory: async () => await apiFetch<OperationHistoryRecord[]>('/operations/history'),
  execute: async (payload: any) => await apiFetch<any>('/operations/execute', { method: 'POST', body: JSON.stringify(payload) }),
  getAll: async () => await apiFetch<any[]>('/operations')
};"""
content = re.sub(r'export const operationsApi = \{[\s\S]*?getAll: async \(\) => await apiFetch\(\'/operations\'\)\n\};', operations_api, content)

# 4. Update employeesApi
employees_api = """export const employeesApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<Employee> | Employee[]>('/employees');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<Employee>(`/employees/${id}`),
  getProfile: (id: string) => apiFetch<any>(`/employees/${id}/profile`),
  create: (data: Partial<Employee>) => apiFetch<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Employee>) => apiFetch<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/employees/${id}`, { method: 'DELETE' }),
};"""
content = re.sub(r'export const employeesApi = \{[\s\S]*?getProfile: \(id: string\) => apiFetch<any>\(`/employees/\$\{id\}/profile`\),\n\};', employees_api, content)

# 5. Add knowledgeApi, KnowledgeDocument, aiApi ask
if 'export interface KnowledgeDocument' not in content:
    knowledge_api = """
export interface KnowledgeDocument {
  id: string; 
  title: string; 
  content?: string; 
  category: string; 
  tags?: string[]; 
  [key: string]: any;
}

export type DocumentCategory = string;

export const knowledgeApi = {
  getAll: async () => await apiFetch<any>('/knowledge'),
  getOne: async (id: string) => await apiFetch<any>(`/knowledge/${id}`),
  create: async (data: any) => await apiFetch<any>('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: any) => await apiFetch<any>(`/knowledge/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: async (id: string) => await apiFetch<any>(`/knowledge/${id}`, { method: 'DELETE' }),
};
"""
    content += knowledge_api

if 'ask: async' not in content:
    content = content.replace('export const aiApi = {\n  processQuery:', 'export const aiApi = {\n  ask: async (query: string, context?: any) => await apiFetch<any>(\'/ai/ask\', { method: \'POST\', body: JSON.stringify({ query, context }) }),\n  processQuery:')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("api.ts patched successfully.")
