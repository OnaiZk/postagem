import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import os from 'os';

function serverSyncPlugin(): Plugin {
  const userRecordsFile = path.resolve(__dirname, 'src/data/user_records.json');
  const initialDataFile = path.resolve(__dirname, 'src/data/initialData.json');

  // In-memory set of SSE client responses
  const sseClients = new Set<any>();

  const broadcastSSE = (eventType: string, data: any) => {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(message);
      } catch (err) {
        sseClients.delete(client);
      }
    }
  };

  const getUserRecords = (): any[] => {
    try {
      if (fs.existsSync(userRecordsFile)) {
        const content = fs.readFileSync(userRecordsFile, 'utf-8');
        return JSON.parse(content || '[]');
      }
    } catch (e) {
      console.warn('Erro ao ler user_records.json:', e);
    }
    return [];
  };

  const saveUserRecords = (records: any[]) => {
    try {
      const dir = path.dirname(userRecordsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(userRecordsFile, JSON.stringify(records, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao salvar user_records.json:', e);
    }
  };

  const getMergedRecords = (): any[] => {
    const userRecs = getUserRecords();
    let initialRecs: any[] = [];
    try {
      if (fs.existsSync(initialDataFile)) {
        initialRecs = JSON.parse(fs.readFileSync(initialDataFile, 'utf-8') || '[]');
      }
    } catch (e) {
      console.warn('Erro ao ler initialData.json:', e);
    }

    const userRecMap = new Map<string, any>();
    const deletedIds = new Set<string>();

    for (const r of userRecs) {
      if (r._deleted) {
        deletedIds.add(r.id);
      } else {
        userRecMap.set(r.id, r);
      }
    }

    const merged: any[] = [];
    // First add all active user records
    for (const [_, r] of userRecMap) {
      merged.push(r);
    }
    // Then add initial records that were not overwritten or deleted
    for (const initR of initialRecs) {
      if (!userRecMap.has(initR.id) && !deletedIds.has(initR.id)) {
        merged.push(initR);
      }
    }

    // Deduplicate by signature to guarantee no duplicate rows
    const seenMap = new Map<string, any>();
    const deduplicated: any[] = [];

    const getSig = (r: any) => {
      const ano = (r.ano || '').trim();
      const proto = (r.protocolo_os_nf || '').trim().toLowerCase();
      const cli = (r.cliente || '').trim().toLowerCase();
      const camp = (r.campanha || '').trim().toLowerCase();
      const lay = String(r.layout || 1);
      const qtd = String(r.quantidade || 0);
      const data = (r.data || '').trim();
      return `${ano}|${proto}|${cli}|${camp}|${lay}|${qtd}|${data}`;
    };

    for (const r of merged) {
      const sig = getSig(r);
      if (!seenMap.has(sig)) {
        seenMap.set(sig, r);
        deduplicated.push(r);
      }
    }

    return deduplicated;
  };

  const getLocalIP = (): string => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal && alias.address.startsWith('192.168.')) {
          return alias.address;
        }
      }
    }
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal && !alias.address.startsWith('127.')) {
          return alias.address;
        }
      }
    }
    return '127.0.0.1';
  };

  return {
    name: 'server-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // 1. GET /api/network-info
        if (pathname === '/api/network-info' && req.method === 'GET') {
          const ip = getLocalIP();
          const port = 3000;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ip,
            port,
            localUrl: `http://localhost:${port}`,
            networkUrl: `http://${ip}:${port}`
          }));
          return;
        }

        // 2. GET /api/events (SSE)
        if (pathname === '/api/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });

          res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);
          sseClients.add(res);

          const heartbeat = setInterval(() => {
            try {
              res.write(': ping\n\n');
            } catch (err) {
              clearInterval(heartbeat);
              sseClients.delete(res);
            }
          }, 15000);

          req.on('close', () => {
            clearInterval(heartbeat);
            sseClients.delete(res);
          });
          return;
        }

        // 3. GET /api/records
        if (pathname === '/api/records' && req.method === 'GET') {
          const records = getMergedRecords();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(records));
          return;
        }

        // 4. POST /api/records (Create or update record)
        if (pathname === '/api/records' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const record = JSON.parse(body);
              if (!record || !record.id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Record id is required' }));
                return;
              }

              const userRecords = getUserRecords();
              const existingIndex = userRecords.findIndex((r) => r.id === record.id);
              if (existingIndex >= 0) {
                userRecords[existingIndex] = { ...userRecords[existingIndex], ...record, _deleted: false };
              } else {
                userRecords.unshift(record);
              }

              saveUserRecords(userRecords);
              broadcastSSE('record_saved', { record });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, record }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 5. POST /api/records/bulk (Bulk sync)
        if (pathname === '/api/records/bulk' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const { records } = JSON.parse(body);
              if (!Array.isArray(records)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'records array is required' }));
                return;
              }

              const userRecords = getUserRecords();
              const map = new Map<string, any>(userRecords.map((r) => [r.id, r]));

              for (const r of records) {
                if (r.id) {
                  map.set(r.id, { ...(map.get(r.id) || {}), ...r, _deleted: false });
                }
              }

              const updatedList = Array.from(map.values());
              saveUserRecords(updatedList);
              broadcastSSE('bulk_saved', { count: records.length });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: records.length }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 5.1 POST /api/records/sync-spreadsheet (Full replacement/sync of spreadsheet records)
        if (pathname === '/api/records/sync-spreadsheet' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const { records } = JSON.parse(body);
              if (!Array.isArray(records)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'records array is required' }));
                return;
              }

              // Salva nova base em initialData.json
              fs.writeFileSync(initialDataFile, JSON.stringify(records, null, 2), 'utf-8');

              // Limpa user_records para não ficar resíduo duplicado
              saveUserRecords([]);

              broadcastSSE('bulk_saved', { count: records.length });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: records.length }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 6. DELETE /api/records/:id
        if (pathname.startsWith('/api/records/') && req.method === 'DELETE') {
          const id = pathname.replace('/api/records/', '');
          const userRecords = getUserRecords();
          const existingIndex = userRecords.findIndex((r) => r.id === id);
          if (existingIndex >= 0) {
            userRecords[existingIndex]._deleted = true;
          } else {
            userRecords.push({ id, _deleted: true });
          }

          saveUserRecords(userRecords);
          broadcastSSE('record_deleted', { id });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, id }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serverSyncPlugin()],
  server: {
    host: true, // Listen on 0.0.0.0 so mobile phones on the Wi-Fi network can connect!
    port: 3000,
    open: false,
  }
});

