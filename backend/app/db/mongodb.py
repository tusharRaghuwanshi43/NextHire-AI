import logging
import asyncio
import os
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from app.core.config import settings

logger = logging.getLogger("nexthire.db")

COLLECTIONS = [
    "users",
    "resumes",
    "skills",
    "resume_projects",
    "resume_claims",
    "interviews",
    "questions",
    "answers",
    "evaluations",
    "claim_verifications",
    "skill_gap_analyses",
    "reports",
    "settings"
]

class InMemoryAsyncCursor:
    """Async cursor for in-memory simulated fallback when MongoDB server is not running."""
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = items
        self._index = 0

    def sort(self, key_or_list, direction=None):
        reverse = False
        sort_key = None
        if isinstance(key_or_list, list):
            if key_or_list:
                sort_key, direction = key_or_list[0]
                reverse = (direction == -1)
        elif isinstance(key_or_list, str):
            sort_key = key_or_list
            reverse = (direction == -1)
        
        if sort_key:
            self._items.sort(key=lambda x: str(x.get(sort_key, "")), reverse=reverse)
        return self

    def skip(self, n: int):
        self._items = self._items[n:]
        return self

    def limit(self, n: int):
        self._items = self._items[:n]
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self._items):
            item = self._items[self._index]
            self._index += 1
            return item
        raise StopAsyncIteration

    async def to_list(self, length: Optional[int] = None):
        if length is None:
            return list(self._items)
        return list(self._items[:length])


class InMemoryAsyncCollection:
    """In-memory async collection simulating Motor collection methods."""
    def __init__(self, name: str):
        self.name = name
        self.docs: Dict[str, Dict[str, Any]] = {}

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, branch) for branch in v):
                    return False
                continue
            if k == "_id":
                doc_id = str(doc.get("_id", ""))
                query_id = str(v)
                if doc_id != query_id:
                    return False
                continue
            if isinstance(v, dict):
                if "$in" in v:
                    val = doc.get(k)
                    if isinstance(val, list):
                        if not any(item in v["$in"] for item in val):
                            return False
                    elif val not in v["$in"]:
                        return False
                elif "$ne" in v:
                    if doc.get(k) == v["$ne"]:
                        return False
                elif "$gt" in v and not (doc.get(k, 0) > v["$gt"]):
                    return False
                elif "$gte" in v and not (doc.get(k, 0) >= v["$gte"]):
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            doc_copy["_id"] = ObjectId()
        doc_id_str = str(doc_copy["_id"])
        self.docs[doc_id_str] = doc_copy
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def insert_many(self, documents: List[Dict[str, Any]]):
        inserted_ids = []
        for doc in documents:
            res = await self.insert_one(doc)
            inserted_ids.append(res.inserted_id)
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    async def find_one(self, filter: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        filter = filter or {}
        for doc in self.docs.values():
            if self._matches(doc, filter):
                res = dict(doc)
                if projection and "_id" in projection and projection["_id"] == 0:
                    res.pop("_id", None)
                return res
        return None

    def find(self, filter: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        filter = filter or {}
        matched = [dict(doc) for doc in self.docs.values() if self._matches(doc, filter)]
        return InMemoryAsyncCursor(matched)

    async def update_one(self, filter: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        doc = await self.find_one(filter)
        class UpdateResult:
            def __init__(self, matched, modified, upserted_id=None):
                self.matched_count = matched
                self.modified_count = modified
                self.upserted_id = upserted_id

        if not doc:
            if upsert and "$set" in update:
                new_doc = {**filter, **update["$set"]}
                res = await self.insert_one(new_doc)
                return UpdateResult(0, 0, res.inserted_id)
            return UpdateResult(0, 0)
        
        doc_id_str = str(doc["_id"])
        target = self.docs[doc_id_str]
        if "$set" in update:
            for k, v in update["$set"].items():
                target[k] = v
        if "$push" in update:
            for k, v in update["$push"].items():
                target.setdefault(k, []).append(v)
        if "$inc" in update:
            for k, v in update["$inc"].items():
                target[k] = target.get(k, 0) + v

        return UpdateResult(1, 1)

    async def delete_one(self, filter: Dict[str, Any]):
        doc = await self.find_one(filter)
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        if doc:
            doc_id_str = str(doc["_id"])
            if doc_id_str in self.docs:
                del self.docs[doc_id_str]
                return DeleteResult(1)
        return DeleteResult(0)

    async def count_documents(self, filter: Optional[Dict[str, Any]] = None) -> int:
        filter = filter or {}
        count = 0
        for doc in self.docs.values():
            if self._matches(doc, filter):
                count += 1
        return count

    async def create_index(self, keys, **kwargs):
        return "idx_simulated"


class DatabaseManager:
    """MongoDB Client & Database Manager with Motor async driver and Atlas resilience."""
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.is_connected = False
        self.in_memory_fallback = False
        self.mock_collections: Dict[str, InMemoryAsyncCollection] = {
            col: InMemoryAsyncCollection(col) for col in COLLECTIONS
        }

    async def connect(self):
        """Initialize connection to MongoDB (Local or Atlas) with fallback resilience."""
        if self.is_connected and not self.in_memory_fallback and self.db is not None:
            return

        if os.getenv("TESTING", "").lower() in ["1", "true"]:
            self.is_connected = True
            self.in_memory_fallback = True
            logger.info("TESTING mode active. Skipping live cluster connection.")
            return

        candidate_urls = []
        if settings.MONGODB_URL:
            candidate_urls.append(settings.MONGODB_URL)
            if "localhost" in settings.MONGODB_URL:
                candidate_urls.append(settings.MONGODB_URL.replace("localhost", "127.0.0.1"))
            elif "127.0.0.1" in settings.MONGODB_URL:
                candidate_urls.append(settings.MONGODB_URL.replace("127.0.0.1", "localhost"))
        candidate_urls.extend(["mongodb://127.0.0.1:27017", "mongodb://localhost:27017"])

        # Deduplicate while preserving order
        seen = set()
        deduped_urls = []
        for u in candidate_urls:
            if u not in seen:
                seen.add(u)
                deduped_urls.append(u)

        for url in deduped_urls:
            try:
                logger.info(f"Connecting to MongoDB at {url}...")
                client = AsyncIOMotorClient(
                    url,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000
                )
                db = client[settings.MONGODB_DB_NAME]
                await asyncio.wait_for(db.command("ping"), timeout=4.0)
                self.client = client
                self.db = db
                self.is_connected = True
                self.in_memory_fallback = False
                logger.info(f"Successfully connected to MongoDB database '{settings.MONGODB_DB_NAME}' at {url}")
                await self.init_indexes()
                return
            except Exception as e:
                logger.warning(f"Connection attempt to {url} failed: {e}")
                continue

        logger.warning(
            "Could not connect to live MongoDB on any endpoint. Using In-Memory fallback store."
        )
        self.is_connected = True
        self.in_memory_fallback = True

    async def close(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB connection closed.")

    def get_collection(self, collection_name: str):
        """Get collection handle (Motor or Fallback)."""
        if not self.in_memory_fallback and self.db is not None:
            return self.db[collection_name]
        if self.db is not None:
            return self.db[collection_name]
        if collection_name not in self.mock_collections:
            self.mock_collections[collection_name] = InMemoryAsyncCollection(collection_name)
        return self.mock_collections[collection_name]

    async def init_indexes(self):
        """Create indexes on MongoDB collections."""
        if self.in_memory_fallback or self.db is None:
            return
        try:
            await self.db.users.create_index("email", unique=True)
            await self.db.users.create_index("role")
            await self.db.resumes.create_index("user_id")
            await self.db.interviews.create_index("candidate_id")
            await self.db.evaluations.create_index("interview_id")
        except Exception as e:
            logger.warning(f"Error initializing indexes: {e}")

db_manager = DatabaseManager()

def get_db_collection(collection_name: str):
    return db_manager.get_collection(collection_name)
