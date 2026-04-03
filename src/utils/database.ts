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

  CREATE TABLE IF NOT EXISTS schedules (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id       TEXT NOT NULL,
    channel_id     TEXT NOT NULL,
    host_id        TEXT NOT NULL,
    title          TEXT NOT NULL,
    game           TEXT NOT NULL,
    scheduled_for  INTEGER NOT NULL,
    remind_before  INTEGER NOT NULL DEFAULT 15,
    reminded       INTEGER NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'active',
    created_at     INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS vote_polls (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id       TEXT NOT NULL,
    channel_id     TEXT NOT NULL,
    created_by     TEXT NOT NULL,
    topic          TEXT NOT NULL,
    game           TEXT NOT NULL,
    ends_at        INTEGER NOT NULL,
    status         TEXT NOT NULL DEFAULT 'active',
    created_at     INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS vote_options (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id        INTEGER NOT NULL,
    option_name    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vote_ballots (
    poll_id        INTEGER NOT NULL,
    user_id        TEXT NOT NULL,
    option_id      INTEGER NOT NULL,
    created_at     INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (poll_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS member_streaks (
    guild_id               TEXT NOT NULL,
    user_id                TEXT NOT NULL,
    good_streak            INTEGER DEFAULT 0,
    bad_streak             INTEGER DEFAULT 0,
    best_good_streak       INTEGER DEFAULT 0,
    best_bad_streak        INTEGER DEFAULT 0,
    reward_points          INTEGER DEFAULT 0,
    mission_streak         INTEGER DEFAULT 0,
    last_action_type       TEXT,
    last_action_at         INTEGER,
    last_mission_claim_day TEXT,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS mission_claims (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id       TEXT NOT NULL,
    user_id        TEXT NOT NULL,
    mission_day    TEXT NOT NULL,
    mission_number INTEGER NOT NULL,
    mission_text   TEXT NOT NULL,
    created_at     INTEGER DEFAULT (unixepoch()),
    UNIQUE(guild_id, user_id, mission_day, mission_number)
  );

  CREATE TABLE IF NOT EXISTS match_results (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id       TEXT NOT NULL,
    game           TEXT NOT NULL,
    result         TEXT NOT NULL,
    mvp_user_id    TEXT,
    carry_user_id  TEXT,
    beban_user_id  TEXT,
    recorded_by    TEXT NOT NULL,
    note           TEXT,
    created_at     INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS active_penalties (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    role_id     TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    created_by  TEXT NOT NULL,
    reason      TEXT,
    created_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS command_cooldowns (
    guild_id       TEXT NOT NULL,
    command_name   TEXT NOT NULL,
    last_used_at   INTEGER NOT NULL,
    last_used_by   TEXT NOT NULL,
    PRIMARY KEY (guild_id, command_name)
  );

  CREATE TABLE IF NOT EXISTS member_lore (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id      TEXT NOT NULL,
    user_id       TEXT NOT NULL,
    memory_text   TEXT NOT NULL,
    remembered_by TEXT NOT NULL,
    created_at    INTEGER DEFAULT (unixepoch())
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

// ── Penalty Queries ──────────────────────────────────────
export const penaltyQueries = {
  insert: db.prepare(`
    INSERT INTO active_penalties (guild_id, user_id, role_id, expires_at, created_by, reason)
    VALUES (@guild_id, @user_id, @role_id, @expires_at, @created_by, @reason)
  `),

  getExpired: db.prepare(`
    SELECT * FROM active_penalties
    WHERE expires_at <= unixepoch() * 1000
  `),

  deleteById: db.prepare(`
    DELETE FROM active_penalties WHERE id = ?
  `),

  deleteActiveForRole: db.prepare(`
    DELETE FROM active_penalties WHERE guild_id = ? AND user_id = ? AND role_id = ?
  `),
};

// ── Cooldown Queries ─────────────────────────────────────
export const cooldownQueries = {
  get: db.prepare(`
    SELECT * FROM command_cooldowns WHERE guild_id = ? AND command_name = ?
  `),

  upsert: db.prepare(`
    INSERT INTO command_cooldowns (guild_id, command_name, last_used_at, last_used_by)
    VALUES (@guild_id, @command_name, @last_used_at, @last_used_by)
    ON CONFLICT(guild_id, command_name) DO UPDATE SET
      last_used_at = excluded.last_used_at,
      last_used_by = excluded.last_used_by
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

  getLeaderboard: db.prepare(`
    SELECT *,
      (bless_given * 3) + (curse_given * 2) + roast_given AS score
    FROM sesepuh_stats
    WHERE guild_id = ?
    ORDER BY score DESC, bless_given DESC, curse_given DESC, roast_given DESC
    LIMIT ?
  `),
};

// ── Schedule Queries ─────────────────────────────────────
export const scheduleQueries = {
  insert: db.prepare(`
    INSERT INTO schedules (guild_id, channel_id, host_id, title, game, scheduled_for, remind_before)
    VALUES (@guild_id, @channel_id, @host_id, @title, @game, @scheduled_for, @remind_before)
  `),

  getActive: db.prepare(`
    SELECT * FROM schedules
    WHERE guild_id = ? AND status = 'active'
    ORDER BY scheduled_for ASC
    LIMIT ?
  `),

  getInRange: db.prepare(`
    SELECT * FROM schedules
    WHERE guild_id = ?
      AND scheduled_for >= ?
      AND scheduled_for < ?
      AND status IN ('active', 'completed')
    ORDER BY scheduled_for ASC
  `),

  getReminderCandidates: db.prepare(`
    SELECT * FROM schedules
    WHERE status = 'active'
      AND reminded = 0
      AND (scheduled_for - (remind_before * 60000)) <= ?
  `),

  markReminded: db.prepare(`
    UPDATE schedules SET reminded = 1 WHERE id = ?
  `),

  complete: db.prepare(`
    UPDATE schedules SET status = 'completed' WHERE id = ? AND guild_id = ?
  `),

  cancelExpired: db.prepare(`
    UPDATE schedules
    SET status = 'expired'
    WHERE status = 'active' AND scheduled_for < ?
  `),
};

// ── Voting Queries ───────────────────────────────────────
export const voteQueries = {
  insertPoll: db.prepare(`
    INSERT INTO vote_polls (guild_id, channel_id, created_by, topic, game, ends_at)
    VALUES (@guild_id, @channel_id, @created_by, @topic, @game, @ends_at)
  `),

  insertOption: db.prepare(`
    INSERT INTO vote_options (poll_id, option_name)
    VALUES (?, ?)
  `),

  getActivePolls: db.prepare(`
    SELECT * FROM vote_polls
    WHERE guild_id = ? AND status = 'active'
    ORDER BY created_at DESC
    LIMIT ?
  `),

  getPoll: db.prepare(`
    SELECT * FROM vote_polls WHERE id = ? AND guild_id = ?
  `),

  getOptions: db.prepare(`
    SELECT * FROM vote_options WHERE poll_id = ? ORDER BY id ASC
  `),

  upsertBallot: db.prepare(`
    INSERT INTO vote_ballots (poll_id, user_id, option_id)
    VALUES (@poll_id, @user_id, @option_id)
    ON CONFLICT(poll_id, user_id) DO UPDATE SET
      option_id = excluded.option_id,
      created_at = unixepoch()
  `),

  getResults: db.prepare(`
    SELECT o.id, o.option_name, COUNT(b.user_id) AS vote_count
    FROM vote_options o
    LEFT JOIN vote_ballots b ON b.option_id = o.id
    WHERE o.poll_id = ?
    GROUP BY o.id, o.option_name
    ORDER BY vote_count DESC, o.id ASC
  `),

  closePoll: db.prepare(`
    UPDATE vote_polls SET status = 'closed' WHERE id = ?
  `),
};

// ── Streak Queries ───────────────────────────────────────
export const streakQueries = {
  ensure: db.prepare(`
    INSERT INTO member_streaks (guild_id, user_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id, user_id) DO NOTHING
  `),

  reward: db.prepare(`
    INSERT INTO member_streaks (
      guild_id, user_id, good_streak, bad_streak, best_good_streak,
      reward_points, last_action_type, last_action_at
    )
    VALUES (@guild_id, @user_id, 1, 0, 1, @points, 'reward', unixepoch())
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      good_streak = good_streak + 1,
      bad_streak = 0,
      best_good_streak = CASE
        WHEN best_good_streak < good_streak + 1 THEN good_streak + 1
        ELSE best_good_streak
      END,
      reward_points = reward_points + @points,
      last_action_type = 'reward',
      last_action_at = unixepoch()
  `),

  penalty: db.prepare(`
    INSERT INTO member_streaks (
      guild_id, user_id, good_streak, bad_streak, best_bad_streak,
      reward_points, last_action_type, last_action_at
    )
    VALUES (@guild_id, @user_id, 0, 1, 1, @points, 'penalty', unixepoch())
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      good_streak = 0,
      bad_streak = bad_streak + 1,
      best_bad_streak = CASE
        WHEN best_bad_streak < bad_streak + 1 THEN bad_streak + 1
        ELSE best_bad_streak
      END,
      reward_points = reward_points + @points,
      last_action_type = 'penalty',
      last_action_at = unixepoch()
  `),

  claimMission: db.prepare(`
    INSERT INTO member_streaks (
      guild_id, user_id, mission_streak, reward_points, last_action_type,
      last_action_at, last_mission_claim_day
    )
    VALUES (@guild_id, @user_id, 1, @points, 'mission', unixepoch(), @mission_day)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      mission_streak = CASE
        WHEN last_mission_claim_day = @previous_day THEN mission_streak + 1
        ELSE 1
      END,
      reward_points = reward_points + @points,
      last_action_type = 'mission',
      last_action_at = unixepoch(),
      last_mission_claim_day = @mission_day
  `),

  get: db.prepare(`
    SELECT * FROM member_streaks WHERE guild_id = ? AND user_id = ?
  `),

  getLeaderboard: db.prepare(`
    SELECT * FROM member_streaks
    WHERE guild_id = ?
    ORDER BY reward_points DESC, good_streak DESC, mission_streak DESC
    LIMIT ?
  `),
};

// ── Mission Queries ──────────────────────────────────────
export const missionQueries = {
  claim: db.prepare(`
    INSERT INTO mission_claims (guild_id, user_id, mission_day, mission_number, mission_text)
    VALUES (@guild_id, @user_id, @mission_day, @mission_number, @mission_text)
  `),

  getClaimsForDay: db.prepare(`
    SELECT * FROM mission_claims
    WHERE guild_id = ? AND user_id = ? AND mission_day = ?
    ORDER BY mission_number ASC
  `),
};

// ── Match Queries ────────────────────────────────────────
export const matchQueries = {
  insert: db.prepare(`
    INSERT INTO match_results (
      guild_id, game, result, mvp_user_id, carry_user_id, beban_user_id, recorded_by, note
    )
    VALUES (
      @guild_id, @game, @result, @mvp_user_id, @carry_user_id, @beban_user_id, @recorded_by, @note
    )
  `),

  getRecent: db.prepare(`
    SELECT * FROM match_results
    WHERE guild_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),

  getStatsForUser: db.prepare(`
    SELECT
      SUM(CASE WHEN mvp_user_id = ? THEN 1 ELSE 0 END) AS mvp_count,
      SUM(CASE WHEN carry_user_id = ? THEN 1 ELSE 0 END) AS carry_count,
      SUM(CASE WHEN beban_user_id = ? THEN 1 ELSE 0 END) AS beban_count
    FROM match_results
    WHERE guild_id = ?
  `),
};

// ── Lore Queries ─────────────────────────────────────────
export const loreQueries = {
  insert: db.prepare(`
    INSERT INTO member_lore (guild_id, user_id, memory_text, remembered_by)
    VALUES (@guild_id, @user_id, @memory_text, @remembered_by)
  `),

  getForUser: db.prepare(`
    SELECT * FROM member_lore
    WHERE guild_id = ? AND user_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `),
};

export default db;
