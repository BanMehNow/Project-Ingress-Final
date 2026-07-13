from fastapi import FastAPI, File, UploadFile  # fastapi is the backend framework, File/UploadFile are for handling uploads
from pydantic import BaseModel  # this validates the shape of incoming json bodies
from scraper import scrape_url
from fastapi.middleware.cors import CORSMiddleware  # this lets the frontend (different port) actually call the api
from io import BytesIO  # this lets pandas read the uploaded bytes like a file
import pandas as pd
import json

app = FastAPI()

app.add_middleware(  # this sets up CORS so the browser doesnt block requests coming from the frontend
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UrlRequest(BaseModel):  # this is the shape of the body for /ingest/url
    url: str


@app.get("/")
def home():  # this is just a health check
    return {"message": "Project Ingress backend is running"}


@app.post("/ingest/url")
async def ingest_url(request: UrlRequest):
    scraped_data = await scrape_url(request.url)  # this does the actual scraping

    return {  # this is the same shape as the file ingestion route below so the frontend doesnt need to care which one ran
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

        "sample": [scraped_data]  # this wraps the single scraped result in a list since the frontend always expects an array of rows
    }

@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    contents = await file.read()  # these are the raw bytes

    if file.filename.endswith('.json'):  # this means its already a databook that was exported before, so it just gets passed straight through
        data = json.loads(contents)
        return {
            "source": file.filename,
            "detected_type": "databook",
            "columns": data["columns"],
            "sample": data["sample"]
        }

    dataframe = pd.read_csv(BytesIO(contents))  # otherwise it gets treated as a csv
    dataframe = dataframe.where(pd.notna(dataframe), None)  # this swaps NaN for None so it actually serialises to json properly

    return {
        "source": file.filename,
        "detected_type": "csv",
        "columns": dataframe.columns.tolist(),
        "sample": dataframe.to_dict(orient="records")
    }
