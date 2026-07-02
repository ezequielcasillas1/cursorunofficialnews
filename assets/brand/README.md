# Brand source files (optional)

Store **master exports** here; production copies live in `web/public/brand/`.

```
assets/brand/
  source/
    brand-sheet-master.png   ← full 5-panel sheet from design
  exports/                   ← optional working crops before copy to public/
```

Do not wire `assets/` into the Worker or Vite build — only `web/public/brand/` is served.
