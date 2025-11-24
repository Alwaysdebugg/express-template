import { readFile } from 'fs/promises';
import { createServer } from 'http';

const server = createServer(async (req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    const html = await readFile('./public/index.html', 'utf-8');
    res.end(html);
  } else if (req.url === '/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const data = await readFile('data.json', 'utf-8');
    const jsonData = JSON.parse(data);
    res.end(JSON.stringify(jsonData));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Server is running on http://127.0.0.1:3000');
});
