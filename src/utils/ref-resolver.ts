import { OpenAPISpec } from "@/types/openapi";

export class RefResolver {
  private spec: OpenAPISpec;
  private resolving: Set<string>;
  // Cache for resolved references to avoid repeated work
  private refCache: Map<string, any>;
  // Cache for resolved objects to avoid deep resolution of same objects
  private objectCache: WeakMap<any, any>;

  constructor(spec: OpenAPISpec) {
    this.spec = spec;
    this.resolving = new Set();
    this.refCache = new Map();
    this.objectCache = new WeakMap();
  }

  resolve<T = any>(item: any): T {
    if (!item || typeof item !== 'object') {
      return item;
    }

    // Check cache first
    if (this.objectCache.has(item)) {
      return this.objectCache.get(item);
    }

    if (item.$ref) {
      const resolved = this.resolveRef(item.$ref);
      // Cache the result
      this.objectCache.set(item, resolved);
      return resolved;
    }

    // For arrays, resolve only if they contain $ref
    if (Array.isArray(item)) {
      // Check if array contains any $ref - if not, return as is
      const hasRef = item.some(i => i && typeof i === 'object' && i.$ref);
      if (!hasRef) {
        this.objectCache.set(item, item);
        return item as any;
      }
      const resolved = item.map(i => this.resolve(i)) as any;
      this.objectCache.set(item, resolved);
      return resolved;
    }

    // For objects, check if they contain $ref in any nested property
    // If not, we can avoid deep resolution
    const hasNestedRef = this.hasNestedRef(item);
    if (!hasNestedRef) {
      this.objectCache.set(item, item);
      return item as any;
    }

    // Only deep resolve if there are nested refs
    const resolved: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (key === '$ref') continue;
      resolved[key] = this.resolve(value);
    }

    this.objectCache.set(item, resolved);
    return resolved;
  }

  // Check if object or its nested properties contain $ref
  // Optimized to only check immediate children to avoid deep traversal
  private hasNestedRef(obj: any, depth: number = 0): boolean {
    // Limit depth to avoid infinite recursion and performance issues
    if (depth > 3) return false;
    
    if (!obj || typeof obj !== 'object') return false;
    
    if (obj.$ref) return true;
    
    if (Array.isArray(obj)) {
      // For arrays, only check first few items to avoid performance issues
      const checkLimit = Math.min(obj.length, 10);
      for (let i = 0; i < checkLimit; i++) {
        if (this.hasNestedRef(obj[i], depth + 1)) {
          return true;
        }
      }
      return false;
    }
    
    // Check top-level properties only (not deep)
    // This is a performance optimization - we only check immediate children
    let checked = 0;
    const maxCheck = 20; // Limit number of properties to check
    
    for (const value of Object.values(obj)) {
      if (checked++ >= maxCheck) break; // Stop after checking maxCheck properties
      
      if (value && typeof value === 'object') {
        if (value.$ref) return true;
        // For nested objects, only check one level deeper
        if (depth < 2 && this.hasNestedRef(value, depth + 1)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private resolveRef(ref: string): any {
    // Check cache first
    if (this.refCache.has(ref)) {
      return this.refCache.get(ref);
    }

    // Prevent circular references
    if (this.resolving.has(ref)) {
      const circular = { $ref: ref, __circular: true };
      this.refCache.set(ref, circular);
      return circular;
    }

    this.resolving.add(ref);

    try {
      const parts = ref.split('/');
      
      if (parts[0] !== '#') {
        // External references not supported
        const external = { $ref: ref, __external: true };
        this.refCache.set(ref, external);
        return external;
      }

      let current: any = this.spec;
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (!current || typeof current !== 'object') {
          const notFound = { $ref: ref, __notFound: true };
          this.refCache.set(ref, notFound);
          return notFound;
        }
        current = current[part];
      }

      if (!current) {
        const notFound = { $ref: ref, __notFound: true };
        this.refCache.set(ref, notFound);
        return notFound;
      }

      // Recursively resolve nested refs
      const resolved = current.$ref ? this.resolveRef(current.$ref) : current;
      
      // Cache the resolved reference
      this.refCache.set(ref, resolved);
      
      return resolved;
    } finally {
      this.resolving.delete(ref);
    }
  }

  // Clear caches (useful when spec changes)
  clearCache(): void {
    this.refCache.clear();
    // WeakMap doesn't need clearing, but we can create a new one
    this.objectCache = new WeakMap();
  }

  // Helper to check if item has a $ref
  static hasRef(item: any): boolean {
    return item && typeof item === 'object' && '$ref' in item;
  }

  // Helper to get ref name from path
  static getRefName(ref: string): string {
    const parts = ref.split('/');
    return parts[parts.length - 1];
  }
}
