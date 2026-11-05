"""Import verified v4 yearly zstd files into a compressed, indexed SQLite store.
Requires: pip install zstandard. Does not expand the 56.6 GB JSONL to disk.
"""
import argparse, datetime, hashlib, io, json, pathlib, sqlite3, zlib
import zstandard
p=argparse.ArgumentParser();p.add_argument('directory');p.add_argument('database');a=p.parse_args()
root=pathlib.Path(a.directory); manifest=json.loads((root/'MANIFEST.json').read_text('utf-8-sig'))
assert manifest['contentVersion']=='ca268829f7a9'
db=sqlite3.connect(a.database)
db.execute('CREATE TABLE IF NOT EXISTS readings (key TEXT PRIMARY KEY, payload BLOB NOT NULL)')
db.execute('CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
db.execute("DELETE FROM metadata WHERE key='complete'");db.commit()
for item in manifest['files']:
 file=root/f"year-{item['year']}.jsonl.zst"
 assert hashlib.file_digest(file.open('rb'),'sha256').hexdigest()==item['sha256'],file
 count=0
 with file.open('rb') as f, zstandard.ZstdDecompressor(max_window_size=2**27).stream_reader(f) as reader:
  for line in io.TextIOWrapper(reader,encoding='utf-8'):
   row=json.loads(line);date=datetime.date(row['y'],row['m'],row['d'])
   assert row['y']==item['year'] and 0<=row['h']<=11 and row['g'] in manifest['genders']
   assert row['k']==f"{date.isoformat()}-{row['h']}-{row['g']}"
   assert set(row['c'])==set(manifest['topics']) and all(isinstance(v,str) and v for v in row['c'].values())
   db.execute('INSERT INTO readings VALUES (?,?)',(row['k'],zlib.compress(json.dumps(row,ensure_ascii=False).encode(),6)));count+=1
 assert count==item['charts'],(file,count)
 db.commit();print(item['year'],count,flush=True)
assert db.execute('SELECT count(*) FROM readings').fetchone()[0]==manifest['totalCharts']
db.execute('INSERT OR REPLACE INTO metadata VALUES (?,?)',('manifest',json.dumps(manifest)))
db.execute('INSERT OR REPLACE INTO metadata VALUES (?,?)',('complete','true'));db.commit()
print('Complete: verified 674976 charts / 8774688 readings')
