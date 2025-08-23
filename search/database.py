from pinecone import Pinecone, ServerlessSpec
from typing import Literal
import json
import time
class VectorDatabase:
  """
  A class to interact with a Pinecone vector database, specifically designed
  for serverless indexes with automatic embedding generation.
  """
  def __init__(self, pinecone_api_key: str, index_name: str):
    """
    Initializes the Pinecone client and sets up the index.
    
    Args:
      pinecone_api_key: Your API key for Pinecone.
      index_name: The name of the index to use or create.
    """
    self.pc = Pinecone(api_key=pinecone_api_key)
    self.index_name = index_name
    self.index = self._setup()

  def _setup(self):
    if not self.pc.has_index(self.index_name):
      self.pc.create_index_for_model(
          name=self.index_name,
          cloud="aws",
          region="us-east-1",
          embed={
              "model":"llama-text-embed-v2",
              "field_map":{"text": "chunk_text"}
          }
      )
      print("Index is created sucessfully")
    else:
      print("Index was aldready present")
    idx = self.pc.Index(self.index_name)
    time.sleep(10)
    return idx

  def insert(self, id: str, summary: str, title: str, namespace: Literal["paper", "dataset", "algo"]):
    """
    Inserts a record into the index. The text is embedded automatically by Pinecone.
    
    Args:
      id: The unique identifier for the record.
      summary: The text content to be embedded and stored.
      title: The title of the document.
      namespace: The namespace to insert the record into.
    """
    records = [{
      "id": id,
      "chunk_text": summary,
      "title": title
    }]
    temp = self.index.describe_index_stats()
    self.index.upsert_records(namespace,records)
    print(f"Successfully inserted record with id: {id} into namespace: {namespace}")

  def retrieve(self , k:int , query: str, namespace: Literal["paper","dataset","algo"]):
    reranked_results = self.index.search(
      namespace=namespace,
      query={
        "top_k": k,
        "inputs": {"text": query}
      },
      rerank={
        "model": "bge-reranker-v2-m3",
        "top_n": k,
        "rank_fields": ["chunk_text"]
      }   
    )
    output = []
    for hit in reranked_results['result']['hits']:
      output.append({
        "id": hit["_id"],
        "score": round(hit['_score'], 2),
        "text": hit['fields']['chunk_text']
      })
    return json.dumps(output, indent=2)

  def clear_all(self):
    """
    Deletes the entire index from your Pinecone project.
    """
    print(f"Deleting index '{self.index_name}' entirely...")
    self.pc.delete_index(self.index_name)
    print("Index deleted successfully.")