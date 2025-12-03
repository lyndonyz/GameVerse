const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

const authRoutes = require("./routes/auth");
const { retryFetch } = require("./retryFetch");



const {
  addComment,
  getCommentsByGameID,
  getCommentById,
  getAvgRatingForGameID,
  deleteComment
} = require("./db/commentDB");


app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);


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

    const json = await retryFetch(url);

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

    const json = await retryFetch(url);
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
    const json = await retryFetch(`https://api.rawg.io/api/genres?key=${apiKey}`);


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

    const json = await retryFetch(url);

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
    const json = await retryFetch(url);

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
    const g = await retryFetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);

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

// --- Comments Updated ---
app.get("/api/game/:id/comments", async (req, res) => {
  const { id } = req.params;
    const commentIds = await getCommentsByGameID(id); // gets list of comment IDs
    // get the comments
    const comments = await Promise.all(commentIds.map(getCommentById));
    
    const mappedComments = comments
      .filter(c => c !== null)
      .map(c => ({
        id: c._id,
        text: c.comment,
        username: c.username,
        at: c.createdAt,
        rating: c.rating,
      }));

    res.json({ comments: mappedComments });
});

app.post("/api/game/:id/comments", async (req, res) => {
  const { id } = req.params;
  const text = (req.body?.text || "").trim();
  const rating = req.body.rating;
  // TODO: replace "Temp" with actual logged-in username from auth
  const username = req.body.user; 

  if (!text || !username) {
    return res.status(400).json({ error: "Username and comment text are required" });
  }
  if (!rating) {
    return res.status(400).json({ error: "Rating is required" });
  }

  try {
    const newCommentDoc = await addComment(id, username, text, rating);

    if (!newCommentDoc) throw new Error("Failed to add comment");

    // Map fields for frontend
    const comment = {
      id: newCommentDoc._id,
      text: newCommentDoc.comment,
      username: newCommentDoc.username,
      at: newCommentDoc.createdAt,
      rating: newCommentDoc.rating
    };

    res.status(201).json({ ok: true, comment });
  } catch (err) {
    console.error("Failed to add comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
