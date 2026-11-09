import sqlite3
import os

for path in ['ir_iwqms.db', '../ir_iwqms.db']:
    if not os.path.exists(path):
        continue
    print(f"Checking {path}")
    conn = sqlite3.connect(path)
    c = conn.cursor()
    c.execute("PRAGMA table_info(stations)")
    cols = [r[1] for r in c.fetchall()]
    print("Existing cols:", cols)
    for col, col_def in [
        ('source_provenance', "TEXT DEFAULT 'DEMONSTRATION DATA'"),
        ('dataset_version', "TEXT"),
        ('imported_at', "DATETIME"),
        ('last_verified_at', "DATETIME")
    ]:
        if col not in cols:
            print(f"Adding column {col} to {path}")
            c.execute(f"ALTER TABLE stations ADD COLUMN {col} {col_def}")
    conn.commit()
    conn.close()

print("Schema update completed successfully.")

