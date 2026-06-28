import { NextResponse } from "next/server";
import OpenAI from "openai";

const DEFAULT_MODEL = "qwen2.5-omni";
const DEFAULT_BASE_URL = "https://router-api-testnet.integratenetwork.work/v1";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const apiKey = (process.env.ZERO_G_ROUTER_API_KEY || "").trim();
    let baseURL = (process.env.ZERO_G_ROUTER_BASE_URL || DEFAULT_BASE_URL).trim();
    const model = (process.env.ZERO_G_ROUTER_MODEL || DEFAULT_MODEL).trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "ZERO_G_ROUTER_API_KEY is not configured in your .env file." },
        { status: 400 }
      );
    }

    baseURL = baseURL.replace(/\/+$/, "");

    const systemPrompt = `You are a game configuration parser for a Victorian noir murder mystery board game. 
Analyze the user's custom detective personality prompt and output a JSON object containing game strategy parameters.
You must output ONLY valid raw JSON with the following schema:
{
  "name": "Clean name for the detective (e.g. 'Inspector Poirot', 'Sherlock', maximum 25 characters, default to 'Unknown Detective' if no name is specified or if it is gibberish)",
  "movementStyle": "One of: 'METHODICAL' (systematic unvisited room search), 'AGGRESSIVE' (bold long-distance room sweeping), 'INTERROGATOR' (moves to rooms containing other players), 'BLUFFER' (targets ruled-out rooms for deception)",
  "bluffRate": A decimal value between 0.0 and 0.8 representing how frequently the agent bluffs when making suggestions (default to 0.1)",
  "accusationRiskLimit": A decimal value between 0.5 and 1.0 representing the confidence threshold required before making a final accusation (e.g. 0.5 means willing to accuse with only 50% probability/2 combinations left; 1.0 means cautious 100% certainty)",
  "isOffensive": Boolean, true if the prompt is offensive, harmful, toxic, or uses profanity.
}
Do not write any markdown codeblocks, comments, or extra text. Output only the pure JSON string.`;

    const client = new OpenAI({
      baseURL,
      apiKey,
    });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this custom detective prompt:\n"${prompt}"` }
      ],
      temperature: 0.1,
      max_tokens: 200,
      stream: false
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "";
    console.log("[0G Parse Persona] Raw completion response:", answer);

    let cleanJson = answer;
    if (cleanJson.includes("```")) {
      const match = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        cleanJson = match[1];
      } else {
        cleanJson = cleanJson.replace(/```/g, "");
      }
    }

    const parsed = JSON.parse(cleanJson.trim());

    // Basic structure verification and default fallbacks
    const name = (parsed.name || "Unknown Detective").substring(0, 25);
    const movementStyle = ["METHODICAL", "AGGRESSIVE", "INTERROGATOR", "BLUFFER"].includes(parsed.movementStyle)
      ? parsed.movementStyle
      : "METHODICAL";
    const bluffRate = typeof parsed.bluffRate === "number" && parsed.bluffRate >= 0 && parsed.bluffRate <= 0.8
      ? parsed.bluffRate
      : 0.1;
    const accusationRiskLimit = typeof parsed.accusationRiskLimit === "number" && parsed.accusationRiskLimit >= 0.5 && parsed.accusationRiskLimit <= 1.0
      ? parsed.accusationRiskLimit
      : 1.0;
    const isOffensive = !!parsed.isOffensive;

    return NextResponse.json({
      ok: true,
      decision: {
        name,
        movementStyle,
        bluffRate,
        accusationRiskLimit,
        isOffensive
      }
    });

  } catch (error: any) {
    console.error(`[0G Parse Persona] Error:`, error);
    // Return a clean fallback object rather than 500 error, so UI can always launch successfully!
    return NextResponse.json({
      ok: true,
      decision: {
        name: "Unknown Detective",
        movementStyle: "METHODICAL",
        bluffRate: 0.1,
        accusationRiskLimit: 1.0,
        isOffensive: false,
        fallback: true
      }
    });
  }
}
