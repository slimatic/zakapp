#!/usr/bin/env python3
"""
Lightweight dry-run migration: AssetSnapshot -> Nisab Record CSV

This script reads the SQLite database directly (no Prisma needed) and
produces a CSV that lists planned mappings from `asset_snapshots` to
the proposed Nisab (YearlySnapshot) records. It intentionally does not
write to the DB — it's safe for review and can be run in environments
without Node.js or native build tools.

Usage:
  python3 dry_run_migrate_snapshots_to_nisab.py --db path/to/dev.db
or
  export DATABASE_URL=file:./prisma/data/dev.db
  python3 dry_run_migrate_snapshots_to_nisab.py

Output:
  - `migrate-snapshots-to-nisab-planned.csv` in the same folder as the script

Note: If DATABASE_URL uses the `file:` prefix, it will be stripped.
"""
import os
import sys
import csv
import sqlite3
import argparse
from datetime import datetime


def resolve_db_path(db_arg: str) -> str:
    # Prefer explicit arg, else read env DATABASE_URL
    db_url = db_arg or os.environ.get('DATABASE_URL')
    if not db_url:
        raise SystemExit('Database path not provided via --db or DATABASE_URL environment variable')
    # support prisma-style `file:./prisma/data/dev.db`
    if db_url.startswith('file:'):
        return db_url[len('file:'):]
    return db_url


def fetch_snapshots(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, userId, snapshotDate, snapshotType, totalValue, assetCount, islamicYear, isLocked, createdAt
        FROM asset_snapshots
        ORDER BY snapshotDate DESC
        """
    )
    rows = cur.fetchall()
    columns = [d[0] for d in cur.description]
    return columns, rows


def to_iso(ts_str):
    # Prisma stores DateTime as ISO strings; sqlite3 returns same
    if ts_str is None:
        return ''
    try:
        # Ensure it's a string
        return datetime.fromisoformat(ts_str).isoformat()
    except Exception:
        return str(ts_str)


def main():
    parser = argparse.ArgumentParser(description='Dry-run migrate asset_snapshots -> nisab CSV')
    parser.add_argument('--db', help='Path to SQLite DB file (or Prisma DATABASE_URL)')
    parser.add_argument('--out', help='Output CSV filename', default='migrate-snapshots-to-nisab-planned.csv')
    args = parser.parse_args()

    db_path = resolve_db_path(args.db)
    if not os.path.exists(db_path):
        print(f'Database file not found: {db_path}')
        sys.exit(2)

    conn = sqlite3.connect(db_path)
    try:
        columns, rows = fetch_snapshots(conn)
    except sqlite3.OperationalError as e:
        print('Error reading table `asset_snapshots`:', e)
        sys.exit(3)

    out_path = os.path.join(os.path.dirname(__file__), args.out)
    with open(out_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        header = [
            'snapshot_id', 'user_id', 'snapshot_date', 'islamic_year', 'snapshot_type',
            'total_value', 'asset_count', 'is_locked', 'created_at',
            'planned_nisab_year', 'planned_nisab_value', 'notes'
        ]
        writer.writerow(header)

        for row in rows:
            # map columns
            rowd = dict(zip(columns, row))
            snapshot_id = rowd.get('id')
            user_id = rowd.get('userId')
            snapshot_date = to_iso(rowd.get('snapshotDate'))
            islamic_year = rowd.get('islamicYear') or ''
            snapshot_type = rowd.get('snapshotType') or ''
            total_value = rowd.get('totalValue') if rowd.get('totalValue') is not None else ''
            asset_count = rowd.get('assetCount') if rowd.get('assetCount') is not None else ''
            is_locked = bool(rowd.get('isLocked'))
            created_at = to_iso(rowd.get('createdAt'))

            # Heuristic for planned Nisab year: prefer islamicYear if present, else derive from snapshot_date
            planned_nisab_year = islamic_year
            if not planned_nisab_year and snapshot_date:
                try:
                    planned_nisab_year = str(datetime.fromisoformat(snapshot_date).year)
                except Exception:
                    planned_nisab_year = ''

            planned_nisab_value = total_value
            notes = f'snapshot_type={snapshot_type}; is_locked={is_locked}'

            writer.writerow([
                snapshot_id, user_id, snapshot_date, islamic_year, snapshot_type,
                planned_nisab_value, asset_count, is_locked, created_at,
                planned_nisab_year, planned_nisab_value, notes
            ])

    print(f'Planned CSV written to: {out_path}')
    print(f'Total snapshots: {len(rows)}')


if __name__ == '__main__':
    main()
