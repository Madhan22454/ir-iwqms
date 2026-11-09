import os
import sys
import urllib.parse
from dotenv import load_dotenv
import sqlalchemy

print('--- LOADING .env.production ---')
load_dotenv('.env.production')
db_url = os.getenv('DATABASE_URL')
if not db_url:
    print('ERROR: DATABASE_URL not found in .env.production')
    sys.exit(1)

parsed = urllib.parse.urlparse(db_url)
print(f'Host: {parsed.hostname}')
print(f'Port: {parsed.port}')
print(f'Database: {parsed.path.lstrip("/")}')
print(f'User: {parsed.username}')
print(f'Scheme: {parsed.scheme}')

print('\n--- DIRECT SQLALCHEMY EXECUTION USING ENV URL ---')
try:
    engine = sqlalchemy.create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(sqlalchemy.text('SELECT current_database(), current_schema();')).fetchone()
        print(f'DB: {res[0]}, Schema: {res[1]}')
        
        print('\nColumns in stations:')
        cols = conn.execute(sqlalchemy.text('''
            SELECT table_schema, table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'stations' 
            ORDER BY table_schema, ordinal_position;
        ''')).fetchall()
        for c in cols:
            print(c)
            
        print('\nCounts:')
        cnt = conn.execute(sqlalchemy.text('SELECT COUNT(*) FROM stations;')).fetchone()[0]
        print(f'Total Stations: {cnt}')
        
        aggs = conn.execute(sqlalchemy.text('''
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE source_provenance = 'DEMONSTRATION DATA') AS demonstration_records,
                COUNT(*) FILTER (WHERE source_provenance IS NULL) AS missing_provenance
            FROM stations;
        ''')).fetchone()
        print(f'Aggregates: {aggs}')
except Exception as e:
    print(f'Direct Execution Error: {e}')

print('\n--- SQLALCHEMY SESSIONLOCAL EXECUTION ---')
sys.path.append('api')
from database import SessionLocal, engine as default_engine
print(f'Default Engine URL: {default_engine.url.render_as_string(hide_password=True)}')
try:
    with SessionLocal() as db:
        res = db.execute(sqlalchemy.text('SELECT current_database(), current_schema();')).fetchone()
        print(f'SessionLocal DB: {res[0]}, Schema: {res[1]}')
        
        cols = db.execute(sqlalchemy.text('''
            SELECT table_schema, table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'stations' 
            ORDER BY table_schema, ordinal_position;
        ''')).fetchall()
        print('\nSessionLocal columns:')
        for c in cols:
            print(c)
            
        aggs = db.execute(sqlalchemy.text('''
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE source_provenance = 'DEMONSTRATION DATA') AS demonstration_records,
                COUNT(*) FILTER (WHERE source_provenance IS NULL) AS missing_provenance
            FROM stations;
        ''')).fetchone()
        print(f'\nSessionLocal Aggregates: {aggs}')
except Exception as e:
    print(f'SessionLocal Exception: {e}')
