# Performance Optimization Fixes for LMI3 Frontend

## Immediate Fixes Needed:

### 1. Memoize Expensive Components
```jsx
// Add to Menu.jsx
const MemoizedMenuItem = React.memo(({ item, onAddToBasket }) => {
  // Component logic
});

// Add to adminOrders.jsx  
const MemoizedOrderCard = React.memo(({ order, onStatusChange }) => {
  // Component logic
});
```

### 2. Optimize useEffect Dependencies
```jsx
// Current problematic pattern in Menu.jsx:
useEffect(() => {
  fetchPlats()
}, []) // Missing dependencies

// Fixed version:
const fetchPlats = useCallback(async () => {
  // fetch logic
}, []);

useEffect(() => {
  fetchPlats()
}, [fetchPlats])
```

### 3. Implement React.lazy for Code Splitting
```jsx
// In App.jsx
const AdminOrders = lazy(() => import('./views/adminOrders'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));

function App() {
  return (
    <Suspense fallback={<CircularProgress />}>
      {/* Routes */}
    </Suspense>
  );
}
```

### 4. Optimize Socket.IO Usage
```jsx
// Create singleton socket instance
// src/utils/socket.js
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(config.WS_URL, {
      path: config.WS_PATH,
      forceNew: false,
      reconnection: true,
      timeout: 5000,
    });
  }
  return socket;
};
```

### 5. Add Data Caching
```jsx
// Simple cache implementation
const cache = new Map();

export const useCachedFetch = (url, ttl = 300000) => { // 5 min TTL
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      setLoading(false);
      return;
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        cache.set(url, { data, timestamp: Date.now() });
        setData(data);
        setLoading(false);
      });
  }, [url, ttl]);
  
  return { data, loading };
};
```

### 6. Reduce Bundle Size
```bash
# Remove redundant dependencies
npm uninstall @tanstack/react-table @tanstack/table-core
npm uninstall ag-grid-community ag-grid-enterprise ag-grid-react

# Use only Material-UI DataGrid which you already have
```

### 7. CSS Optimizations
- Move inline styles to CSS classes
- Reduce backdrop-filter usage (expensive)
- Use transform3d for better GPU acceleration
- Implement CSS containment

### 8. Virtual Scrolling for Large Lists
```jsx
// For Menu items and Order lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedMenuItems = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={200}
    itemData={items}
  >
    {MemoizedMenuItem}
  </List>
);
```

## Critical Performance Metrics to Monitor:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)  
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

## Tools for Performance Analysis:
1. React DevTools Profiler
2. Chrome DevTools Performance tab
3. Lighthouse audit
4. Bundle analyzer: `npm install --save-dev webpack-bundle-analyzer`
