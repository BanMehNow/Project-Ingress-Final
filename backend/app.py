from fastapi import FastAPI
from pydantic import BaseModel
from scraper import scrape_url

app = FastAPI()


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
        "columns": ["url", "title", "content"],
        "sample": [scraped_data]
    }