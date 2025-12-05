const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

const authRoutes = require("./routes/auth");
const { retryFetch } = require("./retryFetch");



const {
  addComment,
  getCommentsByGameID,
  getCommentById,
  getAvgRatingForGameID,
  deleteComment
} = require("./db/commentDB");

const registry = require("./db/serviceRegistry");

(async () => {
    await registry.initializeAllServices();
})();

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: [
    'http://localhost',
    'http://localhost:5173',
    'http://localhost:4173',
    'https://gameverse-web.23jpmxbt7759.ca-tor.codeengine.appdomain.cloud'
  ],
  credentials: true
}));
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
    page_size = 10,
  } = req.query;

  const requestedPageSize = Number(page_size);
  const requestedPage = Number(page);

  let baseUrl = `https://api.rawg.io/api/games?key=${apiKey}`;
  if (q) baseUrl += `&search=${encodeURIComponent(q)}`;
  if (genre) baseUrl += `&genres=${genre}`;
  if (platform) baseUrl += `&platforms=${platform}`;
  if (minRating) baseUrl += `&metacritic=${minRating},100`;
  if (releasedFrom || releasedTo)
    baseUrl += `&dates=${releasedFrom || "1900-01-01"},${releasedTo || "2050-01-01"}`;
  baseUrl += `&ordering=-added`;

  const hasClientSideFilters = vr === "yes" || vr === "no";

  try {
    let filteredResults = [];
    let apiPage = 1;
    let hasMorePages = true;
    const maxApiPages = 10;
    const targetSkip = (requestedPage - 1) * requestedPageSize;
    let totalFiltered = 0;
    let skippedCount = 0;

    while (filteredResults.length < requestedPageSize && hasMorePages && apiPage <= maxApiPages) {
      const url = `${baseUrl}&page=${apiPage}&page_size=40`;
      const json = await retryFetch(url);

      if (!json.results || json.results.length === 0) {
        hasMorePages = false;
        break;
      }

      let pageResults = json.results.map((g) => ({
        id: g.id,
        name: g.name,
        image: g.background_image,
        rating: g.rating,
        released: g.released,
        raw: g,
      }));

      if (hasClientSideFilters) {
        const checkVRSupport = (gameData) => {
          const name = gameData.name?.toLowerCase() || "";
          const tags = gameData.tags?.map((t) => t.name?.toLowerCase() || "") || [];
          const tagSlugs = gameData.tags?.map((t) => t.slug?.toLowerCase() || "") || [];
          const platforms = gameData.platforms?.map((p) => p.platform?.name?.toLowerCase() || "") || [];
          const platformSlugs = gameData.platforms?.map((p) => p.platform?.slug?.toLowerCase() || "") || [];
          const stores = gameData.stores?.map((s) => s.store?.name?.toLowerCase() || "") || [];
          
          const vrKeywords = [
            "vr", 
            "virtual reality", 
            "oculus", 
            "vive", 
            "valve index",
            "playstation vr",
            "psvr",
            "meta quest",
            "quest 2",
            "quest 3",
            "htc vive",
            "mixed reality",
            "windows mixed reality",
            "steamvr"
          ];
          
          const vrTagSlugs = [
            "vr",
            "virtual-reality",
            "htc-vive",
            "oculus-rift",
            "valve-index",
            "windows-mixed-reality",
            "playstation-vr",
            "oculus-quest"
          ];
          
          const vrPlatformSlugs = [
            "oculus-quest",
            "oculus-quest-2", 
            "meta-quest-2",
            "playstation-vr",
            "playstation-vr2",
            "ps-vr",
            "psvr",
            "htc-vive",
            "valve-index",
            "oculus-rift"
          ];
          
          if (vrKeywords.some(k => name.includes(k))) {
            return true;
          }
          
          if (tagSlugs.some(slug => vrTagSlugs.includes(slug))) {
            return true;
          }
          
          if (tags.some(t => 
            vrKeywords.some(k => t.includes(k)) || 
            t === "vr" || 
            t.startsWith("vr ") ||
            t.startsWith("vr-") ||
            t.endsWith(" vr") ||
            t.endsWith("-vr")
          )) {
            return true;
          }
          
          if (platformSlugs.some(slug => vrPlatformSlugs.includes(slug))) {
            return true;
          }

          if (platforms.some(p => 
            vrKeywords.some(k => p.includes(k)) ||
            p.includes("quest") ||
            p.includes("rift") ||
            p.includes("vive") ||
            p.includes("psvr")
          )) {
            return true;
          }
          
          if (stores.some(s => 
            s.includes("oculus") ||
            s.includes("vive") ||
            s.includes("playstation vr")
          )) {
            return true;
          }
          
          return false;
        };
        
        if (vr === "yes") {
          pageResults = pageResults.filter((r) => checkVRSupport(r.raw));
        } else if (vr === "no") {
          pageResults = pageResults.filter((r) => !checkVRSupport(r.raw));
        }
      }

      for (const result of pageResults) {
        if (skippedCount < targetSkip) {
          skippedCount++;
          continue;
        }
        
        if (filteredResults.length < requestedPageSize) {
          filteredResults.push(result);
        } else {
          break;
        }
      }

      hasMorePages = Boolean(json.next);
      apiPage++;

      // If we have enough results, stop fetching
      if (filteredResults.length >= requestedPageSize) {
        break;
      }
    }

    const finalResults = filteredResults.map(({ raw, ...rest }) => rest);
    const hasNext = filteredResults.length === requestedPageSize && hasMorePages;
    const hasPrev = requestedPage > 1;

    res.json({
      results: finalResults,
      hasNext,
      hasPrev,
      page: requestedPage,
      pageSize: requestedPageSize,
    });
  } catch (e) {
    console.error("Advanced search error:", e);
    res.status(500).json({ error: "Advanced search failed" });
  }
});

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

    const vrKeywords = [
      "vr", 
      "virtual reality", 
      "oculus", 
      "vive", 
      "valve index",
      "playstation vr",
      "psvr",
      "meta quest",
      "quest 2",
      "quest 3",
      "htc vive",
      "mixed reality",
      "windows mixed reality",
      "rift",
      "steamvr"
    ];
    
    const vrTagSlugs = [
      "vr",
      "virtual-reality",
      "htc-vive",
      "oculus-rift",
      "valve-index",
      "windows-mixed-reality",
      "playstation-vr",
      "oculus-quest"
    ];
    
    const vrPlatformSlugs = [
      "oculus-quest",
      "oculus-quest-2", 
      "meta-quest-2",
      "playstation-vr",
      "playstation-vr2",
      "ps-vr",
      "psvr",
      "htc-vive",
      "valve-index",
      "oculus-rift"
    ];
    
    const name = g.name?.toLowerCase() || "";
    const desc = g.description_raw?.toLowerCase() || "";
    const tags = g.tags?.map((t) => t.name?.toLowerCase() || "") || [];
    const tagSlugs = g.tags?.map((t) => t.slug?.toLowerCase() || "") || [];
    const platforms = g.platforms?.map((p) => p.platform?.name?.toLowerCase() || "") || [];
    const platformSlugs = g.platforms?.map((p) => p.platform?.slug?.toLowerCase() || "") || [];
    const stores = g.stores?.map((s) => s.store?.name?.toLowerCase() || "") || [];
    
    const vr_supported =
      vrKeywords.some((k) => name.includes(k)) ||
      tagSlugs.some(slug => vrTagSlugs.includes(slug)) ||
      tags.some((t) => 
        vrKeywords.some((k) => t.includes(k)) || 
        t === "vr" || 
        t.startsWith("vr ") ||
        t.startsWith("vr-") ||
        t.endsWith(" vr") ||
        t.endsWith("-vr")
      ) ||
      platformSlugs.some(slug => vrPlatformSlugs.includes(slug)) ||
      platforms.some((p) => 
        vrKeywords.some((k) => p.includes(k)) ||
        p.includes("quest") ||
        p.includes("rift") ||
        p.includes("vive") ||
        p.includes("psvr")
      ) ||
      stores.some(s => 
        s.includes("oculus") ||
        s.includes("vive") ||
        s.includes("playstation vr")
      ) ||
      vrKeywords.some((k) => desc.includes(k));

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
    const commentIds = await getCommentsByGameID(id);
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

const { getStatus, updateServiceStatus } = require("./db/serviceRegistryDB");

app.get("/api/admin/services", async (req, res) => {
  try {
    const services = {};
    for (const key in registry.MICROSERVICES) {
      const serviceName = registry.MICROSERVICES[key];
      const status = await getStatus(serviceName);
      services[serviceName] = Number(status);
    }
    res.json({ services });
  } catch (err) {
    console.error("Failed to fetch services:", err);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

app.post("/api/admin/services/:serviceName/toggle", async (req, res) => {
  const { serviceName } = req.params;
  const { status } = req.body;

  if (status !== 0 && status !== 1) {
    return res.status(400).json({ error: "Status must be 0 or 1" });
  }

  try {
    const serviceExists = Object.values(registry.MICROSERVICES).includes(serviceName);
    if (!serviceExists) {
      return res.status(404).json({ error: "Service not found" });
    }

    const result = await updateServiceStatus(serviceName, status);
    if (!result) {
      return res.status(500).json({ error: "Failed to update service" });
    }

    res.json({ ok: true, serviceName, status });
  } catch (err) {
    console.error("Failed to toggle service:", err);
    res.status(500).json({ error: "Failed to toggle service" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
