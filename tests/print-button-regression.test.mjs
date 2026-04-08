import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const pageCanvasCssPath =
  new URL('../src/components/PageCanvas/PageCanvas.module.css', import.meta.url);
const pageCanvasTsxPath =
  new URL('../src/components/PageCanvas/PageCanvas.tsx', import.meta.url);

test('screen styles keep the print layer mounted instead of display:none', async () => {
  const css = await readFile(pageCanvasCssPath, 'utf8');

  assert.ok(
    !css.includes('.printLayer {\n  display: none;\n}'),
    'print layer should stay mounted on screen so print images preload'
  );
  assert.ok(
    css.includes('opacity: 0;'),
    'print layer should be visually hidden on screen without removing it from layout'
  );
  assert.ok(
    css.includes('pointer-events: none;'),
    'print layer should not interfere with the interactive editor while preloading'
  );
});

test('print-only images are requested eagerly', async () => {
  const tsx = await readFile(pageCanvasTsxPath, 'utf8');

  assert.ok(
    tsx.includes('loading="eager"'),
    'print layer images should request eagerly so the print dialog opens without waiting on hidden assets'
  );
});
