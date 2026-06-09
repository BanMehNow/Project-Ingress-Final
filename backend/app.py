from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Project Ingress backend is running"}