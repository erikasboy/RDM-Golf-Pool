const express = require('express');
const app = express();
const port = 3001;

app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is working!' });
});

const server = app.listen(port, () => {
  console.log(`Simple server running at http://localhost:${port}`);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 