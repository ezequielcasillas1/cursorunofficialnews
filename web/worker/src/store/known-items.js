/** Historical dedupe set — replaces store/known-items.js's fs-backed Set. */

export async function getKnownIds(db) {
  const { results } = await db.prepare('SELECT id FROM known_items').all();
  return new Set(results.map((row) => row.id));
}

export async function updateKnownIds(db, ids) {
  const list = [...new Set(ids)];
  const insertStmt = db.prepare('INSERT INTO known_items (id) VALUES (?)');
  const statements = [
    db.prepare('DELETE FROM known_items'),
    ...list.map((id) => insertStmt.bind(id)),
  ];
  await db.batch(statements);
}
