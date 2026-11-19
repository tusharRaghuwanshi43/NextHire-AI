import asyncio
import sys

from app.db.mongodb import get_db_collection

async def dummy():
    print("inside dummy")

asyncio.run(dummy())
print("after dummy")
