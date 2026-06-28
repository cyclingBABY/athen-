# TODO - Book Tracking (Double-Tick)

- [ ] Create DB migration/table: `book_trackings` with borrowed/returned timestamps + status.
- [x] Create DB migration/table: `book_trackings`.
- [x] Extend API backend (`api/index.php`) with basic support (update hook for `book_trackings`).
- [ ] (Optional hardening) add strict invariants server-side (no double return, no borrow when already active).


- [ ] Create admin page: `src/pages/admin/BookTracking.tsx`:
  - [ ] table columns + search
  - [ ] Issue Book modal (assign user + book)
  - [ ] Mark as Returned button (second tick)
  - [ ] badges/visual ticks for both states.
- [ ] Wire route in `src/App.tsx`: `/admin/book-tracking`.
- [ ] Add sidebar nav item in `src/components/AppSidebar.tsx`.
- [ ] Smoke test: issue → borrowed tick; return → returned tick; refresh data.

