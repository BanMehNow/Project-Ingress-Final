import { useState } from 'react'
import './index.css'

function App() {
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [ingested, setIngested] = useState(false)

  function handleFileChange(event) {
    const file = event.target.files[0]

    if (file) {
      setSelectedFile(file)
    }
  }

  function handleIngest() {
    console.log('URL:', url)
    console.log('File:', selectedFile)

    setIngested(true)
  }
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
        <div className='file-input'>
          <input
            type="file"
            accept='.pdf, .csv, .json'
            onChange={handleFileChange}
          />
        </div>
        <button className="ingest-button" onClick={handleIngest}>
          Ingest
        </button>
      </main>

      {ingested && (
        <section className="exports-box">
          <h2>Exports Ready</h2>
          <p>Your dataset and databook are ready to download.</p>

          <div className="export-buttons">
            <button>Download Dataset</button>
            <button>Download DataBook</button>
          </div>
        </section>
      )}

    </div>
  )
}

export default App
