import { useState } from 'react'
import './index.css'

function App() {
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [ingested, setIngested] = useState(false)

  const [result, setResult] = useState([])
  const [columns, setColumns] = useState([])
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
    setResult([])
    setColumns([])
    setIngested(false)

    if (!url.trim() && !selectedFile) {
      setError('Please enter a URL or choose a CSV file.')
      return
    }

    try {
      setLoading(true)

      let response

      if (selectedFile) {
        const formData = new FormData()

        formData.append('file', selectedFile)

        response = await fetch('http://127.0.0.1:8000/ingest/file',
          {
            method: 'POST',
            body: formData,
          }
        )
      } else {
        const normalisedUrl =
          url.startsWith('http://') || url.startsWith('https://')
            ? url : `https://${url}`

        response = await fetch(
          'http://127.0.0.1:8000/ingest/url',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: normalisedUrl,
            }),
          }
        )
      }

      if (!response.ok) {
        throw new Error('Backend request failed.')
      }

      const data = await response.json()

      setResult(data.sample)
      setColumns(data.columns)
      setIngested(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong during ingestion.')
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

    const formattedValue = Array.isArray(value)
      ? JSON.stringify(value)
      : String(value)

    const escapedValue = formattedValue.replaceAll('"', '""')

    return `"${escapedValue}"`
  }

  function handleDownloadDataset() {
    if (result.length === 0) {
      return
    }

    const headerRow = columns
      .map(escapeCsvValue)
      .join(',')

    const dataRows = result.map((row) =>
      columns
        .map((column) => escapeCsvValue(row[column]))
        .join(',')
    )

    const csvContent = [headerRow, ...dataRows].join('\n')

    downloadFile(
      'project-ingress-result.csv',
      csvContent,
      'text/csv;charset=utf-8'
    )
  }

  function handleDownloadDataBook() {
    if (result.length === 0) {
      return
    }

    const createdAt = new Date().toLocaleString()

    const source = selectedFile ? selectedFile.name : url
    const detectedType = selectedFile ? 'csv' : 'webpage'

    const columnList = columns
      .map((column) => `- ${column}`)
      .join('\n')

    const databookContent = `# Project Ingress DataBook

## Source

${source}

## Page Title

${title}

## Created At

${createdAt}

## Detected Type

${detectedType}

## Row Count

${result.length}

## Columns

${columnList}

## Notes

This DataBook describes data processed using Project Ingress.
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
            accept='csv, .json'
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
                  {columns.map((column) => (
                    <th key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {result.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => {
                      const value = row[column]

                      return (
                        <td key={column}>
                          {Array.isArray(value)
                            ? value.join(', ')
                            : String(value ?? '')}
                        </td>
                      )
                    })}
                  </tr>
                ))}
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