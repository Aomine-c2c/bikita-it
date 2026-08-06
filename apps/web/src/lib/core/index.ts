import { PlatformRegistry } from './PlatformRegistry';
import { HelpDeskModule } from '../../modules/helpdesk/HelpDeskModule';

const registry = PlatformRegistry.getInstance();

// Auto-register core plugins here for now.
// In a full enterprise app, this could be dynamic or lazy-loaded.
registry.registerModule(HelpDeskModule);

export { registry };
export * from './types';
export * from './entities';
