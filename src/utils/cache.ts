import React, { useState, useEffect, useMemo } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Maximum number of cached items

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void { // Default 5 minutes TTL
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Create global cache instance
export const memoryCache = new MemoryCache();

// Hook for using cache with React components
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    dependencies?: any[];
  } = {}
) {
  const { ttl = 5 * 60 * 1000, enabled = true, dependencies = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the cache key based on dependencies
  const cacheKey = useMemo(() => {
    if (dependencies.length === 0) return key;
    return `${key}-${dependencies.map(dep => JSON.stringify(dep)).join('-')}`;
  }, [key, ...dependencies]);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      // Check cache first
      const cachedData = memoryCache.get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        return;
      }

      // If not in cache, fetch new data
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        setData(result);
        
        // Cache the result
        memoryCache.set(cacheKey, result, ttl);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cacheKey, enabled, ttl]);

  const invalidate = () => {
    memoryCache.clear(); // Clear all cache or just this key
    setData(null);
  };

  return { data, loading, error, invalidate };
}

// Utility functions for cache management
export const cacheUtils = {
  // Preload data into cache
  preload: async <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
    if (!memoryCache.has(key)) {
      try {
        const data = await fetcher();
        memoryCache.set(key, data, ttl);
      } catch (error) {
        console.warn('Failed to preload cache for key:', key, error);
      }
    }
  },

  // Invalidate specific cache key
  invalidate: (key: string) => {
    memoryCache.clear();
  },

  // Get cache statistics
  getStats: () => ({
    size: memoryCache.size(),
  }),

  // Clean up expired items
  cleanup: () => {
    memoryCache.cleanup();
  }
};

// Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 60 * 1000); // Cleanup every minute
}