import { type RBACNode, type RBACEdge } from '@/hooks/useRBACData'

export type LayoutType = 'hierarchical' | 'circular' | 'network' | 'compact'

export interface LayoutOptions {
  width: number
  height: number
  nodeSpacing: number
  levelSpacing: number
  padding: number
}

const defaultOptions: LayoutOptions = {
  width: 1200,
  height: 800,
  nodeSpacing: 180,
  levelSpacing: 300,
  padding: 50
}

export function calculateLayout(
  nodes: RBACNode[], 
  edges: RBACEdge[], 
  layoutType: LayoutType = 'hierarchical',
  options: Partial<LayoutOptions> = {}
): RBACNode[] {
  const opts = { ...defaultOptions, ...options }
  
  switch (layoutType) {
    case 'hierarchical':
      return hierarchicalLayout(nodes, edges, opts)
    case 'circular':
      return circularLayout(nodes, edges, opts)
    case 'network':
      return networkLayout(nodes, edges, opts)
    case 'compact':
      return compactLayout(nodes, edges, opts)
    default:
      return hierarchicalLayout(nodes, edges, opts)
  }
}

// Hierarchical Layout: Users -> Roles -> Permissions (left to right)
function hierarchicalLayout(nodes: RBACNode[], _edges: RBACEdge[], options: LayoutOptions): RBACNode[] {
  const { nodeSpacing, levelSpacing, padding } = options
  
  // Separate nodes by type
  const userNodes = nodes.filter(n => n.type === 'user')
  const roleNodes = nodes.filter(n => n.type === 'role')
  const permissionNodes = nodes.filter(n => n.type === 'permission')
  
  const layoutNodes: RBACNode[] = []
  
  // Position user nodes (left column)
  userNodes.forEach((node, index) => {
    layoutNodes.push({
      ...node,
      position: {
        x: padding,
        y: padding + (index * nodeSpacing)
      }
    })
  })
  
  // Position role nodes (middle column)
  roleNodes.forEach((node, index) => {
    layoutNodes.push({
      ...node,
      position: {
        x: padding + levelSpacing,
        y: padding + (index * nodeSpacing)
      }
    })
  })
  
  // Position permission nodes (right column)
  permissionNodes.forEach((node, index) => {
    layoutNodes.push({
      ...node,
      position: {
        x: padding + (levelSpacing * 2),
        y: padding + (index * nodeSpacing)
      }
    })
  })
  
  return layoutNodes
}

// Circular Layout: Roles in center, users and permissions around them
function circularLayout(nodes: RBACNode[], _edges: RBACEdge[], options: LayoutOptions): RBACNode[] {
  const { width, height } = options
  const centerX = width / 2
  const centerY = height / 2
  
  const userNodes = nodes.filter(n => n.type === 'user')
  const roleNodes = nodes.filter(n => n.type === 'role')
  const permissionNodes = nodes.filter(n => n.type === 'permission')
  
  const layoutNodes: RBACNode[] = []
  
  // Position role nodes in the center area
  const roleCenterRadius = Math.min(width, height) * 0.15
  roleNodes.forEach((node, index) => {
    const angle = (index / roleNodes.length) * 2 * Math.PI
    layoutNodes.push({
      ...node,
      position: {
        x: centerX + Math.cos(angle) * roleCenterRadius,
        y: centerY + Math.sin(angle) * roleCenterRadius
      }
    })
  })
  
  // Position user nodes in outer circle (left side)
  const userRadius = Math.min(width, height) * 0.35
  userNodes.forEach((node, index) => {
    const angle = (index / userNodes.length) * Math.PI + Math.PI // Left semicircle
    layoutNodes.push({
      ...node,
      position: {
        x: centerX + Math.cos(angle) * userRadius,
        y: centerY + Math.sin(angle) * userRadius
      }
    })
  })
  
  // Position permission nodes in outer circle (right side)  
  const permissionRadius = Math.min(width, height) * 0.35
  permissionNodes.forEach((node, index) => {
    const angle = (index / permissionNodes.length) * Math.PI // Right semicircle
    layoutNodes.push({
      ...node,
      position: {
        x: centerX + Math.cos(angle) * permissionRadius,
        y: centerY + Math.sin(angle) * permissionRadius
      }
    })
  })
  
  return layoutNodes
}

// Network Layout: Force-directed positioning based on connections
function networkLayout(nodes: RBACNode[], edges: RBACEdge[], options: LayoutOptions): RBACNode[] {
  const { width, height, padding } = options
  
  // Simple force-directed layout simulation
  const layoutNodes = nodes.map(node => ({
    ...node,
    position: {
      x: padding + Math.random() * (width - 2 * padding),
      y: padding + Math.random() * (height - 2 * padding)
    }
  }))
  
  // Run simple physics simulation
  for (let iteration = 0; iteration < 100; iteration++) {
    layoutNodes.forEach(node => {
      let fx = 0, fy = 0
      
      // Repulsion from all other nodes
      layoutNodes.forEach(other => {
        if (node.id !== other.id) {
          const dx = node.position.x - other.position.x
          const dy = node.position.y - other.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 1000 / (distance * distance)
          
          fx += (dx / distance) * force
          fy += (dy / distance) * force
        }
      })
      
      // Attraction to connected nodes
      edges.forEach(edge => {
        if (edge.source === node.id) {
          const target = layoutNodes.find(n => n.id === edge.target)
          if (target) {
            const dx = target.position.x - node.position.x
            const dy = target.position.y - node.position.y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = distance * 0.01
            
            fx += (dx / distance) * force
            fy += (dy / distance) * force
          }
        }
        
        if (edge.target === node.id) {
          const source = layoutNodes.find(n => n.id === edge.source)
          if (source) {
            const dx = source.position.x - node.position.x
            const dy = source.position.y - node.position.y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = distance * 0.01
            
            fx += (dx / distance) * force
            fy += (dy / distance) * force
          }
        }
      })
      
      // Apply forces with dampening
      node.position.x += fx * 0.1
      node.position.y += fy * 0.1
      
      // Keep nodes within bounds
      node.position.x = Math.max(padding, Math.min(width - padding, node.position.x))
      node.position.y = Math.max(padding, Math.min(height - padding, node.position.y))
    })
  }
  
  return layoutNodes
}

// Compact Layout: Minimize space usage while maintaining readability
function compactLayout(nodes: RBACNode[], _edges: RBACEdge[], options: LayoutOptions): RBACNode[] {
  const { nodeSpacing, padding } = options
  
  const userNodes = nodes.filter(n => n.type === 'user')
  const roleNodes = nodes.filter(n => n.type === 'role')  
  const permissionNodes = nodes.filter(n => n.type === 'permission')
  
  const layoutNodes: RBACNode[] = []
  const compactSpacing = nodeSpacing * 0.7 // Tighter spacing
  
  // Users column
  userNodes.forEach((node, index) => {
    layoutNodes.push({
      ...node,
      position: {
        x: padding,
        y: padding + (index * compactSpacing)
      }
    })
  })
  
  // Roles column (staggered to reduce visual overlap)
  roleNodes.forEach((node, index) => {
    layoutNodes.push({
      ...node,
      position: {
        x: padding + 250,
        y: padding + (index * compactSpacing) + (compactSpacing * 0.5)
      }
    })
  })
  
  // Permissions column
  permissionNodes.forEach((node, index) => {
    layoutNodes.push({
      ...node,
      position: {
        x: padding + 500,
        y: padding + (index * compactSpacing)
      }
    })
  })
  
  return layoutNodes
}

// Utility function to auto-fit layout to container
export function autoFitLayout(nodes: RBACNode[], containerWidth: number, containerHeight: number): RBACNode[] {
  if (nodes.length === 0) return nodes
  
  // Find current bounds
  const bounds = nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      maxX: Math.max(acc.maxX, node.position.x),
      minY: Math.min(acc.minY, node.position.y),
      maxY: Math.max(acc.maxY, node.position.y)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  )
  
  const currentWidth = bounds.maxX - bounds.minX
  const currentHeight = bounds.maxY - bounds.minY
  
  if (currentWidth === 0 || currentHeight === 0) return nodes
  
  // Calculate scale to fit with padding
  const padding = 50
  const availableWidth = containerWidth - 2 * padding
  const availableHeight = containerHeight - 2 * padding
  
  const scaleX = availableWidth / currentWidth
  const scaleY = availableHeight / currentHeight
  const scale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down
  
  // Apply scaling and centering
  return nodes.map(node => ({
    ...node,
    position: {
      x: padding + (node.position.x - bounds.minX) * scale + (availableWidth - currentWidth * scale) / 2,
      y: padding + (node.position.y - bounds.minY) * scale + (availableHeight - currentHeight * scale) / 2
    }
  }))
}