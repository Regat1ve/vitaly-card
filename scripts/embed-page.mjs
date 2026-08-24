// Вшивает страницу визитки в сборку.
//
// Раньше её отдавал ServeStaticModule по пути на диске. В контейнере это работало,
// а на serverless сборка раскладывает файлы иначе, и главная отдавала 404. Одна
// HTML-страница не стоит статического файлового сервера и догадок о том, где она
// окажется: превращаем её в модуль и забываем про файловую систему в рантайме.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'public', 'index.html'), 'utf8');
const target = join(root, 'src', 'generated', 'page.ts');

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  '// Файл сгенерирован scripts/embed-page.mjs из public/index.html. Правьте исходник.\n' +
    `export const CARD_PAGE = ${JSON.stringify(html)};\n`,
  'utf8',
);

console.log(`Страница вшита: ${html.length} символов → src/generated/page.ts`);
