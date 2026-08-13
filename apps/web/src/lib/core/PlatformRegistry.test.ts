import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformRegistry } from './PlatformRegistry';

describe('PlatformRegistry', () => {
  let registry: PlatformRegistry;

  beforeEach(() => {
    registry = PlatformRegistry.getInstance();
  });

  it('maintains a singleton instance', () => {
    const registry2 = PlatformRegistry.getInstance();
    expect(registry).toBe(registry2);
  });

  it('can register modules and retrieve extensions', () => {
    const mockModule = {
      id: 'test-module',
      name: 'Test Module',
      version: '1.0.0',
      init: () => {},
      sidebarExtensions: [
        { label: 'Test Route', href: '/test', icon: 'Box' as any, section: 'General', iconName: 'Box', roles: [] }
      ]
    };

    registry.registerModule(mockModule);
    
    const extensions = registry.getSidebarExtensions();
    expect(extensions.length).toBeGreaterThan(0);
    expect(extensions.some(e => e.label === 'Test Route')).toBe(true);
  });
});
