type AiProvider = 'openai' | 'gemini';

function getConfiguredProvider(): AiProvider | null {
  const preferred = process.env.AI_PROVIDER?.toLowerCase();
  if (preferred === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (preferred === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

function extractOpenAIText(payload: any): string | null {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const textParts = output.flatMap((item: any) =>
    Array.isArray(item?.content)
      ? item.content
          .filter((part: any) => typeof part?.text === 'string')
          .map((part: any) => part.text.trim())
      : []
  );
  return textParts.join('\n').trim() || null;
}

async function callOpenAI(prompt: string, system: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_output_tokens: 180,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = await response.json();
  return extractOpenAIText(payload);
}

async function callGemini(prompt: string, system: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 180,
        temperature: 0.9,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const payload: any = await response.json();
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .filter((part: any) => typeof part?.text === 'string')
    .map((part: any) => part.text.trim())
    .join('\n')
    .trim();
  return text || null;
}

export async function generateAiText(
  prompt: string,
  system: string
): Promise<string | null> {
  const provider = getConfiguredProvider();
  if (!provider) return null;

  try {
    return provider === 'openai'
      ? await callOpenAI(prompt, system)
      : await callGemini(prompt, system);
  } catch (error) {
    console.error(`[AI] ${provider} generation failed:`, error);
    return null;
  }
}
