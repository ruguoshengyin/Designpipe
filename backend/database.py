import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "dp.db")

CREATE_PROJECTS = """
CREATE TABLE IF NOT EXISTS projects (
  id           TEXT    PRIMARY KEY,
  product      TEXT    NOT NULL DEFAULT '',
  target_user  TEXT    NOT NULL DEFAULT '',
  scenario     TEXT    NOT NULL DEFAULT '',
  direction    TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
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


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_PROJECTS)
        await db.execute(CREATE_STEP_DATA)
        await db.commit()


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db
