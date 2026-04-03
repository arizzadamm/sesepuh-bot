import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'sesepuh.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ── Schema ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS active_buffs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    role_id     TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    created_by  TEXT NOT NULL,
    created_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS curse_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    reason      TEXT,
    cursed_by   TEXT NOT NULL,
    cursed_at   INTEGER DEFAULT (unixepoch()),
    expires_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS spin_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    challenge   TEXT NOT NULL,
    spun_at     INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS sesepuh_stats (
    guild_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    bless_given INTEGER DEFAULT 0,
    curse_given INTEGER DEFAULT 0,
    roast_given INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );
`);

// ── Buff Queries ─────────────────────────────────────────
export const buffQueries = {
  insert: db.prepare(`
    INSERT INTO active_buffs (guild_id, user_id, role_id, expires_at, created_by)
    VALUES (@guild_id, @user_id, @role_id, @expires_at, @created_by)
  `),

  getExpired: db.prepare(`
    SELECT * FROM active_buffs
    WHERE expires_at <= unixepoch() * 1000
  `),

  getByUser: db.prepare(`
    SELECT * FROM active_buffs
    WHERE guild_id = ? AND user_id = ?
  `),

  deleteById: db.prepare(`DELETE FROM active_buffs WHERE id = ?`),

  deleteByUser: db.prepare(`
    DELETE FROM active_buffs WHERE guild_id = ? AND user_id = ?
  `),
};

// ── Curse Queries ────────────────────────────────────────
export const curseQueries = {
  insert: db.prepare(`
    INSERT INTO curse_log (guild_id, user_id, duration_ms, reason, cursed_by, expires_at)
    VALUES (@guild_id, @user_id, @duration_ms, @reason, @cursed_by, @expires_at)
  `),

  getHistory: db.prepare(`
    SELECT * FROM curse_log
    WHERE guild_id = ? AND user_id = ?
    ORDER BY cursed_at DESC LIMIT 5
  `),
};

// ── Spin Queries ─────────────────────────────────────────
export const spinQueries = {
  insert: db.prepare(`
    INSERT INTO spin_results (guild_id, user_id, challenge)
    VALUES (@guild_id, @user_id, @challenge)
  `),

  getRecent: db.prepare(`
    SELECT * FROM spin_results
    WHERE guild_id = ?
    ORDER BY spun_at DESC LIMIT 10
  `),
};

// ── Stats Queries ────────────────────────────────────────
export const statsQueries = {
  upsert: db.prepare(`
    INSERT INTO sesepuh_stats (guild_id, user_id, bless_given, curse_given, roast_given)
    VALUES (@guild_id, @user_id, @bless_given, @curse_given, @roast_given)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      bless_given = bless_given + @bless_given,
      curse_given = curse_given + @curse_given,
      roast_given = roast_given + @roast_given
  `),

  get: db.prepare(`
    SELECT * FROM sesepuh_stats WHERE guild_id = ? AND user_id = ?
  `),
};

export default db;
