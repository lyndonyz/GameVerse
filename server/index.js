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

// Health check
app.get("/api", (_req, res) => res.json({ ok: true }));

// Search by name -> returns id, name, image
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

// Fetch-by-ID (kept for completeness)
app.get("/api/game/:id", async (req, res) => {
  const gameId = req.params.id;
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  try {
    const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
    if (!response.ok) throw new Error(`RAWG API error: ${response.status}`);
    const gameData = await response.json();
    res.json({ name: gameData.name });
  } catch (error) {
    console.error("RAWG by-id error:", error);
    res.status(500).json({ error: "Failed to fetch game data" });
  }
});

// --- Comments API ---
// Get comments for a game
app.get("/api/game/:id/comments", (req, res) => {
  const { id } = req.params;
  res.json({ comments: commentsByGame[id] || [] });
});

// Add a comment for a game
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
