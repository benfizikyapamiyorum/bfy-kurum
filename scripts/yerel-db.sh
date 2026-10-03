#!/usr/bin/env bash
# Yerel Postgres'i başlatır ve migration'ları uygular (RLS testleri için).
# Kullanım: bash scripts/yerel-db.sh   → ardından: DATABASE_URL=... npm run test:db
set -euo pipefail

PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
VERI="${VERI:-/tmp/bfy-kurum-pg}"
PORT="${PORT:-54329}"
KOK="$(cd "$(dirname "$0")/.." && pwd)"
CALISTIR=()
if [ "$(id -u)" = "0" ]; then CALISTIR=(runuser -u postgres --); fi

if [ -f "$VERI/postmaster.pid" ]; then
  "${CALISTIR[@]}" "$PG_BIN/pg_ctl" -D "$VERI" stop -m fast >/dev/null || true
fi
rm -rf "$VERI"
mkdir -p "$VERI"
[ "$(id -u)" = "0" ] && chown postgres "$VERI"
"${CALISTIR[@]}" "$PG_BIN/initdb" -D "$VERI" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
"${CALISTIR[@]}" "$PG_BIN/pg_ctl" -D "$VERI" -o "-p $PORT -k /tmp -c listen_addresses=localhost" -l "$VERI/log.txt" start >/dev/null

URL="postgresql://postgres@localhost:$PORT/postgres"
psql "$URL" -q -v ON_ERROR_STOP=1 -f "$KOK/testler/db/supabase-taklit.sql"
for f in "$KOK"/supabase/migrations/*.sql; do
  echo "uygulanıyor: $(basename "$f")"
  psql "$URL" -q -v ON_ERROR_STOP=1 -f "$f"
done
echo "Hazır: DATABASE_URL=$URL"
