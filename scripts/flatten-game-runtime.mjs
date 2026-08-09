import fs from 'node:fs';

const [input, output = input] = process.argv.slice(2);
if (!input) throw new Error('usage: node flatten-game-runtime.mjs <input> [output]');

const html = fs.readFileSync(input, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
if (!scriptMatch) throw new Error('inline script not found');
const source = scriptMatch[1];

function matchingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      for (i++; i < text.length; i++) {
        if (text[i] === '\\') i++;
        else if (text[i] === quote) break;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return i;
  }
  throw new Error(`unclosed function body at ${open}`);
}

const patterns = [
  { kind: 'declaration', regex: /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g },
  { kind: 'window', regex: /window\.([A-Za-z_$][\w$]*)\s*=\s*function\s*\([^)]*\)\s*\{/g },
];
const definitions = [];
for (const { kind, regex } of patterns) {
  for (const match of source.matchAll(regex)) {
    const start = match.index;
    const open = start + match[0].lastIndexOf('{');
    let end = matchingBrace(source, open) + 1;
    if (kind === 'window' && source[end] === ';') end++;
    definitions.push({ name: match[1], kind, start, end });
  }
}
definitions.sort((a, b) => a.start - b.start);

const byName = new Map();
for (const definition of definitions) {
  if (!byName.has(definition.name)) byName.set(definition.name, []);
  byName.get(definition.name).push(definition);
}

const keepPreviousForRuntimeCapture = new Set(['annualAwards', 'drawEmployee', 'migrate', 'openPerson']);
const remove = [];
for (const [name, items] of byName) {
  if (items.length < 2) continue;
  const keep = new Set([items.length - 1]);
  if (keepPreviousForRuntimeCapture.has(name)) keep.add(items.length - 2);
  items.forEach((item, index) => { if (!keep.has(index)) remove.push(item); });
}
remove.sort((a, b) => b.start - a.start);

let flattened = source;
for (const item of remove) {
  flattened = flattened.slice(0, item.start) + `/* retired ${item.name} implementation */` + flattened.slice(item.end);
}

const result = html.slice(0, scriptMatch.index) + `<script>${flattened}</script>` + html.slice(scriptMatch.index + scriptMatch[0].length);
fs.writeFileSync(output, result);
console.log(JSON.stringify({ definitions: definitions.length, removed: remove.length, bytesBefore: html.length, bytesAfter: result.length }));
