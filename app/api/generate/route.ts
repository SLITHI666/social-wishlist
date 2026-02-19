import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key не найден" }, { status: 500 });
    }

    // Твоя рабочая модель
    const model = "gemini-2.5-flash"; 
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemInstruction = `
      Ты помощник для составления вишлиста.
      Придумай 3 креативных подарка.
      
      Формат: ТОЛЬКО чистый JSON массив.
      
      Структура объекта:
      - name: Название (RU)
      - price: Цена (число)
      - description: Описание (5 слов)
      - imageQuery: Название этого товара на АНГЛИЙСКОМ (для поиска картинки)
      
      Пример:
      [
        { "name": "Игровая мышь", "price": 3000, "description": "С подсветкой", "imageQuery": "gaming mouse computer" }
      ]
    `;

    const fullPrompt = `${systemInstruction}\n\nИнтересы: ${prompt}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    if (!response.ok) throw new Error(`Google Error: ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let json;
    try {
      json = JSON.parse(cleanText);
    } catch (e) {
      const match = cleanText.match(/\[[\s\S]*\]/);
      if (match) json = JSON.parse(match[0]);
      else throw new Error("JSON error");
    }

    return NextResponse.json({ ideas: json });

  } catch (error: any) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}