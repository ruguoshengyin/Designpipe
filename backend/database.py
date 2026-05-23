"""
Database setup and migration.
SQLite via aiosqlite.
"""
import aiosqlite
import logging
import os

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "dp.db")

CREATE_PROJECTS = """
CREATE TABLE IF NOT EXISTS projects (
  id            TEXT    PRIMARY KEY,
  product       TEXT    NOT NULL DEFAULT '',
  target_user   TEXT    NOT NULL DEFAULT '',
  scenario      TEXT    NOT NULL DEFAULT '',
  direction     TEXT,
  title         TEXT    NOT NULL DEFAULT '新设计项目',
  style         TEXT    NOT NULL DEFAULT '通用风格',
  cover         TEXT    NOT NULL DEFAULT 'mobile',
  current_step  INTEGER NOT NULL DEFAULT 0,
  max_step      INTEGER NOT NULL DEFAULT 5,
  status        TEXT    NOT NULL DEFAULT '草稿',
  tag           TEXT,
  collaborators TEXT    NOT NULL DEFAULT '[]',
  page_type     TEXT,
  uploaded_image TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""

CREATE_STEP_DATA = """
CREATE TABLE IF NOT EXISTS step_data (
  project_id TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step       INTEGER NOT NULL,
  data_type  TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, step)
);
"""

# Columns added after initial schema — safe to run on existing DBs
_MIGRATIONS = [
    ("title",          "TEXT NOT NULL DEFAULT '新设计项目'"),
    ("style",          "TEXT NOT NULL DEFAULT '通用风格'"),
    ("cover",          "TEXT NOT NULL DEFAULT 'mobile'"),
    ("current_step",   "INTEGER NOT NULL DEFAULT 0"),
    ("max_step",       "INTEGER NOT NULL DEFAULT 5"),
    ("status",         "TEXT NOT NULL DEFAULT '草稿'"),
    ("tag",            "TEXT"),
    ("collaborators",  "TEXT NOT NULL DEFAULT '[]'"),
    ("page_type",      "TEXT"),
    ("uploaded_image", "TEXT"),
]


async def _migrate(db: aiosqlite.Connection) -> None:
    """Add any columns missing from an old schema."""
    async with db.execute("PRAGMA table_info(projects)") as cur:
        rows = await cur.fetchall()
    existing = {row[1] for row in rows}

    for col_name, col_def in _MIGRATIONS:
        if col_name not in existing:
            logger.info("DB migration: adding column projects.%s", col_name)
            await db.execute(f"ALTER TABLE projects ADD COLUMN {col_name} {col_def}")

    await db.commit()


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_PROJECTS)
        await db.execute(CREATE_STEP_DATA)
        await db.commit()
        await _migrate(db)


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db
