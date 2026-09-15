import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const XAI_API_KEY = process.env.XAI_API_KEY;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    service: "Grok Connector",
    status: "online",
    model: "grok-4.6"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    provider: "xAI",
    model: "grok-4.6",
    configured: Boolean(XAI_API_KEY)
  });
});

app.post("/api/grok", async (req, res) => {
  if (!XAI_API_KEY) {
    return res.status(500).json({
      error: "XAI_API_KEY is not configured."
    });
  }

  const input = req.body?.input;

  if (typeof input !== "string" || !input.trim()) {
    return res.status(400).json({
      error: "input must be a non-empty string."
    });
  }

  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-4.6",
        input: input.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error ||
          "xAI request failed."
      });
    }

    res.json({
      ok: true,
      model: "grok-4.6",
      output_text: data.output_text ?? "",
      response_id: data.id ?? null
    });
  } catch (error) {
    res.status(502).json({
      error: "Could not reach xAI.",
      detail:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Grok Connector listening on port ${PORT}`);
});
