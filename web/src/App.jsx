import { useState, useEffect } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [gameId, setGameId] = useState("");
  const [gameName, setGameName] = useState("");

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setMessage(data.message));
  }, []);

  const fetchGame = async () => {
    if (!gameId) return alert("Please enter a game ID");

    try {
      const res = await fetch(`/api/game/${gameId}`);
      const data = await res.json();

      if (data.error) {
        setGameName("Error: " + data.error);
      } else {
        setGameName("name: " + data.name);
      }
    } catch (err) {
      setGameName("Error fetching game");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Frontend connected to backend</h1>

      <hr />

      <h2>RAWG.io games by ID</h2>
      <input
        type="text"
        placeholder="ID"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
        style={{ marginRight: "0.5rem" }}
      />
      <button onClick={fetchGame}>call</button>

      {gameName && <p>{gameName}</p>}
    </div>
  );
}

export default App;
