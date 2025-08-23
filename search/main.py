from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from typing import Literal
import os
from database import VectorDatabase

# Load environment variables from a .env file
load_dotenv()

# --- Database Initialization ---
# Ensure the Pinecone API key is available
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable not set!")

# Initialize the VectorDatabase
# This will connect to Pinecone and create the index if it doesn't exist.
db = VectorDatabase(
    pinecone_api_key=PINECONE_API_KEY,
    index_name="anu" # Using a more descriptive index name
)

# --- FastAPI Application Setup ---
app = FastAPI(
    title="Vector Search API",
    description="An API for inserting and retrieving vectors from Pinecone.",
    version="1.0.0"
)

# Add CORS middleware to allow cross-origin requests
# This is useful for web-based frontends.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- API Endpoints ---

@app.get("/", summary="Root Endpoint", description="A simple health check endpoint.")
async def read_root():
    return {"message": "Welcome to the Vector Search API!"}

@app.post("/insert", summary="Insert a Vector")
async def insert_vector(
    id: str,
    summary: str,
    title: str,
    namespace: Literal["paper", "dataset", "algo"]
):
    try:
        db.insert(id=id, summary=summary, title=title, namespace=namespace)
        return {"status": "success", "message": f"Vector with id '{id}' inserted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrieve", summary="Retrieve Similar Vectors")
async def retrieve_vector(
    top_k: int,
    query: str,
    namespace: Literal["paper", "dataset", "algo"]
):
    try:
        results = db.retrieve(k=top_k, query=query, namespace=namespace)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add this endpoint to your main.py

@app.post("/clear-all", summary="Clear All Vectors from the Index")
async def clear_all_vectors():
    """
    Deletes all vectors from the index, effectively clearing it.
    This is a destructive operation.
    """
    try:
        # First, you need to add the clear_all method to your VectorDatabase class
        db.clear_all() 
        return {"status": "success", "message": "All vectors have been cleared from the index."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))