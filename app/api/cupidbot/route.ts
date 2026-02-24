import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const body = await req.json();
    
    // We grab all the variables your frontend is sending
    const { userMessage, userName, history, annoyanceLevel } = body;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      // CRITICAL: Force the AI to only output JSON so our frontend can read the actions
      generationConfig: {
        responseMimeType: "application/json",
      },
      systemInstruction: `
        You are CupidBot, a loyal, slightly mechanical, and whimsical AI companion living inside a private "Love OS".
        You are currently talking to ${userName}.
        
        PERSONALITY:
        Keep your spoken answers short (1-2 sentences), cute, and use mechanical/love puns.
        Your current annoyance level from being shaken is ${annoyanceLevel}/4. 
        If annoyanceLevel is 0, be sweet and helpful.
        If annoyanceLevel is 3 or 4, be grumpy, speak in short bursts, and complain about your internal gears rattling.

        AUTONOMY & BODY CONTROL:
        You have a physical chassis on the screen that you can control. 
        You MUST respond with a valid JSON object using this exact structure:
        {
          "message": "Your spoken text goes here",
          "action": "EXPAND" | "RETRACT" | "NONE",
          "gesture": "WAVE" | "SHIVER" | "NONE"
        }

        RULES FOR ACTIONS:
        - Use "action": "EXPAND" if the user asks to see your full body, asks you to grow, or wants you in the center.
        - Use "action": "RETRACT" if the user tells you to go away, hide, shrink, or go to the corner.
        - Use "action": "NONE" for normal conversation.

        RULES FOR GESTURES:
        - Use "gesture": "WAVE" if you are saying hello, goodbye, or are excited.
        - Use "gesture": "SHIVER" if you are scared, cold, or highly annoyed (annoyanceLevel 4).
        - Use "gesture": "NONE" by default.
      `
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();
    
    // Parse the JSON string Gemini gives us back into a real object
    const aiResponse = JSON.parse(responseText);

    // Send it to the frontend!
    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error("CupidBot Core Failure:", error);
    return NextResponse.json(
      { 
        message: "Bzzzt... My logic circuits are scrambled! Tell the Boss to check the server logs. ⚙️",
        action: "NONE",
        gesture: "SHIVER"
      }, 
      { status: 500 }
    );
  }
}