const config = {
  API_URL: process.env.REACT_APP_API_URL || 
           (window.location.hostname === 'rudyetfanny.be' 
             ? 'https://rudyetfanny.be/api' 
             : 'http://localhost:3001'),
  
  // WebSocket URL configuration
  WS_URL: process.env.REACT_APP_WS_URL || 
          (window.location.hostname === 'rudyetfanny.be' 
            ? 'https://rudyetfanny.be' 
            : 'http://localhost:3001'),
            
  // WebSocket path configuration
  WS_PATH: window.location.hostname === 'rudyetfanny.be' 
           ? '/api/socket.io' 
           : '/socket.io'
};

export default config;
