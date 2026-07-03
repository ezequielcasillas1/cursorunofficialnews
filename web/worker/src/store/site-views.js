const SITE_STATS_ID = 1;

export async function getViewCount(db) {
  const row = await db
    .prepare('SELECT view_count FROM site_stats WHERE id = ?')
    .bind(SITE_STATS_ID)
    .first();
  return Number(row?.view_count ?? 0);
}

export async function incrementViewCount(db) {
  await db
    .prepare(
      "UPDATE site_stats SET view_count = view_count + 1, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(SITE_STATS_ID)
    .run();
  return getViewCount(db);
}
