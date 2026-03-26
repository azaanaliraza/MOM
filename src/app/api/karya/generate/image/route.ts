import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // 1. Generate the image
    const response = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
      parameters: {
        width: 1024,
        height: 1024,
      },
    });

    // 2. THE FIX: Cast to 'any' or 'Blob' to bypass the string-type error
    // We convert the Blob into an ArrayBuffer, then into a Node.js Buffer
    const arrayBuffer = await (response as any).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Convert to Base64
    const base64Image = `data:image/webp;base64,${buffer.toString('base64')}`;

    return Response.json({ imageUrl: base64Image });
    
  } catch (error: any) {
    console.error("Image Gen Error:", error.message);
    return Response.json({ error: "Image engine is busy." }, { status: 500 });
  }
}

