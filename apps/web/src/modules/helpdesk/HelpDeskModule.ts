import { IModule } from '@/lib/core/types';

export interface Ticket {
  id: string | number;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  requesterId?: string | number;
  assignedToId?: string | number;
  assigneeName?: string;
  assigneeId?: string | number;
  assetId?: string | number;
  locationId?: string | number;
  slaDueDate?: string;
  dueDate?: string;
  comments?: Array<{ id: string; authorName: string; isInternal?: boolean; createdAt: string; content: string }>;
  createdAt: string;
  updatedAt: string;
}

export function calculateSlaDueDate(priority: string, startDate: Date): string {
  const date = new Date(startDate);
  switch (priority) {
    case 'Critical': date.setHours(date.getHours() + 4); break;
    case 'High': date.setHours(date.getHours() + 24); break;
    case 'Medium': date.setDate(date.getDate() + 3); break;
    case 'Low': date.setDate(date.getDate() + 5); break;
    default: date.setDate(date.getDate() + 3); break;
  }
  return date.toISOString();
}



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
  init: () => {
    console.log('[HelpDeskModule] Initialized successfully.');
  }
};
