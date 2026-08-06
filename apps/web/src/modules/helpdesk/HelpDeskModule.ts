import { IModule } from '@/lib/core/types';

export interface Ticket {
  id: string | number;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  requesterId?: string | number;
  assignedToId?: string | number;
  assetId?: string | number;
  locationId?: string | number;
  createdAt: string;
  updatedAt: string;
  }

// Mock Data
let tickets: Ticket[] = [
  {
    id: 'TKT-1001',
    title: 'Laptop won\'t turn on',
    description: 'My Thinkpad is completely dead. Charger light is not blinking.',
    status: 'Open',
    priority: 'High',
    requesterId: 'EMP-001',
    assignedToId: 'EMP-002',
    assetId: '1', // IT-021
    locationId: 'L1', // Headquarters
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'TKT-1002',
    title: 'Need access to HR Shared Drive',
    description: 'Please grant me access to the HR folder on the network drive.',
    status: 'Resolved',
    priority: 'Medium',
    requesterId: 'EMP-003',
    assignedToId: 'EMP-002',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  }
];

export const HelpDeskModule: IModule = {
  id: 'helpdesk',
  name: 'Help Desk / IT Ticketing',
  version: '1.0.0',
  sidebarExtensions: [
    {
      section: 'Support',
      label: 'Help Desk',
      href: '/helpdesk',
      iconName: 'LifeBuoy',
      roles: ['admin', 'tech', 'user']
    }
  ],
  apiExtensions: [
    {
      matchPrefix: '/api/tickets',
      handler: async (path: string, options?: RequestInit) => {
        // Simple routing for /api/tickets
        if (path === '/api/tickets' && (!options || options.method === 'GET')) {
          return { data: tickets };
        }
        
        if (path === '/api/tickets' && options?.method === 'POST') {
          const body = JSON.parse(options.body as string);
          const newTicket: Ticket = {
            id: `TKT-${1000 + tickets.length + 1}`,
            ...body,
            status: body.status || 'Open',
            priority: body.priority || 'Medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          tickets = [newTicket, ...tickets];
          return newTicket;
        }

        const match = path.match(/^\/api\/tickets\/([A-Za-z0-9-]+)$/);
        if (match) {
          const id = match[1];
          const ticket = tickets.find(t => t.id === id);
          if (!ticket) throw new Error('Ticket not found');

          if (!options || options.method === 'GET') {
            return ticket;
          }

          if (options.method === 'PATCH') {
            const body = JSON.parse(options.body as string);
            Object.assign(ticket, { ...body, updatedAt: new Date().toISOString() });
            return ticket;
          }

          if (options.method === 'DELETE') {
            tickets = tickets.filter(t => t.id !== id);
            return { success: true };
          }
        }
        
        throw new Error('Not Found');
      }
    }
  ],
  init: () => {
    console.log('[HelpDeskModule] Initialized successfully.');
  }
};
