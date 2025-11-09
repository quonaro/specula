import { OpenAPISpec } from "@/types/openapi";

export class RefResolver {
  private spec: OpenAPISpec;
  private resolving: Set<string>;

  constructor(spec: OpenAPISpec) {
    this.spec = spec;
    this.resolving = new Set();
  }

  resolve<T = any>(item: any): T {
    if (!item || typeof item !== 'object') {
      return item;
    }

    if (item.$ref) {
      return this.resolveRef(item.$ref);
    }

    // Deep resolve objects and arrays
    if (Array.isArray(item)) {
      return item.map(i => this.resolve(i)) as any;
    }

    const resolved: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (key === '$ref') continue;
      resolved[key] = this.resolve(value);
    }

    return resolved;
  }

  private resolveRef(ref: string): any {
    // Prevent circular references
    if (this.resolving.has(ref)) {
      return { $ref: ref, __circular: true };
    }

    this.resolving.add(ref);

    try {
      const parts = ref.split('/');
      
      if (parts[0] !== '#') {
        // External references not supported
        return { $ref: ref, __external: true };
      }

      let current: any = this.spec;
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (!current || typeof current !== 'object') {
          return { $ref: ref, __notFound: true };
        }
        current = current[part];
      }

      if (!current) {
        return { $ref: ref, __notFound: true };
      }

      // Recursively resolve nested refs
      const resolved = current.$ref ? this.resolveRef(current.$ref) : current;
      return resolved;
    } finally {
      this.resolving.delete(ref);
    }
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
