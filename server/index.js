const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

app.get("/api/external-data", async (req, res) => {
  try {
    const apiKey = process.env.EXTERNAL_API_KEY;
    const apiUrl = "https://api.rawg.io/api/";

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Error fetching external API:", error.message);
    res.status(500).json({ error: "Failed to fetch external data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
