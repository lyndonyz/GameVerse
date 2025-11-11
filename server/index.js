// index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// --- In-memory comments store: { [gameId]: [{ text, at }] } ---
const commentsByGame = Object.create(null);

// Health
app.get("/api", (_req, res) => res.json({ ok: true }));

// Search (name + image)
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Missing query ?q=" });

  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  try {
    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(
      q
    )}&page_size=10`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`RAWG API error: ${response.status}`);

    const json = await response.json();
    const results = (json.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      image: g.background_image || g.background_image_additional || null,
    }));

    res.json({ results });
  } catch (err) {
    console.error("RAWG search error:", err);
    res.status(500).json({ error: "Failed to search games" });
  }
});

// Game details (rich info for details panel)
app.get("/api/game/:id", async (req, res) => {
  const gameId = req.params.id;
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  try {
    const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
    if (!response.ok) throw new Error(`RAWG API error: ${response.status}`);
    const g = await response.json();

    const details = {
      id: g.id,
      name: g.name,
      description: g.description_raw || "",
      released: g.released || null,
      rating: g.rating || null,
      metacritic: g.metacritic || null,
      website: g.website || null,
      image:
        g.background_image ||
        g.background_image_additional ||
        (g.background_image && g.background_image) ||
        null,
      genres: Array.isArray(g.genres) ? g.genres.map((x) => x.name) : [],
      platforms: Array.isArray(g.platforms)
        ? g.platforms.map((p) => p.platform?.name).filter(Boolean)
        : [],
    };

    res.json(details);
  } catch (error) {
    console.error("RAWG by-id error:", error);
    res.status(500).json({ error: "Failed to fetch game data" });
  }
});

// Comments
app.get("/api/game/:id/comments", (req, res) => {
  const { id } = req.params;
  res.json({ comments: commentsByGame[id] || [] });
});

app.post("/api/game/:id/comments", (req, res) => {
  const { id } = req.params;
  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Comment text is required" });

  if (!commentsByGame[id]) commentsByGame[id] = [];
  const entry = { text, at: new Date().toISOString() };
  commentsByGame[id].push(entry);
  res.status(201).json({ ok: true, comment: entry });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
