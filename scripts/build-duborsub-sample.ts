/**
 * Builds the Dub or Sub? demo catalogue sample (ADR-0006, SPEC F12).
 *
 * Usage:
 *   node scripts/build-duborsub-sample.ts <path-to-duborsub>/apps/anirate-base/backend/.data/catalog [count]
 *
 * Input is the owner's local (private) Dub or Sub? catalogue:
 *   - anime-catalogue.json: anime-offline-database (ODbL 1.0 + DbCL 1.0)
 *   - anilist-anime.json: AniList metadata (English/Japanese titles, genres, popularity, cover)
 * Output: src/demos/duborsub/data/sample.json (committed; the CI cannot see the private repo).
 *
 * Only factual catalogue fields are written. No ratings or dub flags: the demo's sample ratings are
 * computed and labelled at runtime by src/demos/duborsub/model.ts.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface CatalogueItem {
  title: string;
  anilistId: number | null;
  type: string;
  episodes: number | null;
  season: string | null;
  year: number | null;
  synonyms: string[] | string;
}
interface AniListItem {
  anilistId: number;
  titleEnglish: string | null;
  titleRomaji: string | null;
  titleNative: string | null;
  format: string;
  episodes: number | null;
  seasonYear: number | null;
  genres: string[];
  mainStudio: string | null;
  popularity: number | null;
  coverImageUrl: string | null;
}

const FORMATS = new Set(['TV', 'MOVIE', 'ONA', 'OVA']);
const [catalogArg, countArg] = process.argv.slice(2);
if (!catalogArg) {
  console.error('Usage: node scripts/build-duborsub-sample.ts <catalog-dir> [count]');
  process.exit(1);
}
const catalogDir: string = catalogArg;
const COUNT = Number(countArg ?? 240);
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/demos/duborsub/data/sample.json',
);

/** Short Latin-script synonyms are useful for search ("AoT", "SnK"); others are dropped. */
function searchSynonyms(raw: string[] | string): string[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.filter((s) => s.length <= 24 && /^[\x20-\x7e]+$/.test(s)).slice(0, 6);
}

async function main(): Promise<void> {
  const catalogue = JSON.parse(
    await readFile(join(catalogDir, 'anime-catalogue.json'), 'utf8'),
  ) as { source: unknown; items: CatalogueItem[] };
  const anilist = JSON.parse(await readFile(join(catalogDir, 'anilist-anime.json'), 'utf8')) as {
    items: AniListItem[];
  };

  const byAniList = new Map(
    catalogue.items.filter((c) => c.anilistId).map((c) => [c.anilistId, c] as const),
  );
  const ranked = anilist.items
    .filter(
      (a) => a.popularity && a.coverImageUrl && FORMATS.has(a.format) && byAniList.has(a.anilistId),
    )
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, COUNT);

  const items = ranked.flatMap((a, i) => {
    const c = byAniList.get(a.anilistId);
    if (!c) return []; // unreachable: ranked is pre-filtered to catalogue matches
    return {
      id: a.anilistId,
      rank: i + 1,
      title: c.title, // romaji, from the ODbL catalogue
      english: a.titleEnglish,
      native: a.titleNative,
      synonyms: searchSynonyms(c.synonyms),
      format: c.type,
      episodes: c.episodes ?? a.episodes,
      season: c.season,
      year: c.year ?? a.seasonYear,
      studio: a.mainStudio,
      genres: a.genres.slice(0, 4),
      cover: a.coverImageUrl,
    };
  });

  const out = {
    generatedAt: new Date().toISOString(),
    licence:
      'This sample is a derived database of anime-offline-database and is made available under the Open Database License (ODbL) v1.0; contents under the Database Contents License (DbCL) v1.0. English/Japanese titles, genres, studios and cover images: AniList and its contributors.',
    source: catalogue.source,
    count: items.length,
    items,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(out)}\n`, 'utf8');
  console.log(`✔ ${String(items.length)} titles → ${OUT}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
