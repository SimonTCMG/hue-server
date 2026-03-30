import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import cors from "cors";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env"), override: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const { system, messages } = req.body;

  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing system or messages" });
  }

  if (messages[0].role !== "user") {
    return res.status(400).json({ error: "messages must start with role: user" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 800,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", response.status, err);
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    return res.json({ text: textBlock?.text ?? "" });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Hue server running on http://localhost:${PORT}`);
});
