import { IModule } from '../core/types';

export const HelpDeskModule: IModule = {
  id: 'com.pulse.helpdesk',
  name: 'Help Desk Module',
  version: '1.0.0',
  
  sidebarExtensions: [
    {
      section: 'Governance', // Inject into the 'Governance' section for now, or create a new section if we modify Sidebar.tsx to handle dynamic sections.
      label: 'Service Desk',
      href: '/service-desk',
      iconName: 'LifeBuoy',
      roles: ['ADMIN', 'TECH', 'VIEWER']
    }
  ],

  apiExtensions: [
    {
      matchPrefix: '/service-desk',
      handler: async (path: string, _options?: RequestInit) => {
        // Mock response for testing API interception
        if (path === '/service-desk/tickets') {
          return [
            { id: 1, title: 'Printer broken', status: 'OPEN' },
            { id: 2, title: 'Laptop not booting', status: 'IN_PROGRESS' }
          ];
        }
        return { message: 'Service Desk API Root' };
      }
    }
  ],

  init: () => {
    console.log('[HelpDeskModule] Initializing...');
  }
};
