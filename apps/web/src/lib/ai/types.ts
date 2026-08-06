export interface AIIntent {
  name: string;
  confidence: number;
  entities: Record<string, unknown>;
  originalQuery: string;
}

export interface AIContext {
  userId?: string;
  sessionId: string;
  history: string[];
  state: Record<string, unknown>;
}

export interface AIResponse {
  message: string;
  data?: unknown;
  handledBy?: string;
  intent?: AIIntent;
}

export interface AIModule {
  name: string;
  description: string;
  supportedIntents: string[];
  execute: (intent: AIIntent, context: AIContext) => Promise<AIResponse> | AIResponse;
}
