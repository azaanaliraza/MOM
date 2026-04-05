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

    // Use the direct REST API for reliability
    const initiateUrl = 'https://backend.composio.dev/api/v2/connectedAccounts/initiateConnection';
    const body: any = {
      appName: platform.toLowerCase(),
      entityId: clerkId,
      redirectUri: redirectUrl,
    };

    if (configId?.startsWith("ac_")) {
      body.authConfigId = configId;
    } else if (configId) {
      body.integrationId = configId;
    }

    console.log(`[Composio] Sending REST → ${initiateUrl} body=${JSON.stringify(body)}`);

    const res = await fetch(initiateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.COMPOSIO_API_KEY as string,
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    console.log("[Composio] Connection Response:", JSON.stringify(result, null, 2));

    if (!res.ok) {
      throw new Error(`Composio API Error: ${JSON.stringify(result)}`);
    }

    const redirectUrlToUse = result.connectionResponse?.redirectUrl || result.redirectUrl || result.connectionUrl;
    return NextResponse.json({ url: redirectUrlToUse });
  } catch (error: any) {
    console.error("[Composio] Connection Error:", error);
    return NextResponse.json({ 
      error: error.message, 
      description: error.description,
      errCode: error.errCode
    }, { status: 500 });
  }
}
