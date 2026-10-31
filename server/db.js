import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export function database(path=process.env.DB_PATH||'data/cycvera.sqlite'){if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');db.exec(readFileSync(new URL('./migrations/001.sql',import.meta.url),'utf8'));return db}
export const all=(db,sql,...args)=>db.prepare(sql).all(...args);
export const get=(db,sql,...args)=>db.prepare(sql).get(...args);
export const run=(db,sql,...args)=>db.prepare(sql).run(...args);
export function transaction(db,fn){db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}
