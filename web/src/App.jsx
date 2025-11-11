import { useState } from 'react'
import gameverselogo from './assets/logo.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
        </a>
        <a href="https://react.dev" target="_blank">
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
