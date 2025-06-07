import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { extractedText } = await req.json();

    if (!extractedText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const prompt = `Can you give me a json object:

Name of the company (Usually at the delivery address or From field)
PO Number (Usually at the top of the PO)
PO Date (Usually at the top of the PO - format it in date format mm/dd/yyyy)
Array of the line items of this PO

Extract this information from the following text. Return ONLY valid JSON, no additional text or explanations.

Text:
${extractedText}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              'You are a helpful assistant that extracts purchase order information from text and returns it as JSON. Always return valid JSON with the following structure: { "customerName": "", "poNumber": "", "poDate": "", "lineItems": [{ "itemNumber": "", "description": "", "quantity": 0, "unitPrice": 0, "totalPrice": 0 }] }. IMPORTANT: Format the poDate field as mm/dd/yyyy (e.g., "01/15/2024", "12/31/2023"). If you find a date in any other format, convert it to mm/dd/yyyy format.',
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to process with OpenAI");
    }

    const data = await response.json();
    const extractedData = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process text" },
      { status: 500 }
    );
  }
}
