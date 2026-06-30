import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FEED_PAGE_SIZE,
  buildFeedPaginationMeta,
  parseFeedPaginationQuery,
} from '../../shared/feed/feedPagination.js';

test('FEED_PAGE_SIZE defaults to 30', () => {
  assert.equal(FEED_PAGE_SIZE, 30);
});

test('parseFeedPaginationQuery uses page 1 and limit 30 by default', () => {
  assert.deepEqual(parseFeedPaginationQuery({}), {
    limit: 30,
    page: 1,
    offset: 0,
  });
});

test('parseFeedPaginationQuery derives offset from page and limit', () => {
  assert.deepEqual(parseFeedPaginationQuery({ page: '3', limit: '10' }), {
    limit: 10,
    page: 3,
    offset: 20,
  });
});

test('parseFeedPaginationQuery honors explicit offset over page', () => {
  assert.deepEqual(parseFeedPaginationQuery({ page: '5', offset: '7', limit: '10' }), {
    limit: 10,
    page: 5,
    offset: 7,
  });
});

test('parseFeedPaginationQuery clamps invalid page and limit', () => {
  assert.deepEqual(parseFeedPaginationQuery({ page: '-1', limit: '0' }), {
    limit: 30,
    page: 1,
    offset: 0,
  });
  assert.deepEqual(parseFeedPaginationQuery({ limit: '999' }), {
    limit: 200,
    page: 1,
    offset: 0,
  });
});

test('buildFeedPaginationMeta reports hasMore and totalPages', () => {
  assert.deepEqual(
    buildFeedPaginationMeta({ total: 65, limit: 30, page: 1, offset: 0, itemCount: 30 }),
    { total: 65, page: 1, pageSize: 30, totalPages: 3, hasMore: true },
  );
  assert.deepEqual(
    buildFeedPaginationMeta({ total: 65, limit: 30, page: 3, offset: 60, itemCount: 5 }),
    { total: 65, page: 3, pageSize: 30, totalPages: 3, hasMore: false },
  );
  assert.deepEqual(
    buildFeedPaginationMeta({ total: 0, limit: 30, page: 1, offset: 0, itemCount: 0 }),
    { total: 0, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
  );
});
