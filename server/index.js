const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

const authRoutes = require("./routes/auth");

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

// --- In-memory comments store ---
const commentsByGame = Object.create(null);

// Health
app.get("/api", (_req, res) => res.json({ ok: true }));

// --- Discover ---
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

// --- Search ---
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

// --- Categories ---
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
      slug: g.slug,
      games_count: g.games_count ?? null,
    }));

    res.json({ categories });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

// --- Category Search ---
app.get("/api/searchByCategory", async (req, res) => {
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  const genre = (req.query.genre || "").trim();
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.page_size || 24);
  if (!genre) return res.status(400).json({ error: "Missing ?genre=<slug>" });

  try {
    const url =
      `https://api.rawg.io/api/games?key=${apiKey}` +
      `&genres=${encodeURIComponent(genre)}&page=${page}&page_size=${pageSize}&ordering=-added`;

    const r = await fetch(url);
    const json = await r.json();

    const results = (json.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      image: g.background_image,
      rating: g.rating,
      released: g.released,
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

// --- ADVANCED SEARCH (FR1 + FR3) ---
app.get("/api/advancedSearch", async (req, res) => {
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing EXTERNAL_API_KEY" });

  const {
    q = "",
    genre = "",
    platform = "",
    vr = "",
    minRating = "",
    releasedFrom = "",
    releasedTo = "",
    page = 1,
    page_size = 24,
  } = req.query;

  let url =
    `https://api.rawg.io/api/games?key=${apiKey}&page=${page}&page_size=${page_size}`;

  if (q) url += `&search=${encodeURIComponent(q)}`;
  if (genre) url += `&genres=${genre}`;
  if (platform) url += `&platforms=${platform}`;
  if (minRating) url += `&metacritic=${minRating},100`;
  if (releasedFrom || releasedTo)
    url += `&dates=${releasedFrom || "1900-01-01"},${releasedTo || "2050-01-01"}`;

  url += `&ordering=-added`;

  try {
    const r = await fetch(url);
    const json = await r.json();

    const results = (json.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      image: g.background_image,
      rating: g.rating,
      released: g.released,
      raw: g,
    }));

    const final =
      vr === "yes"
        ? results.filter((r) => {
            const name = r.raw.name.toLowerCase();
            const tags = r.raw.tags?.map((t) => t.name.toLowerCase()) || [];
            return (
              name.includes("vr") ||
              tags.some((t) => t.includes("vr") || t.includes("virtual"))
            );
          })
        : results;

    res.json({
      results: final,
      hasNext: Boolean(json.next),
      hasPrev: Boolean(json.previous),
      page: Number(page),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Advanced search failed" });
  }
});

// --- Game details & VR detection ---
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
      image: g.background_image || g.background_image_additional,
      genres: g.genres?.map((x) => x.name) || [],
      platforms: g.platforms?.map((p) => p.platform?.name) || [],
      developers: g.developers?.map((d) => d.name) || [],
      publishers: g.publishers?.map((p) => p.name) || [],
    };

    const vrKeywords = ["vr", "virtual reality", "vive", "oculus", "valve index"];
    const vr_supported =
      g.tags?.some((t) =>
        vrKeywords.some((k) => t.name?.toLowerCase().includes(k))
      ) ||
      g.platforms?.some((p) =>
        vrKeywords.some((k) =>
          p.platform?.name?.toLowerCase().includes(k)
        )
      ) ||
      vrKeywords.some((k) => g.name.toLowerCase().includes(k));

    details.vr_supported = vr_supported ? "Yes" : "No";

    res.json(details);
  } catch (error) {
    console.error("RAWG by-id error:", error);
    res.status(500).json({ error: "Failed to fetch game data" });
  }
});

// --- Comments ---
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
