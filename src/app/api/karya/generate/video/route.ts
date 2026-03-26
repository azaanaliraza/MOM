import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.HF_TOKEN) {
      return Response.json({ error: "HF_TOKEN is missing" }, { status: 500 });
    }

    // 📺 PIVOT: Mobile-first text-to-video is currently high-fail on free HF.
    // We generate a high-quality 9:16 'Reel Poster' using FLUX and animate it in CSS.
    const blob = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: `${prompt}, vertical smartphone reel format 9:16, cinematic, street photography style, high resolution`,
      parameters: {
        width: 720,
        height: 1280, // Vertical format
      },
    });

    const buffer = Buffer.from(await (blob as any).arrayBuffer());
    const base64Image = `data:image/webp;base64,${buffer.toString('base64')}`;

    // We return it as videoUrl for the frontend player, but it's really a vertical image
    return Response.json({ videoUrl: base64Image });

  } catch (error: any) {
    console.error("Video/Reel Error:", error.message);
    return Response.json({ error: "Reel engine is busy. Try again." }, { status: 500 });
  }
}
