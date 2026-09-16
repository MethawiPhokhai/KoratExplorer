// Build the API, then run: node backend/tests/api.mjs /absolute/path/to/KoratExplorer.Api.dll
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

assert.ok(process.argv[2], 'Pass the path to the built API DLL.');
const contentRoot = await mkdtemp(join(tmpdir(), 'korat-api-test-'));
const dataPath = join(contentRoot, 'data', 'routes.json');
await mkdir(join(contentRoot, 'data'));
const routes = JSON.parse(await readFile(new URL('../data/routes.json', import.meta.url), 'utf8'));
await writeFile(dataPath, JSON.stringify(routes));
const api = spawn('dotnet', [resolve(process.argv[2]), '--contentRoot', contentRoot, '--urls', 'http://127.0.0.1:0'], {
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
try {
  const baseUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`API did not start: ${output}`)), 15000);
    api.on('error', error => { clearTimeout(timer); reject(error); });
    api.on('exit', code => { clearTimeout(timer); reject(new Error(`API exited ${code}: ${output}`)); });
    api.stderr.on('data', data => { output += data; });
    api.stdout.on('data', data => {
      output += data;
      const address = output.match(/Now listening on: (http:\/\/127\.0\.0\.1:\d+)/);
      if (address) { clearTimeout(timer); resolve(address[1]); }
    });
  });
  async function get(path, status = 200) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, status, path);
    assert.equal(response.headers.get('cache-control'), 'no-store', `${path} must not cache`);
    return response.json();
  }
  assert.deepEqual(await get('/api/health'), { status: 'ok' });
  assert.deepEqual(await get('/api/routes'), routes);
  const route = routes.find(route => route.number === '1');
  assert.ok(route, 'The canonical data must include route 1.');
  assert.deepEqual(await get('/api/routes/1'), route);
  assert.deepEqual(await get('/api/routes/does-not-exist', 404), { message: 'Route was not found.' });

  // Change only the isolated copy, while the same API process continues running.
  route.revision = 'api-test-updated-without-restart';
  route.notes = 'Edited source data must appear in both endpoints.';
  route.stops = [{ name: 'Unverified test stop', lat: null, lon: null, evidence: 'unverified' }];
  route.geometry = [[14.97, 102.1], [14.98, 102.11]];
  await writeFile(dataPath, JSON.stringify(routes));
  assert.deepEqual(await get('/api/routes/1'), route);
  assert.deepEqual(await get('/api/routes'), routes);
  console.log('API checks passed: health, canonical schema, route lookup, 404, no-store and edits without restart.');
} finally {
  if (api.exitCode === null && api.signalCode === null) {
    const closed = once(api, 'exit');
    api.kill('SIGTERM');
    await closed;
  }
  await rm(contentRoot, { recursive: true, force: true });
}
