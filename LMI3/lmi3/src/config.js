const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  WS_URL: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:3001',
  WS_PATH: '/socket.io'
};

export default config;
