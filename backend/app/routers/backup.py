import os
import sqlite3
import tempfile
from datetime import date

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from app.db.database import engine

router = APIRouter()


@router.get("/export")
def export_backup():
    """Stream a consistent snapshot of the database as a downloadable file."""
    db_path = engine.url.database  # e.g. "./lineup.db"

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()

    try:
        src = sqlite3.connect(db_path)
        dst = sqlite3.connect(tmp.name)
        src.backup(dst)
        dst.close()
        src.close()
    except Exception as exc:
        os.unlink(tmp.name)
        raise HTTPException(status_code=500, detail=str(exc))

    filename = f"lineup-backup-{date.today()}.db"
    return FileResponse(
        tmp.name,
        media_type="application/octet-stream",
        filename=filename,
        background=None,  # FileResponse cleans up after sending
    )


@router.post("/restore")
async def restore_backup(file: UploadFile = File(...)):
    """Replace the current database with an uploaded backup file."""
    header = await file.read(16)
    if not header.startswith(b"SQLite format 3"):
        raise HTTPException(status_code=400, detail="Not a valid SQLite database file")

    await file.seek(0)
    content = await file.read()

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.write(content)
    tmp.close()

    try:
        src = sqlite3.connect(tmp.name)
        db_path = engine.url.database
        dst = sqlite3.connect(db_path)
        src.backup(dst)
        dst.close()
        src.close()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        os.unlink(tmp.name)

    # Release pooled connections so the next request picks up the restored data
    engine.dispose()

    return {"status": "restored"}
