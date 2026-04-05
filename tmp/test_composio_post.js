require('dotenv').config({ path: '.env.local' });
const { ComposioToolSet } = require("composio-core");
const fs = require('fs');

async function test() {
  const apiKey = process.env.COMPOSIO_API_KEY;
  const composio = new ComposioToolSet({ apiKey });
  const output = {};

  try {
    const allConns = await composio.client.connectedAccounts.list({ showActiveOnly: true });
    output.allConnections = (allConns.items || []).map(c => ({
      app: c.appName, 
      status: c.status, 
      id: c.id,
      entityId: c.entityId,
      clientUniqueUserId: c.clientUniqueUserId,
    }));
  } catch(e) { output.listError = e.message; }

  fs.writeFileSync('./tmp/result3.json', JSON.stringify(output, null, 2));
  console.log("Done.");
}

test();
