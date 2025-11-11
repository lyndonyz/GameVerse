import { useState } from 'react'
import gameverselogo from './assets/logo.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Error fetching data"));
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
        </a>
        <a href="https://www.youtube.com/watch?v=DQbiS0L5ilQ" target="_blank">
          <img src={gameverselogo} className="logo react" alt="GameVerse logo" />
        </a>
      </div>
      <h1>GameVerse</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        FYI we use Vite + React + TailwindCSS.
      </p>
    </>
  )
}

export default App
