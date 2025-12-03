export async function onRequestPost({ request, env }) {
  const { prompt, model, quality, size, n, image, mask } = await request.json();

  const asBlob = async (dataUrl) => {
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const parseImages = async (response) => {
    const txt = await response.text();
    if (!response.ok) return new Response(txt, { status: response.status });

    const json = JSON.parse(txt || "{}");
    const images = (json.data || []).map(d => {
      const b64 = d.b64_json || "";
      const dataUrl = b64 ? `data:image/png;base64,${b64}` : d.url;
      return { b64, dataUrl };
    });

    return new Response(JSON.stringify({ images }), {
      headers: { "Content-Type": "application/json" }
    });
  };

  if (image && mask) {
    const form = new FormData();
    form.append("prompt", prompt || "");
    form.append("model", model || "gpt-image-1");
    if (quality) form.append("quality", quality);
    if (size) form.append("size", size);
    form.append("n", String(n || 1));
    form.append("image", await asBlob(image), "image.png");
    form.append("mask", await asBlob(mask), "mask.png");

    const r = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: form,
    });

    return parseImages(r);
  }

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
    }),
  });

  return parseImages(r);
}
