import { useState } from "react"; // this imports useState from the React library
import "./index.css"; // this imports the CSS stylesheet

function App() {
  // this declares the App function
  const [url, setUrl] = useState(""); // this creates a state variable 'url' and initialises it as an empty string, and the function 'setUrl' which sets it
  const [selectedFile, setSelectedFile] = useState(null); // this creates a state variable 'selectedFile' and initalises it to null, and the function 'setSelectedFile' which sets it
  const [ingested, setIngested] = useState(false); // this creates a state variable 'ingested' and initialises it to false, and the function 'setIngested' which sets it
  const [result, setResult] = useState([]); // this creates a state variable 'result' and initialises it to an empty array, and the function 'setResult' which sets it
  const [columns, setColumns] = useState([]); // this creates a state variable 'columns' and initialises it to an empty array, and the function 'setColumns' which sets it
  const [loading, setLoading] = useState(false); // this creates a state variable 'loading' and initialises it to false, and the function 'setLoading' which sets it
  const [error, setError] = useState(""); // this creates a state variable 'error' and initialises it to an empty string, and the function 'setError' which sets it

  async function handleIngest() {
    // this declares an async function called 'handleIngest', its async so it can wait for network calls
    setError(""); // this clears any previous error messages
    setResult([]); // this clears any previously loaded rows
    setColumns([]); // this clears any previously loaded columns
    setIngested(false); // this resets it so previous results dont remain

    if (!url.trim() && !selectedFile) {
      // this checks if the trimmed url string is empty or if the selectedFile is empty, if both are true then the block runs
      setError("Please enter a URL or choose a CSV file."); // this sets the error and tells the user what they are missing
      return; // this exits handleIngest, nothing after it runs
    }

    try {
      // this opens a try block so any error that gets thrown is caught further down instead of crashing
      setLoading(true); // this sets loading to true, which disables the button and changes its label

      let response; // this declares a response with no initial value, so it can get assigned later

      if (selectedFile) {
        // this checks whether or not a file was chosen, and if it was, it enters the file upload branch
        const formData = new FormData(); // this creates a new FormData object, its the browser api used to build a multipart file request

        formData.append("file", selectedFile); // this adds the selected file to the form data under the name 'file', which is the name the backend endpoint reads

        response = await fetch(
          "http://127.0.0.1:8000/ingest/file", // this calls fetch on the file ingestion endpoint, it starts the options object argument, and assigns the eventual result to response, awaiting until the network call resolves
          {
            method: "POST", // this sets the HTTP method to POST
            body: formData, // this sets the request body to the formData object built above
          },
        );
      } else {
        // this closes the file upload branch and opens the alternative for when no file was supplied

        const normalisedUrl = url.startsWith("http") ? url : `https://${url}`; // this checks if url already starts with 'http', if so it uses it as is, otherwise it adds 'https://' to the start, so the user can just type 'example.com'

        response = await fetch(
          "http://127.0.0.1:8000/ingest/url", // this calls fetch on the url ingestion endpoint, it starts the options object argument, and assigns the eventual result to response, awaiting until the network call resolves
          {
            method: "POST", // this sets the HTTP method to POST
            headers: { "Content-Type": "application/json" }, // this tells the backend to expect a JSON body
            body: JSON.stringify({ url: normalisedUrl }), // this calls JSON.stringify to turn a JS object into a JSON string, the object it stringifies has a single key 'url' set to 'normalisedUrl'
          },
        );
      }

      if (!response.ok) {
        // this checks if the HTTP response status is ok, fetch doesnt throw on 400 or 500 codes on its own so this is used to catch them
        throw new Error("Backend request failed."); // this manually throws an error so the catch block below handles HTTP level failures the same way it handles network ones
      }

      const data = await response.json(); // this parses the response body as JSON and stores the resulting object in 'data'

      setResult(data.sample); // this updates the result state with the sample field from the JSON response
      setColumns(data.columns); // this updates the columns state with the columns field from the JSON response
      setIngested(true); // this marks ingestion as successful, which makes the results section render
    } catch (err) {
      // this closes the try block and opens the catch block, which only runs if there is an error thrown inside the try block
      console.error(err); // this logs the error object in the browser console for debugging
      setError("Something went wrong during ingestion."); // this gives a basic response to the user on the frontend
    } finally {
      // this closes the catch block and opens a finally block, which runs whether the try succeeded or failed
      setLoading(false); // this turns off the loading state, which re-enables the button and resets its label
    }
  }

  function escapeCsvValue(value) {
    // this is a helper that turns one cell value into a CSV safe string
    if (value === null || value === undefined) return ""; // this means missing values become an empty cell, not the text null/undefined
    const str = Array.isArray(value) ? JSON.stringify(value) : String(value); // this means arrays get JSON encoded first, everything else just gets stringified
    return '"' + str.replaceAll('"', '""') + '"'; // this wraps it in quotes and doubles up internal quotes, per CSV escaping rules
  }

  function handleDownloadDataset() {
    // this handles the "Download Dataset" button
    if (result.length === 0) {
      // theres nothing to export if there are no rows
      return; // this exits early, theres nothing to download
    }

    const headerRow = columns // this writes the CSV header line from the column names
      .map(escapeCsvValue) // this escapes each column name
      .join(","); // this joins them with commas into one line

    const dataRows = result.map(
      (
        row, // this writess one CSV line per row
      ) =>
        columns // for this row, it walks the columns again to keep the same order as the header
          .map((column) => escapeCsvValue(row[column])) // this looks up and escapes each cell, in the same order as the header
          .join(","), // this joins the cells with commas into one row line
    );

    const csvContent = [headerRow, ...dataRows].join("\n"); // this stitches the header and all rows together, separated by newlines
    const csvParts = [csvContent]; // Blob wants a list of pieces to combine, even if theres only one piece
    const csvOptions = { type: "text/csv;charset=utf-8" }; // this tells the browser the data is a CSV file
    const blob = new Blob(csvParts, csvOptions); // this wraps the CSV text as a downloadable file
    const link = document.createElement("a"); // this is an in-memory link element, its never attached to the page, its only used to trigger the download
    link.href = URL.createObjectURL(blob); // this points the link at a temporary URL for the blob's contents
    link.download = "project-ingress-result.csv"; // this sets the filename the browser will suggest when saving
    link.click(); // this automatically clicks the link to trigger the download
  }

  function handleDownloadDataBook() {
    // this handles the "Download DataBook" (Markdown) button
    if (result.length === 0) {
      // theres nothing to describe if there are no rows
      return; // this exits early, theres nothing to export
    }

    const createdAt = new Date().toLocaleString(); // this is a timestamp for when the export was made

    const source = selectedFile ? selectedFile.name : url; // this is the filename if a file was used, otherwise its the URL that was entered
    const detectedType = selectedFile ? "csv" : "webpage"; // this labels the ingestion type based on which input path was used

    const columnList = columns // this starts building a Markdown bulletpoint list from the column names
      .map((column) => '- ${column}') // this turns each column name into a Markdown list item
      .join("\n"); // this joins the items with newlines into one multi line string

    const databookContent = `# Project Ingress DataBook

## Source

${source}

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
`;
    const markdownParts = [databookContent]; // Blob wants a list of pieces to combine, even if theres only one piece
    const markdownOptions = { type: "text/markdown" }; // this tells the browser the data is a Markdown file
    const blob = new Blob(markdownParts, markdownOptions); // this wraps the Markdown text as a downloadable file
    const link = document.createElement("a"); // this is an in-memory link element, only used to trigger the download
    link.href = URL.createObjectURL(blob); // this points the link at a temporary URL for the blob's contents
    link.download = "project-ingress-databook.md"; // this sets the filename the browser will suggest when saving
    link.click(); // this triggers the download
  }

  function handleDownloadDataBookJson() {
    // this handles the "Download DataBook (JSON)" button
    if (result.length === 0) return; // theres nothing to export if there are no rows

    const databook = {
      // this is the same metadata as the Markdown version, but as a plain object for JSON
      source: selectedFile ? selectedFile.name : url, // this is the filename if a file was used, otherwise its the URL entered
      detected_type: selectedFile ? "csv" : "webpage", // this uses snake_case to match JSON/backend conventions
      created_at: new Date().toLocaleString(), // this is the timestamp for the export
      columns: columns, // these are the column names
      row_count: result.length, // this is the number of rows
      sample: result, // this is the actual row data
    };

    const jsonText = JSON.stringify(databook); // this converts the databook object into a JSON string
    const jsonParts = [jsonText]; // Blob wants a list of pieces to combine, even if theres only one piece
    const jsonOptions = { type: "application/json" }; // this tells the browser the data is a JSON file
    const blob = new Blob(jsonParts, jsonOptions); // this wraps the JSON text as a downloadable file
    const link = document.createElement("a"); // this is an in-memory link element, only used to trigger the download
    link.href = URL.createObjectURL(blob); // this points the link at a temporary URL for the blob's contents
    link.download = "project-ingress-databook.json"; // this sets the filename the browser will suggest when saving
    link.click(); // this triggers the download
  }

  return (
    // this returns the JSX below, which React renders to the page

    <div className="App">
      {" "}
      {/* this is the top-level wrapper for the whole page */}
      <header className="app-header">
        {" "}
        {/* this is the page header/banner */}
        <h1>Project Ingress</h1> {/* this is the app's title */}
      </header>
      <main className="ingestion-box">
        {" "}
        {/* this is the box containing the URL/file inputs and the ingest button */}
        <div className="url-input">
          {" "}
          {/* this wraps the URL text input */}
          <input
            type="text" // this renders a single line text box
            placeholder="Enter source for ingestion..." // this is greyed out hint text shown when the input is empty
            value={url} // this is a controlled input, its displayed value always mirrors the 'url' state
            onChange={(event) => setUrl(event.target.value)} // this updates the 'url' state on every keystroke
          />
        </div>
        <div className="file-input">
          {" "}
          {/* this wraps the file picker input */}
          <input
            type="file" // this renders a native file picker button
            accept=".csv, .json" // this restricts the picker to CSV and JSON files
            onChange={(e) => setSelectedFile(e.target.files[0])} // this stores the first chosen file in state
          />
        </div>
        <button
          className="ingest-button" // this is a styling hook for CSS
          onClick={handleIngest} // this runs the ingestion logic when its clicked
          disabled={loading} // this disables the button while a request is in flight
        >
          {loading ? "Ingesting..." : "Ingest"}{" "}
          {/* this swaps the label while its loading */}
        </button>
        {error && ( // this only renders the paragraph below if 'error' is a non empty string
          <p className="error-message">{error}</p> // this displays the error text
        )}
      </main>
      {ingested &&
        result && ( // this only renders the results section once ingestion has succeeded
          <section className="exports-box">
            {" "}
            {/* this is the container for the parsed-result table and download buttons */}
            <h2>Parsed Result</h2> {/* this is the heading for the section */}
            <div className="table-wrapper">
              {" "}
              {/* this lets the table scroll horizontally if its too wide for the screen */}
              <table className="preview-table">
                {" "}
                {/* this is the results table itself */}
                <thead>
                  {" "}
                  {/* this is the table header row, built from the column names */}
                  <tr>
                    {" "}
                    {/* this is the single header row */}
                    {columns.map(
                      (
                        column, // this renders one <th> per column name
                      ) => (
                        <th key={column}>
                          {" "}
                          {/* the key lets React track each column across re-renders */}
                          {column}{" "}
                          {/* this is the column's name, shown as header text */}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {" "}
                  {/* this is the table body, one row per record in 'result' */}
                  {result.map(
                    (
                      row,
                      rowIndex, // this renders one <tr> per data row
                    ) => (
                      <tr key={rowIndex}>
                        {" "}
                        {/* the key lets React track each row across re-renders */}
                        {columns.map((column) => {
                          // this renders one <td> per column, in the same order as the header
                          return (
                            // this returns the <td> element for the row/column pair
                            <td key={column}>
                              {" "}
                              {/* this is one cell for the row */}
                              {Array.isArray(row[column]) // this checks if the cell value is an array, and if it is it joins it into a readable comma separated string
                                ? row[column].join(", ") // so it turns e.g. ["a","b"] into "a, b"
                                : String(row[column] ?? "")}{" "}
                              {/* otherwise it shows it as a plain string, or blank if its null/undefined */}
                            </td>
                          );
                        })}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            <div className="export-buttons">
              {" "}
              {/* this wraps the three download buttons */}
              <button onClick={handleDownloadDataset}>
                {" "}
                {/* this triggers the CSV download */}
                Download Dataset
              </button>
              <button onClick={handleDownloadDataBook}>
                {" "}
                {/* this triggers the Markdown DataBook download */}
                Download DataBook
              </button>
              <button onClick={handleDownloadDataBookJson}>
                {" "}
                {/* this triggers the JSON DataBook download */}
                Download DataBook (JSON)
              </button>
            </div>
          </section>
        )}
    </div>
  );
}

export default App; // this makes App importable by other files, like main.jsx, which mounts it to the page
