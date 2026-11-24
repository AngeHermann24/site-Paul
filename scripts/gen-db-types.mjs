/**
 * Génère src/integrations/supabase/database.types.ts depuis les migrations (via PGlite),
 * au même format que `supabase gen types typescript`.
 * Usage : npm run db:types
 * Avec un projet Supabase lié, l'équivalent officiel est :
 *   npx supabase gen types typescript --linked --schema public > src/integrations/supabase/database.types.ts
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');
const db = new PGlite();
await db.exec(read('supabase/tests/supabase_shim.sql'));
for (const f of readdirSync(join(root, 'supabase/migrations')).filter((x) => x.endsWith('.sql')).sort()) {
  await db.exec(read(`supabase/migrations/${f}`));
}

const { rows: columns } = await db.query(`
  select c.table_name, c.column_name, c.data_type, c.udt_name, c.is_nullable, c.column_default,
         c.is_generated, c.ordinal_position, t.table_type
  from information_schema.columns c
  join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
  where c.table_schema = 'public'
  order by c.table_name, c.ordinal_position`);

const { rows: fks } = await db.query(`
  select con.conname, cl.relname as table_name, rcl.relname as referenced_table,
         array(select a.attname from unnest(con.conkey) k join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k order by a.attname) as columns,
         array(select a.attname from unnest(con.confkey) k join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k order by a.attname) as referenced_columns,
         exists (select 1 from pg_constraint u where u.conrelid = con.conrelid and u.contype in ('u', 'p') and u.conkey = con.conkey) as one_to_one
  from pg_constraint con
  join pg_class cl on cl.oid = con.conrelid
  join pg_namespace n on n.oid = cl.relnamespace
  join pg_class rcl on rcl.oid = con.confrelid
  join pg_namespace rn on rn.oid = rcl.relnamespace
  where con.contype = 'f' and n.nspname = 'public' and rn.nspname = 'public'
  order by cl.relname, con.conname`);

const { rows: functions } = await db.query(`
  select p.proname, pg_get_function_result(p.oid) as result
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.pronargs = 0 and p.prorettype <> 'trigger'::regtype
  order by p.proname`);

const scalar = (udt) => {
  if (['int2', 'int4', 'int8', 'float4', 'float8', 'numeric'].includes(udt)) return 'number';
  if (udt === 'bool') return 'boolean';
  if (['json', 'jsonb'].includes(udt)) return 'Json';
  if (['uuid', 'text', 'varchar', 'bpchar', 'date', 'time', 'timetz', 'timestamp', 'timestamptz', 'interval'].includes(udt)) return 'string';
  return 'unknown';
};
const tsType = (col) => (col.data_type === 'ARRAY' ? `${scalar(col.udt_name.replace(/^_/, ''))}[]` : scalar(col.udt_name));

const byTable = new Map();
for (const c of columns) {
  if (!byTable.has(c.table_name)) byTable.set(c.table_name, { type: c.table_type, cols: [] });
  byTable.get(c.table_name).cols.push(c);
}

const indent = (n) => ' '.repeat(n);
const relationships = (table, pad) => {
  const list = fks.filter((f) => f.table_name === table);
  if (!list.length) return '[]';
  return `[\n${list
    .map(
      (f) =>
        `${indent(pad + 2)}{\n${indent(pad + 4)}foreignKeyName: "${f.conname}"\n${indent(pad + 4)}columns: [${f.columns.map((c) => `"${c}"`).join(', ')}]\n${indent(pad + 4)}isOneToOne: ${f.one_to_one}\n${indent(pad + 4)}referencedRelation: "${f.referenced_table}"\n${indent(pad + 4)}referencedColumns: [${f.referenced_columns.map((c) => `"${c}"`).join(', ')}]\n${indent(pad + 2)}},`,
    )
    .join('\n')}\n${indent(pad)}]`;
};

const tables = [];
const views = [];
for (const [name, { type, cols }] of [...byTable.entries()].sort()) {
  const row = cols.map((c) => `          ${c.column_name}: ${tsType(c)}${c.is_nullable === 'YES' ? ' | null' : ''}`).join('\n');
  if (type === 'VIEW') {
    views.push(`      ${name}: {\n        Row: {\n${cols.map((c) => `          ${c.column_name}: ${tsType(c)} | null`).join('\n')}\n        }\n        Relationships: []\n      }`);
    continue;
  }
  const writable = (mode) =>
    cols
      .map((c) => {
        if (c.is_generated === 'ALWAYS') return `          ${c.column_name}?: never`;
        const optional = mode === 'update' || c.is_nullable === 'YES' || c.column_default !== null;
        return `          ${c.column_name}${optional ? '?' : ''}: ${tsType(c)}${c.is_nullable === 'YES' ? ' | null' : ''}`;
      })
      .join('\n');
  tables.push(
    `      ${name}: {\n        Row: {\n${row}\n        }\n        Insert: {\n${writable('insert')}\n        }\n        Update: {\n${writable('update')}\n        }\n        Relationships: ${relationships(name, 8)}\n      }`,
  );
}

const fnTypes = functions
  .map((f) => `      ${f.proname}: {\n        Args: Record<PropertyKey, never>\n        Returns: ${scalar({ boolean: 'bool' }[f.result] ?? f.result)}\n      }`)
  .join('\n');

const out = `// ⚠️ FICHIER GÉNÉRÉ — ne pas modifier à la main. Régénérer : npm run db:types
// Source : supabase/migrations/*.sql

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
${tables.join('\n')}
    }
    Views: {
${views.join('\n')}
    }
    Functions: {
${fnTypes}
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
`;

const target = 'src/integrations/supabase/database.types.ts';
writeFileSync(join(root, target), out);
console.log(`${target} : ${tables.length} tables, ${views.length} vue(s), ${functions.length} fonction(s)`);
await db.close();
