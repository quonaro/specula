import type { TagNode, SpecWithSource } from '@/types/openapi'
import { checkOperationPrivacy } from './operation-cache'

/**
 * Filter TagNode tree based on security and method filters
 */
export function filterTagNodeBySecurityAndMethods(
  node: TagNode,
  securityFilter: 'all' | 'private' | 'public',
  selectedMethods: Set<string>,
  specs: SpecWithSource[]
): TagNode | null {
  // Filter operations
  const matchingOperations = node.operations.filter(op => {
    // Check method filter
    if (!selectedMethods.has(op.method)) {
      return false
    }
    
    // Check security filter
    if (securityFilter !== 'all') {
      const isPrivate = checkOperationPrivacy({ method: op.method, path: op.path }, specs)
      if (securityFilter === 'private' && !isPrivate) {
        return false
      }
      if (securityFilter === 'public' && isPrivate) {
        return false
      }
    }
    
    return true
  })
  
  // Filter children recursively
  const matchingChildren: Map<string, TagNode> = new Map()
  for (const [key, child] of node.children.entries()) {
    const filteredChild = filterTagNodeBySecurityAndMethods(
      child,
      securityFilter,
      selectedMethods,
      specs
    )
    if (filteredChild && (
      filteredChild.operations.length > 0 ||
      filteredChild.children.size > 0
    )) {
      matchingChildren.set(key, filteredChild)
    }
  }
  
  // If has matching operations or children, include it
  if (matchingOperations.length > 0 || matchingChildren.size > 0) {
    return {
      ...node,
      operations: matchingOperations,
      children: matchingChildren
    }
  }
  
  return null
}

