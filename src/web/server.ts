import http from 'http';
import { renderTutorialPage } from './tutorialPage';

function sendHtml(res: http.ServerResponse, statusCode: number, html: string): void {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(html);
}

function sendJson(res: http.ServerResponse, payload: unknown): void {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function startWebServer(): void {
  const port = Number(process.env.PORT ?? 3000);
  const page = renderTutorialPage();

  const server = http.createServer((req, res) => {
    const url = req.url ?? '/';

    if (url === '/' || url === '/tutorial') {
      sendHtml(res, 200, page);
      return;
    }

    if (url === '/health') {
      sendJson(res, { ok: true, service: 'sesepuh-bot', page: '/tutorial' });
      return;
    }

    sendHtml(
      res,
      404,
      '<!doctype html><html><body style="font-family:Segoe UI;padding:24px;background:#313338;color:#f2f3f5">Halaman tidak ditemukan. Coba buka <a href="/tutorial" style="color:#5865f2">/tutorial</a>.</body></html>'
    );
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Web] Tutorial page running on port ${port}`);
  });
}
