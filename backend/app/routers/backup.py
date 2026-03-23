import os
import sqlite3
import tempfile
from datetime import date

from fastapi import APIRouter, HTTPException
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
