import { aiCommandCenter } from './src/lib/ai';

async function test() {
  const context = { sessionId: '1', history: [], state: {} };
  
  const queries = [
    "Who has laptop IT-021?",
    "Show offline devices.",
    "Where is Camera 12?",
    "Which assets are in Power House?",
    "Show every device connected to Bikita Main WiFi.",
    "Generate inventory report.",
    "What is the weather?" // Unknown intent
  ];

  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);
    const response = await aiCommandCenter.processQuery(query, context);
    console.log(`Handled By: ${response.handledBy || 'None'}`);
    console.log(`Response: ${response.message}`);
  }
}

test();
