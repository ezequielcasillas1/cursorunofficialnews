import { loadJsonFile, saveJsonFile } from './json-persist.js';

const FILENAME = 'known-items.json';

/** @type {Set<string>} */
let knownIds = new Set();

function loadFromDisk() {
  const ids = loadJsonFile(FILENAME, []);
  knownIds = new Set(Array.isArray(ids) ? ids : []);
}

function saveToDisk() {
  saveJsonFile(FILENAME, [...knownIds]);
}

loadFromDisk();

export function getKnownIds() {
  return knownIds;
}

export function updateKnownIds(ids) {
  knownIds = new Set(ids);
  saveToDisk();
}
