import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState(' ')
  return (
    
    <div className='App'>
      <header className='app-header'>
        <h1>Project Ingress</h1>
      </header>

      <div className='url-input'>
        <input
          type="text"
          value={url}
          onChange={(input) => setInputValue(input.target.value)}
          placeholder='Enter source for ingestion...'
        />
      </div>

    </div>
  )
}

export default App
