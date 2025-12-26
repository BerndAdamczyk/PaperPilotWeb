import asyncio
import logging
from typing import List, Dict, Any

logger = logging.getLogger("events")

class EventManager:
    def __init__(self):
        self.listeners: List[asyncio.Queue] = []

    async def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.listeners.append(q)
        logger.info(f"Client subscribed. Total listeners: {len(self.listeners)}")
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self.listeners:
            self.listeners.remove(q)
            logger.info(f"Client unsubscribed. Total listeners: {len(self.listeners)}")

    async def broadcast(self, event_type: str, data: Any):
        message = {"type": event_type, "data": data}
        # Iterate over a copy to avoid modification during iteration issues
        for q in list(self.listeners):
            try:
                # Put nowait to avoid blocking if a queue is full (unlikely with unbounded)
                q.put_nowait(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to queue: {e}")

event_manager = EventManager()
