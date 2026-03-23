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


_MAX_RESTORE_BYTES = 10 * 1024 * 1024  # 10 MB
_REQUIRED_TABLES = {"players", "games", "game_availability", "lineups", "lineup_slots"}


@router.post("/restore")
async def restore_backup(file: UploadFile = File(...)):
    """Replace the current database with an uploaded backup file."""
    header = await file.read(16)
    if not header.startswith(b"SQLite format 3"):
        raise HTTPException(status_code=400, detail="Not a valid SQLite database file")

    await file.seek(0)
    # Read one byte past the limit so we can detect oversized files without
    # loading the whole thing into memory first.
    content = await file.read(_MAX_RESTORE_BYTES + 1)
    if len(content) > _MAX_RESTORE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Backup file too large (max {_MAX_RESTORE_BYTES // 1024 // 1024} MB)",
        )

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.write(content)
    tmp.close()

    try:
        # Validate schema before touching the live database
        check = sqlite3.connect(tmp.name)
        tables = {
            r[0]
            for r in check.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        check.close()
        missing = _REQUIRED_TABLES - tables
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid backup: missing tables {', '.join(sorted(missing))}",
            )

        src = sqlite3.connect(tmp.name)
        db_path = engine.url.database
        dst = sqlite3.connect(db_path)
        src.backup(dst)
        dst.close()
        src.close()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        os.unlink(tmp.name)

    # Release pooled connections so the next request picks up the restored data
    engine.dispose()

    return {"status": "restored"}
