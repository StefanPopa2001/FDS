import { useState, useEffect, useCallback, useRef } from 'react';

// Simple in-memory cache with TTL
const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const isExpired = (timestamp, ttl) => {
  return Date.now() - timestamp > ttl;
};

export const useCachedFetch = (url, options = {}) => {
  const { 
    ttl = DEFAULT_TTL, 
    dependencies = [],
    skip = false 
  } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = url + JSON.stringify(dependencies);
    const cached = cache.get(cacheKey);
    
    if (cached && !isExpired(cached.timestamp, ttl)) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      };

      const response = await fetch(url, {
        headers,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      setData(result);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, ttl, skip, ...dependencies]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    const cacheKey = url + JSON.stringify(dependencies);
    cache.delete(cacheKey);
    fetchData();
  }, [fetchData, url, dependencies]);

  const invalidateCache = useCallback((pattern) => {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache,
  };
};

// Utility to clear all cache
export const clearAllCache = () => {
  cache.clear();
};

// Utility to clear expired entries
export const clearExpiredCache = () => {
  for (const [key, value] of cache.entries()) {
    if (isExpired(value.timestamp, DEFAULT_TTL)) {
      cache.delete(key);
    }
  }
};
