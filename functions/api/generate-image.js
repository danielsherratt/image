export async function onRequestPost({ request, env }) {
  const { prompt, model, quality, size, n } = await request.json();

  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "gpt-image-1",
      prompt,
      quality: quality || "low",
      size: size || "1024x1024",
      n: n || 1,
      response_format: "b64_json"
    }),
  });

  const txt = await r.text();
  if (!r.ok) return new Response(txt, { status: r.status });

  const json = JSON.parse(txt);
  const images = (json.data || []).map(d => {
    const b64 = d.b64_json;
    const dataUrl = `data:image/png;base64,${b64}`;
    return { b64, dataUrl };
  });

  return new Response(JSON.stringify({ images }), {
    headers: { "Content-Type": "application/json" }
  });
}
