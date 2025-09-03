// 简单的内存缓存
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  set(key: string, data: any, ttl: number = 300000) { // 默认5分钟
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  delete(key: string) {
    this.cache.delete(key);
  }
}

export const memoryCache = new MemoryCache();

// LocalStorage 缓存
export const localStorageCache = {
  set(key: string, data: any, ttl: number = 86400000) { // 默认24小时
    const item = {
      data,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get(key: string) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.data;
    } catch {
      return null;
    }
  },
  
  clear() {
    localStorage.clear();
  },
  
  delete(key: string) {
    localStorage.removeItem(key);
  },
};
