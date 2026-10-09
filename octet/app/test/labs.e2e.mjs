// The open lab, end to end in a browser: build a two-PC lab, ping across
// it, export it, open the file again, and play it as a student.
//
//   cargo build -p octet-api --features dev-server
//   node app/test/labs.e2e.mjs
//
// Needs Playwright (`npm i -g playwright`) and a Chromium it can launch.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const data = mkdtempSync(join(tmpdir(), 'octet-e2e-'));
const port = String(4300 + Math.floor(Math.random() * 500));
const server = spawn(join(root, 'target/debug/octet-dev'), { env: { ...process.env, OCTET_DATA: join(data, 'octet.json'), PORT: port }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok, fail) => { server.stdout.once('data', ok); server.once('exit', () => fail(new Error('the dev server stopped'))); });

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 860 }, acceptDownloads: true });
  page.on('pageerror', e => { throw e; });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
  const bench = page.locator('#bench');

  // A new lab opens the bench in build mode, with the drawer.
  await page.click('[data-go="labs"]');
  await page.click('[data-labact="new"]');
  await page.fill('#labNew input', 'Two PCs');
  await page.click('#labNew button[type="submit"]');
  await bench.locator('.dv[data-model="PC"]').first().waitFor();
  assert.equal(await bench.getAttribute('mode'), 'build');

  // Two PCs from the drawer, a crossover between them.
  await bench.locator('.dv[data-model="PC"]').click();
  await bench.locator('.dv[data-model="PC"]').click();
  await bench.locator('.dev[data-dev="PC-2"]').waitFor();
  await bench.locator('[data-cable="cross"]').click();
  await bench.locator('.port[data-dev="PC-1"][data-port="NIC"]').click();
  await bench.locator('.port[data-dev="PC-2"][data-port="NIC"]').click();
  assert.equal(await page.evaluate(() => document.querySelector('#bench').net.cables.filter(c => c.a && c.b).length), 1);

  // Addresses, from each PC's command prompt.
  for (const [pc, ip] of [['PC-1', '10.0.0.1'], ['PC-2', '10.0.0.2']]) {
    await bench.locator(`.dev[data-dev="${pc}"] .body`).first().dblclick();
    await bench.locator('.pcset input[name="ip"]').fill(ip);
    await bench.locator('.pcset input[name="mask"]').fill('255.255.255.0');
    await bench.locator('.pcset button').click();
    await bench.locator('.cclose').click();
  }

  // A task, written from the menus.
  await bench.locator('[data-btab="brief"]').click();
  await bench.locator('[data-act="add"]').click();
  await bench.locator('.task [data-v="to"]').fill('10.0.0.2');
  assert.equal(await bench.locator('.task [data-k="text"]').inputValue(), 'Ping 10.0.0.2 from PC-1.');
  await bench.locator('.task .st', { hasText: 'Not done' }).waitFor();

  // The ping works once the PCs have booted and linked. The bench clock runs
  // on animation frames, so wait for the state rather than a set time.
  await page.waitForFunction(() => { const n = document.querySelector('#bench').net; return ['PC-1', 'PC-2'].every(id => n.isOn(id) && n.device(id).ifs.FastEthernet0.proto); }, null, { timeout: 30000 });
  await bench.locator('.dev[data-dev="PC-1"] .body').first().dblclick();
  await bench.locator('.cin').fill('ping 10.0.0.2');
  await bench.locator('.cin').press('Enter');
  await bench.locator('.out', { hasText: 'Reply from 10.0.0.2' }).waitFor();
  await bench.locator('.task .st', { hasText: 'Done on the board now' }).waitFor();

  // Mark the start: two PCs, no cable yet, so a student has to cable them.
  await page.evaluate(() => { const b = document.querySelector('#bench'); b.net.remove(b.net.cables[0]); });
  await bench.locator('[data-act="start"]').click();
  await page.waitForTimeout(600); // the bench saves a moment after each change

  // Back to Labs: the card says what's in it. Export it.
  await bench.locator('.tb.back').click();
  const card = page.locator('[data-mine="two-pcs"]');
  await card.waitFor();
  assert.match(await card.textContent(), /2 devices, 1 task/);
  const [dl] = await Promise.all([page.waitForEvent('download'), card.locator('[data-labact="export"]').click()]);
  assert.equal(dl.suggestedFilename(), 'two-pcs.octet-lab');
  const file = join(data, 'shared.octet-lab');
  await dl.saveAs(file);

  // Open the file: it lands under Opened from files, as a new lab.
  await page.setInputFiles('#labFile', file);
  const shared = page.locator('[data-mine="two-pcs-2"]');
  await shared.waitFor();
  await shared.locator('[data-labact="play"]').click();
  await bench.locator('.brief .count', { hasText: '0 of 1 done' }).waitFor();
  assert.notEqual(await bench.getAttribute('mode'), 'build');
  assert.equal(await page.evaluate(() => document.querySelector('#bench').net.devices.length), 2);
  assert.equal(await page.evaluate(() => document.querySelector('#bench').net.cables.length), 0, 'the start has no cable');
  assert.equal(await bench.locator('.dv').count() === 0 || !(await bench.locator('.drawer').isVisible()), true, 'no drawer for a student');

  // Try it as a student starts from the start; Back to building returns
  // to the board as you left it, and trying saves nothing.
  await page.click('[data-go="labs"]');
  await page.locator('[data-mine="two-pcs"] [data-labact="build"]').click();
  await bench.locator('.dev[data-dev="PC-2"]').waitFor();
  await bench.locator('[data-cable="cross"]').click();
  await bench.locator('.port[data-dev="PC-1"][data-port="NIC"]').click();
  await bench.locator('.port[data-dev="PC-2"][data-port="NIC"]').click();
  await bench.locator('[data-btab="brief"]').click();
  await bench.locator('[data-act="try"]').click();
  assert.equal(await bench.getAttribute('mode'), 'try');
  assert.equal(await page.evaluate(() => document.querySelector('#bench').net.cables.length), 0);
  await bench.locator('.tb.edit').click();
  assert.equal(await page.evaluate(() => document.querySelector('#bench').net.cables.length), 1);

  // Rename from the device's menu; the task follows.
  await bench.locator('.dev[data-dev="PC-1"] .body').first().click({ button: 'right', force: true });
  await bench.locator('.menu button', { hasText: 'Rename' }).click();
  await bench.locator('.menu input').fill('ALICE');
  await bench.locator('.menu input').press('Enter');
  await bench.locator('.dev[data-dev="ALICE"]').waitFor();
  assert.equal(await bench.locator('.task [data-v="device"]').inputValue(), 'ALICE');
  await page.waitForTimeout(600);
  await bench.locator('.tb.back').click();
  await page.locator('[data-mine="two-pcs"]').waitFor();
  const def = await page.evaluate(async () => (await fetch('/api/lab_def', { method: 'POST', body: JSON.stringify({ id: 'two-pcs', mine: true }) })).json());
  assert.deepEqual(def.board.devices.map(d => d.id), ['ALICE', 'PC-2']);
  assert.equal(def.lab.task[0].check.pinged.from, 'ALICE');
  assert.equal(def.state, null, 'trying it saved no progress');

  // A broken file is refused with what's wrong.
  await page.click('[data-go="labs"]');
  await page.setInputFiles('#labFile', { name: 'bad.octet-lab', mimeType: 'application/json', buffer: Buffer.from('{"format":1,"title":"Bad","start":{"devices":[{"id":"R1","model":"C9300"}]}}') });
  await page.locator('#toast', { hasText: 'C9300' }).waitFor();
  console.log('labs e2e: all checks passed');
} finally {
  await browser.close();
  server.kill();
  rmSync(data, { recursive: true, force: true });
}
