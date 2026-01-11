export async function onRequestPost({ request, env }) {
  const { prompt } = await request.json();

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: "You are enhancing user image prompts. Return a concise, vivid prompt ready for an image model.",
        },
        {
          role: "user",
          content: prompt || "",
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  const txt = await r.text();
  if (!r.ok) return new Response(txt, { status: r.status });

  const json = JSON.parse(txt || "{}");
  const enhanced = json.choices?.[0]?.message?.content?.trim() || prompt || "";

  return new Response(JSON.stringify({ prompt: enhanced }), {
    headers: { "Content-Type": "application/json" },
  });
}
