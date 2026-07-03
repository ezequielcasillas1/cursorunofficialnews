function rowToItem(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    canonicalUrl: row.canonical_url,
    publishedAt: row.published_at,
    category: row.category,
    sourceId: row.source_id,
    sourceName: row.source_name,
    attributionLabel: row.attribution_label,
  };
}

/** Enqueue newly ingested items for the next scheduled digest. */
export async function enqueueDigestItems(db, items) {
  if (!items?.length) return 0;

  const queuedAt = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO digest_queue
       (id, title, excerpt, canonical_url, published_at, category, source_id, source_name, attribution_label, queued_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const statements = items.map((item) =>
    stmt.bind(
      item.id,
      item.title,
      item.excerpt || '',
      item.canonicalUrl || '',
      item.publishedAt || null,
      item.category,
      item.sourceId,
      item.sourceName || null,
      item.attributionLabel || null,
      queuedAt,
    ),
  );

  await db.batch(statements);
  return items.length;
}

export async function listQueuedDigestItems(db) {
  const { results } = await db
    .prepare('SELECT * FROM digest_queue ORDER BY queued_at ASC')
    .all();
  return results.map(rowToItem);
}

export async function clearDigestQueue(db) {
  await db.prepare('DELETE FROM digest_queue').run();
}

export async function getDigestQueueCount(db) {
  const row = await db.prepare('SELECT COUNT(*) AS count FROM digest_queue').first();
  return Number(row?.count || 0);
}

export async function getLastDigestSlot(db) {
  const row = await db.prepare('SELECT last_digest_slot FROM ingest_state WHERE id = 1').first();
  return row?.last_digest_slot || null;
}

export async function setLastDigestSlot(db, slot) {
  await db.prepare('UPDATE ingest_state SET last_digest_slot = ? WHERE id = 1').bind(slot).run();
}
