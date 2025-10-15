const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

const port = process.env.PORT || 3000;

// Proxy API and websocket/uploads requests to backend inside the docker network
const API_TARGET = process.env.API_TARGET || 'http://backend:3001';

app.use('/api', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: true,
  logLevel: 'silent'
}));

app.use('/socket.io', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: true,
  logLevel: 'silent'
}));

app.use('/uploads', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: false,
  logLevel: 'silent'
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// All remaining requests return the React app, so routing works client-side
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend static server running on port ${port}`);
});
