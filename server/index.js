const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

app.get("/api/game/:id", async (req, res) => {
  const gameId = req.params.id;
  const apiKey = process.env.EXTERNAL_API_KEY;

  try {
    const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }

    const gameData = await response.json();
    res.json({ name: gameData.name });

  } catch (error) {
    console.error("Error fetching RAWG API:", error.message);
    res.status(500).json({ error: "Failed to fetch game data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
