"""Quick script to sanity-check proctoring event serialization against the DB."""
import asyncio
from app.db.session import async_session_maker
from sqlalchemy import select, desc


async def main():
    from app.db.models import ProctoringEvent, TestSession
    from app.api import proctoring

    async with async_session_maker() as session:
        stmt = select(ProctoringEvent, TestSession).outerjoin(TestSession, TestSession.session_id == ProctoringEvent.test_session_id).order_by(desc(ProctoringEvent.detected_at)).limit(10)
        res = await session.execute(stmt)
        rows = res.all()
        print(f"Found {len(rows)} proctoring rows")
        for evt, ts in rows:
            s = proctoring._serialize_event(evt, ts)
            print(s)


if __name__ == '__main__':
    asyncio.run(main())
