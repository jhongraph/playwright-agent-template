import * as fs from 'node:fs';
import * as path from 'node:path';

const DATA_FILE = path.resolve(__dirname, '../data/test-data.json');

/**
 * Consume el siguiente item disponible del pool indicado.
 * Lo mueve de available[key] → used[key] y persiste el cambio en disco.
 * Lanza error si el pool está vacío.
 */
export function consumeItem(key: string): string {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  if (!data.available[key] || data.available[key].length === 0) {
    throw new Error(
      `Pool '${key}' vacío. Agrega más items a ${DATA_FILE}.`
    );
  }

  const item: string = data.available[key].shift();
  data.used[key] = data.used[key] ?? [];
  data.used[key].push(item);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  return item;
}

/** Devuelve cuántos items quedan disponibles en el pool. */
export function poolSize(key: string): number {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  return data.available[key]?.length ?? 0;
}
