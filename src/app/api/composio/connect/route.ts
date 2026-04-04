import { NextRequest, NextResponse } from 'next/server';
import { ComposioToolSet } from "composio-core";

export async function POST(req: NextRequest) {
  try {
    const { platform, clerkId, authConfigId, integrationId } = await req.json();
    const configId = authConfigId || integrationId;
    
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    console.log(`[Composio] Connecting platform: ${platform} for user: ${clerkId} (Config: ${configId || 'None'})`);

    if (platform === "whatsapp") {
      return NextResponse.json({ url: `${origin}/dashboard?connect=success` });
    }
    
    if (!process.env.COMPOSIO_API_KEY) {
      console.error("[Composio] COMPOSIO_API_KEY is missing");
      return NextResponse.json({ error: "Composio API Key missing" }, { status: 500 });
    }

    const composio = new ComposioToolSet({
      apiKey: process.env.COMPOSIO_API_KEY,
    });

    const redirectUrl = `${origin}/dashboard?connect=success`;

    const entity = await composio.getEntity(clerkId);
    console.log(`[Composio] Initiating connection for ${platform} with redirect: ${redirectUrl}`);

    // Create a connection URL for the platform
    const connection = await entity.initiateConnection({
      appName: platform.toLowerCase(), 
      redirectUri: redirectUrl,
      integrationId: configId, // ✅ Map the specific config if provided
      config: {
        redirectUrl: redirectUrl,
      }
    } as any);

    console.log("[Composio] Connection Response:", JSON.stringify(connection, null, 2));
    return NextResponse.json({ url: connection.redirectUrl || (connection as any).connectionUrl });
  } catch (error: any) {
    console.error("[Composio] Connection Error:", error);
    return NextResponse.json({ 
      error: error.message, 
      description: error.description,
      errCode: error.errCode
    }, { status: 500 });
  }
}
