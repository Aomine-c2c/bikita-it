 
 

import { AIModule, AIContext, AIResponse } from './types';
import { IntentParser } from './IntentParser';

export class CommandCenter {
  private modules: Map<string, AIModule> = new Map();
  private intentParser: IntentParser;

  constructor() {
    this.intentParser = new IntentParser();
  }

  public registerModule(module: AIModule) {
    this.modules.set(module.name, module);
  }

  public async processQuery(query: string, context: AIContext): Promise<AIResponse> {
    try {
      // 1. Parse intent
      const intent = this.intentParser.parse(query);

      // 2. Find handling module
      let handlingModule: AIModule | undefined;
      for (const mod of this.modules.values()) {
        if (mod.supportedIntents.includes(intent.name)) {
          handlingModule = mod;
          break;
        }
      }

      // 3. Execute or fallback
      if (handlingModule) {
        return await handlingModule.execute(intent, context);
      } else {
        return {
          message: "I'm sorry, I don't have a module to handle that request yet.",
          intent
        };
      }
    } catch (error) {
      console.error("Error processing AI query:", error);
      return {
        message: "An error occurred while processing your request."
      };
    }
  }
}
