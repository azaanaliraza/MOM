import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.HF_TOKEN) {
      return Response.json({ error: "HF_TOKEN is missing" }, { status: 500 });
    }

    // FLUX.1-schnell is 10x better at rendering text (shop names) than Stable Diffusion
    const blob = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
      parameters: {
        width: 1024,
        height: 1024,
      },
    });

    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Image = `data:image/webp;base64,${buffer.toString('base64')}`;

    return Response.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Image Gen Error:", error.message);
    return Response.json({ error: "Image engine is busy. Try again." }, { status: 500 });
  }
}
