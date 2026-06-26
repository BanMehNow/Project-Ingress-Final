from fastapi import FastAPI
from pydantic import BaseModel
from scraper import scrape_url
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO

import pandas as pd
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

from scraper import scrape_url

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UrlRequest(BaseModel):
    url: str


@app.get("/")
def home():
    return {"message": "Project Ingress backend is running"}


@app.post("/ingest/url")
async def ingest_url(request: UrlRequest):
    scraped_data = await scrape_url(request.url)

    return {
        "source": request.url,
        "detected_type": "webpage",
        "columns": [
    "url",
    "title",
    "description",
    "body_text",
    "headings",
    "links",
    "word_count",
    "status_code"
],
        "sample": [scraped_data]
    }

@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    contents = await file.read()

    dataframe = pd.read_csv(BytesIO(contents))

    dataframe = dataframe.astype(object).where(
        pd.notna(dataframe),
        None
    )

    return {
        "source": file.filename,
        "detected_type": "csv",
        "columns": dataframe.columns.tolist(),
        "sample": dataframe.to_dict(orient="records")
    }