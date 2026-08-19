import { AIModule, AIIntent, AIContext, AIResponse } from '../types';
import { apiFetch, type InventoryItem } from '@/lib/api';

export class InventoryModule implements AIModule {
  name = 'InventoryModule';
  description = 'Handles queries related to inventory, stock levels, and generating reports.';
  supportedIntents = ['GENERATE_REPORT'];

  async execute(intent: AIIntent, _context: AIContext): Promise<AIResponse> {
    const query = intent.originalQuery.toLowerCase();
    let message = "I can help with inventory reports.";
    let data: unknown = null;
    
    try {
      const inventory = await apiFetch<InventoryItem[]>('/inventory');
      data = inventory;
      
      if (query.includes("inventory report")) {
        const totalItems = inventory.length;
        const lowStock = inventory.filter((item) => item.quantity < (item.min_stock || 5));
        
        message = `Generating the inventory report for you now. You have ${totalItems} items in inventory, with ${lowStock.length} items currently low on stock.`;
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      message = "Sorry, I couldn't fetch the inventory data at this moment.";
    }

    return {
      message,
      handledBy: this.name,
      data
    };
  }
}
