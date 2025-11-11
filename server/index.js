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

// --- Discover (popular) games for the home page ---
app.get("/api/discover", async (req, res) => {
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  const pageSize = Number(req.query.page_size || 24);
  const page = Number(req.query.page || 1);

  try {
    // Use ordering that tends to surface popular/widely-added titles
    const url =
      `https://api.rawg.io/api/games?key=${apiKey}` +
      `&ordering=-added&page=${page}&page_size=${pageSize}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`RAWG API error: ${response.status}`);

    const json = await response.json();
    const results = (json.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      image: g.background_image || g.background_image_additional || null,
      rating: g.rating ?? null,
      released: g.released ?? null,
    }));

    res.json({
      results,
      page,
      pageSize,
      hasNext: Boolean(json.next),
      hasPrev: Boolean(json.previous),
    });
  } catch (err) {
    console.error("RAWG discover error:", err);
    res.status(500).json({ error: "Failed to load discover games" });
  }
});

// Search (supports pagination) -> returns id, name, image, rating, released
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.page_size || 24);
  if (!q) return res.status(400).json({ error: "Missing query ?q=" });

  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  try {
    const url =
      `https://api.rawg.io/api/games?key=${apiKey}` +
      `&search=${encodeURIComponent(q)}&page_size=${pageSize}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`RAWG API error: ${response.status}`);

    const json = await response.json();
    const results = (json.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      image: g.background_image || g.background_image_additional || null,
      rating: g.rating || null,
      released: g.released || null,
    }));

    res.json({
      results,
      page,
      pageSize,
      hasNext: Boolean(json.next),
      hasPrev: Boolean(json.previous),
    });
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
      developers: Array.isArray(g.developers) ? g.developers.map((d) => d.name) : [],
      publishers: Array.isArray(g.publishers) ? g.publishers.map((p) => p.name) : [],
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
