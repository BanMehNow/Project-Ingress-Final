import { useState } from 'react'
import './index.css'

function App() {
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [ingested, setIngested] = useState(false)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(event) {
    const file = event.target.files[0]

    if (file) {
      setSelectedFile(file)
    }
  }

  async function handleIngest() {
    setError('')
    setResult(null)
    setIngested(false)

    if (!url.trim()) {
      setError('Please enter a URL first.')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('http://127.0.0.1:8000/ingest/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
        }),
      })

      if (!response.ok) {
        throw new Error('Backend request failed.')
      }

      const data = await response.json()

      setResult(data.sample[0])
      setIngested(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong while ingesting the URL.')
    } finally {
      setLoading(false)
    }
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const fileUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = filename
    link.click()

    URL.revokeObjectURL(fileUrl)
  }

  function escapeCsvValue(value) {
    if (value === null || value === undefined) {
      return ''
    }

    const stringValue = String(value)
    const escapedValue = stringValue.replaceAll('"', '""')

    return `"${escapedValue}"`
  }

  function handleDownloadDataset() {
    if (!result) {
      return
    }

    const columns = ['url', 'title', 'content']

    const headerRow = columns
      .map(escapeCsvValue)
      .join(',')

    const dataRow = columns
      .map((column) => escapeCsvValue(result[column]))
      .join(',')

    const csvContent = [headerRow, dataRow].join('\n')

    downloadFile('project-ingress-result.csv', csvContent, 'text/csv')
  }

  function handleDownloadDataBook() {
    if (!result) {
      return
    }

    const createdAt = new Date().toLocaleString()

    const databookContent = `# Project Ingress DataBook

## Source

${result.url}

## Page Title

${result.title}

## Created At

${createdAt}

## Detected Type

webpage

## Columns

- url
- title
- content

## Notes

This DataBook describes a single URL ingestion result.

The content was parsed from the provided webpage using the Project Ingress backend.
`

    downloadFile('project-ingress-databook.md', databookContent, 'text/markdown')
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
        <button
          className="ingest-button"
          onClick={handleIngest}
          disabled={loading}
        >
          {loading ? 'Ingesting...' : 'Ingest'}
        </button>
        {error && (
          <p className="error-message">{error}</p>
        )}
      </main>

      {ingested && result && (
        <section className="exports-box">
          <h2>Parsed Result</h2>

          <div className="table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Title</th>
                  <th>Content</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{result.url}</td>
                  <td>{result.title}</td>
                  <td>{result.content}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="export-buttons">
            <button onClick={handleDownloadDataset}>
              Download Dataset
            </button>

            <button onClick={handleDownloadDataBook}>
              Download DataBook
            </button>
          </div>
        </section>
      )}

    </div>
  )
}

export default App
