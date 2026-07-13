Project Ingress

Project Ingress is a data ingestion tool. Point it at a webpage URL or upload a CSV/JSON file, and it parses the data into a consistent tabular format you can preview in the browser and export as a CSV dataset or a "DataBook" (Markdown or JSON summary).

How it works

- URL ingestion — the backend uses Playwright to load the page in a headless browser and extract its title, meta description, body text, headings, links, word count, and HTTP status code.
- File ingestion — upload a .csv file to have it parsed into rows/columns with pandas, or upload a previously exported .json DataBook to load it straight back in.
- Preview — ingested data is rendered as a table in the frontend.
- Export — download the result as a .csv dataset, or as a DataBook in Markdown (.md) or JSON (.json) format, describing the source, detected type, row count, and columns.

Tech stack

Backend: Python, FastAPI, Playwright (Chromium), pandas
Frontend: React 19, Vite

Project structure

backend/
app.py       - FastAPI app and API routes
scraper.py   - Playwright-based URL scraping
frontend/
src/App.jsx  - main UI: ingestion form, results table, export buttons

Getting started

Backend

cd backend
python -m venv venv
venv\Scripts\activate     - on Windows

pip install fastapi uvicorn pandas playwright python-multipart
playwright install chromium

uvicorn app:app --reload
The API will be available at http://127.0.0.1:8000.

Frontend

cd frontend
npm install
npm run dev
The app will be available at http://localhost:5173.

Usage
Start both the backend and frontend (see above).
Open the frontend in your browser.
Either enter a URL to scrape, or choose a .csv/.json file to upload.
Click Ingest to parse the source and preview the results in a table.
Use the export buttons to download the result as a CSV dataset or a Markdown/JSON DataBook.
