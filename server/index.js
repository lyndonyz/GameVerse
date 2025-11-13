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

// --- Text Search ---
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

// --- Categories (RAWG genres) ---
app.get("/api/categories", async (_req, res) => {
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  try {
    const r = await fetch(`https://api.rawg.io/api/genres?key=${apiKey}`);
    if (!r.ok) throw new Error(`RAWG genres error: ${r.status}`);
    const json = await r.json();

    const categories = (json.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug, // use this slug when filtering (&genres=slug)
      games_count: g.games_count ?? null,
    }));

    res.json({ categories });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

// --- Search by Category (genre) ---
app.get("/api/searchByCategory", async (req, res) => {
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  const genre = (req.query.genre || "").trim(); // RAWG expects slug(s)
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.page_size || 24);
  if (!genre) return res.status(400).json({ error: "Missing ?genre=<slug>" });

  try {
    const url =
      `https://api.rawg.io/api/games?key=${apiKey}` +
      `&genres=${encodeURIComponent(genre)}&page=${page}&page_size=${pageSize}&ordering=-added`;

    const r = await fetch(url);
    if (!r.ok) throw new Error(`RAWG category search error: ${r.status}`);
    const json = await r.json();

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
      genre,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to search by category" });
  }
});

// --- Game details ---
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



    // Detect VR support based on tags, platforms, or name
    // Detect VR support based on tags, platforms, or name
    const vrKeywords = [
      // General
      "vr", "virtual reality", "mixed reality", "extended reality", "xr", "ar vr", "mr", "headset",
    
      // Meta / Oculus ecosystem
      "oculus", "oculus rift", "oculus rift s", "oculus quest", "oculus quest 2",
      "meta quest", "meta quest 2", "meta quest 3", "meta quest pro",
    
      // HTC / Vive ecosystem
      "vive", "htc vive", "vive pro", "vive pro 2", "vive cosmos", "vive elite",
      "vive focus", "vive focus 3", "vive xr elite",
    
      // Valve
      "valve index", "index headset", "index controllers",
    
      // Sony / PlayStation VR
      "playstation vr", "psvr", "psvr2", "playstation vr2",
    
      // Microsoft / Windows Mixed Reality
      "windows mixed reality", "wmr", "hp reverb", "reverb g2", "samsung odyssey", "lenovo explorer",
      "acer mixed reality", "dell visor", "asus mixed reality",
    
      // PICO / ByteDance
      "pico", "pico neo", "pico neo 3", "pico 4", "pico neo link", "pico neo 4 pro",
    
      // Varjo (enterprise-grade)
      "varjo", "varjo aero", "varjo xr-3", "varjo vr-3",
    
      // Apple
      "apple vision pro", "vision pro",
    
      // HP / Lenovo / Others
      "hp reverb g1", "hp reverb g2", "lenovo mirage", "lenovo explorer",
    
      // Other brands & dev kits
      "starvr", "osvr", "deepoon", "piimax", "pimax", "pimax 4k", "pimax 5k", "pimax 8k",
      "pimax crystal", "pimax reality", "gear vr", "daydream", "google daydream", "cardboard",
      "samsung gear vr", "gearvr", "merge vr", "homido", "zeiss vr one", "noon vr", "archos vr",
      "riftcat", "virtual desktop",
    
      // Generic platform/tech identifiers
      "openxr", "steamvr", "meta platform", "mixed reality headset", "vr support"
    ];
    
    const vr_supported =
      g.tags?.some(t => vrKeywords.some(k => t.name?.toLowerCase().includes(k))) ||
      g.platforms?.some(p => vrKeywords.some(k => p.platform?.name?.toLowerCase().includes(k))) ||
      vrKeywords.some(k => g.name?.toLowerCase().includes(k)) ||
      false;
      
    // Attach to the response object
    details.vr_supported = vr_supported ? "Yes" : "No";
      

    res.json(details);
  } catch (error) {
    console.error("RAWG by-id error:", error);
    res.status(500).json({ error: "Failed to fetch game data" });
  }
});

// --- Comments (in-memory demo) ---
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
