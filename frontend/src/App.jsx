import { useState } from 'react'
import './index.css'

function App() {
  const [url, setUrl] = useState('')
  return (

    <div className='App'>
      <header className='app-header'>
        <h1>Project Ingress</h1>
      </header>
      <main className="ingestion-box">
        <div className="url-input">
          <input
            type="text" 
            placeholder="Enter source for ingestion..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
      </main>
    </div>
  )
}

export default App
