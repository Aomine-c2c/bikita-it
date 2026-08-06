import { AIIntent } from './types';

export class IntentParser {
  /**
   * Stub intent parser. Later this will call an LLM to extract intent and entities.
   */
  public parse(query: string): AIIntent {
    const q = query.toLowerCase();

    if (q.includes('who has') || q.includes('where is') || q.includes('assets in') || q.includes('assets are in')) {
      return {
        name: 'FIND_ASSET',
        confidence: 0.8,
        entities: { query: q },
        originalQuery: query
      };
    }

    if (q.includes('offline') || q.includes('connected') || q.includes('wifi')) {
      return {
        name: 'NETWORK_QUERY',
        confidence: 0.8,
        entities: { query: q },
        originalQuery: query
      };
    }

    if (q.includes('inventory report')) {
      return {
        name: 'GENERATE_REPORT',
        confidence: 0.9,
        entities: { type: 'inventory' },
        originalQuery: query
      };
    }

    return {
      name: 'UNKNOWN',
      confidence: 1.0,
      entities: {},
      originalQuery: query
    };
  }
}
