import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSyndicationTimelineHtml } from './twitter-syndication.js';

test('parseSyndicationTimelineHtml returns non-reply tweets with id and text', () => {
  const html = `
    <script id="__NEXT_DATA__" type="application/json">{
      "props": {
        "pageProps": {
          "timeline": {
            "entries": [
              {
                "content": {
                  "tweet": {
                    "id_str": "111",
                    "full_text": "Hello from Cursor",
                    "created_at": "Wed Jul 01 19:33:50 +0000 2026"
                  }
                }
              },
              {
                "content": {
                  "tweet": {
                    "id_str": "222",
                    "full_text": "A reply",
                    "created_at": "Wed Jul 01 19:34:50 +0000 2026",
                    "in_reply_to_status_id_str": "111"
                  }
                }
              }
            ]
          }
        }
      }
    }</script>
  `;

  const tweets = parseSyndicationTimelineHtml(html);
  assert.equal(tweets.length, 1);
  assert.equal(tweets[0].id, '111');
  assert.equal(tweets[0].text, 'Hello from Cursor');
});

test('parseSyndicationTimelineHtml returns empty array for invalid html', () => {
  assert.deepEqual(parseSyndicationTimelineHtml('<html></html>'), []);
  assert.deepEqual(parseSyndicationTimelineHtml(''), []);
});
