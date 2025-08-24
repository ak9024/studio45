import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
  ConnectionMode,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toPng, toJpeg, toSvg } from 'html-to-image'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Layout,
  RefreshCw,
  Download,
  Maximize2,
  Users,
  Shield,
  Key,
  BarChart3,
  Camera,
  FileImage,
  FileText,
  Copy,
  Network
} from 'lucide-react'

import { InteractiveUserNode } from './flow-nodes/InteractiveUserNode'
import { InteractiveRoleNode } from './flow-nodes/InteractiveRoleNode'
import { InteractivePermissionNode } from './flow-nodes/InteractivePermissionNode'

import { useRBACData } from '@/hooks/useRBACData'
import { calculateLayout, autoFitLayout, type LayoutType } from '@/utils/diagramLayout'

const nodeTypes: NodeTypes = {
  user: InteractiveUserNode,
  role: InteractiveRoleNode,
  permission: InteractivePermissionNode,
}

const edgeTypes: EdgeTypes = {}

interface RBACInteractiveDiagramProps {
  className?: string
  onNodeClick?: (nodeId: string, nodeType: string) => void
  onExport?: () => void
}

export function RBACInteractiveDiagram({ 
  className = "", 
  onNodeClick,
  onExport: _onExport 
}: RBACInteractiveDiagramProps) {
  const { diagramData, loading, error, refetch, getFilteredData, getHighlightedNodes } = useRBACData()
  const diagramRef = useRef<HTMLDivElement>(null)
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  // Filter and interaction states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState<'all' | 'user' | 'role' | 'permission'>('all')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedResourceType, setSelectedResourceType] = useState<string>('')
  const [layoutType, setLayoutType] = useState<LayoutType>('hierarchical')
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  
  // Statistics
  const statistics = diagramData.statistics

  // Get unique values for filters
  const uniqueRoles = useMemo(() => {
    return diagramData.nodes
      .filter(n => n.type === 'role')
      .map(n => ({ id: n.id.replace('role-', ''), name: n.data.label }))
  }, [diagramData.nodes])

  const uniqueResources = useMemo(() => {
    const resources = new Set<string>()
    diagramData.nodes
      .filter(n => n.type === 'permission')
      .forEach(n => {
        const permission = n.data.entity as any
        resources.add(permission.resource)
      })
    return Array.from(resources).sort()
  }, [diagramData.nodes])

  // Apply filters and layout
  useEffect(() => {
    console.log('🔄 useEffect triggered - diagramData:', {
      nodes: diagramData.nodes.length,
      edges: diagramData.edges.length,
      statistics: diagramData.statistics
    })
    
    if (diagramData.nodes.length === 0) {
      console.log('⚠️ No nodes in diagram data, skipping layout')
      return
    }

    // Apply filters
    const filters = {
      entityType: selectedEntityType !== 'all' ? selectedEntityType : undefined,
      searchTerm: searchTerm.trim(),
      roleId: selectedRoleId,
      resourceType: selectedResourceType
    }
    
    console.log('🔍 Applying filters:', filters)
    const filtered = getFilteredData(filters)
    console.log('✂️ Filtered data:', {
      nodes: filtered.nodes.length,
      edges: filtered.edges.length
    })
    
    // Apply layout
    const layoutNodes = calculateLayout(filtered.nodes, filtered.edges, layoutType, {
      width: 1200,
      height: 800,
      nodeSpacing: 180,
      levelSpacing: 300,
      padding: 50
    })

    // Add highlighting information
    const nodesWithHighlighting = layoutNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: highlightedNodes.includes(node.id),
        isSelected: selectedNodeId === node.id
      }
    }))

    // Update highlighted edges
    const edgesWithHighlighting = filtered.edges.map(edge => ({
      ...edge,
      animated: highlightedNodes.includes(edge.source) || highlightedNodes.includes(edge.target),
      style: {
        ...edge.style,
        strokeWidth: highlightedNodes.includes(edge.source) || highlightedNodes.includes(edge.target) ? 3 : 2,
        opacity: highlightedNodes.length > 0 ? 
          (highlightedNodes.includes(edge.source) || highlightedNodes.includes(edge.target) ? 1 : 0.3) : 1
      }
    }))

    console.log('🎨 Setting final nodes and edges:', {
      nodes: nodesWithHighlighting.length,
      edges: edgesWithHighlighting.length,
      highlighted: highlightedNodes.length,
      selected: selectedNodeId
    })
    
    setNodes(nodesWithHighlighting)
    setEdges(edgesWithHighlighting)
  }, [
    diagramData, 
    selectedEntityType, 
    searchTerm, 
    selectedRoleId, 
    selectedResourceType, 
    layoutType, 
    highlightedNodes, 
    selectedNodeId,
    getFilteredData,
    setNodes,
    setEdges
  ])

  // Node interaction handlers
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    const nodeId = node.id
    setSelectedNodeId(nodeId)
    
    // Get connected nodes for highlighting
    const highlighted = getHighlightedNodes(nodeId)
    setHighlightedNodes(highlighted.nodes)
    
    // Call external handler if provided
    if (onNodeClick) {
      onNodeClick(nodeId, node.type)
    }
  }, [getHighlightedNodes, onNodeClick])

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setHighlightedNodes([])
  }, [])

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedEntityType('all')
    setSelectedRoleId('')
    setSelectedResourceType('')
    setSelectedNodeId(null)
    setHighlightedNodes([])
  }

  // Auto-fit diagram to viewport
  const autoFit = () => {
    if (nodes.length === 0) return
    const fittedNodes = autoFitLayout(nodes as any[], 1200, 800)
    setNodes(fittedNodes)
  }

  // Export diagram as image
  const exportAsImage = async (format: 'png' | 'jpeg' | 'svg') => {
    if (!diagramRef.current) return

    setIsExporting(true)
    
    try {
      const diagramElement = diagramRef.current.querySelector('.react-flow') as HTMLElement
      if (!diagramElement) return

      let dataUrl: string
      const fileName = `rbac-diagram-${Date.now()}`

      switch (format) {
        case 'png':
          dataUrl = await toPng(diagramElement, {
            backgroundColor: '#ffffff',
            width: 1200,
            height: 800,
            pixelRatio: 2,
          })
          downloadImage(dataUrl, `${fileName}.png`)
          break
        
        case 'jpeg':
          dataUrl = await toJpeg(diagramElement, {
            backgroundColor: '#ffffff',
            width: 1200,
            height: 800,
            pixelRatio: 2,
          })
          downloadImage(dataUrl, `${fileName}.jpg`)
          break
          
        case 'svg':
          dataUrl = await toSvg(diagramElement, {
            backgroundColor: '#ffffff',
            width: 1200,
            height: 800,
          })
          downloadImage(dataUrl, `${fileName}.svg`)
          break
      }
    } catch (error) {
      console.error('Error exporting diagram:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const downloadImage = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = fileName
    link.click()
  }

  // Export diagram data as JSON
  const exportAsJSON = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        layoutType,
        totalNodes: nodes.length,
        totalEdges: edges.length,
        filters: {
          searchTerm,
          entityType: selectedEntityType,
          roleId: selectedRoleId,
          resourceType: selectedResourceType
        }
      },
      statistics,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          label: node.data.label,
          entity: node.data.entity,
          connections: node.data.connections,
          statistics: node.data.statistics
        }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type
      }))
    }

    const dataUrl = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `rbac-diagram-${Date.now()}.json`
    link.click()
  }

  // Copy diagram summary to clipboard
  const copyToClipboard = async () => {
    const summary = `RBAC Diagram Summary
Generated: ${new Date().toLocaleString()}
Layout: ${layoutType}

Statistics:
- Users: ${statistics.totalUsers}
- Roles: ${statistics.totalRoles}  
- Permissions: ${statistics.totalPermissions}
- Total Relationships: ${edges.length}

Current View:
- Visible Nodes: ${nodes.length}
- Search Filter: ${searchTerm || 'None'}
- Entity Filter: ${selectedEntityType}
- Role Filter: ${selectedRoleId || 'All'}
- Resource Filter: ${selectedResourceType || 'All'}
`

    try {
      await navigator.clipboard.writeText(summary)
      console.log('Diagram summary copied to clipboard')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }


  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            RBAC Relationship Diagram
          </CardTitle>
          <CardDescription>
            Interactive visualization of users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <BarChart3 className="h-5 w-5" />
            Error Loading RBAC Data
          </CardTitle>
          <CardDescription>
            Failed to load the RBAC relationship data needed for the diagram
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-red-100 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-600 font-medium mb-2">Error Details:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <div className="space-y-2">
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Loading Data
              </Button>
              <p className="text-xs text-gray-500">
                If the problem persists, check the browser console for more details
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check for empty data state
  const hasNoData = diagramData.statistics.totalUsers === 0 && 
                    diagramData.statistics.totalRoles === 0 && 
                    diagramData.statistics.totalPermissions === 0

  if (!loading && hasNoData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            RBAC Relationship Diagram
          </CardTitle>
          <CardDescription>
            Interactive visualization of users, roles, and permissions relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <Network className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">No RBAC Data Available</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                There are no users, roles, or permissions configured in the system yet. 
                Create some roles and permissions first to see the relationship diagram.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-4">
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              RBAC Relationship Diagram
            </CardTitle>
            <CardDescription>
              Interactive visualization of users, roles, and permissions relationships
            </CardDescription>
          </div>
          
          {/* Statistics */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {statistics.totalUsers} Users
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {statistics.totalRoles} Roles
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              {statistics.totalPermissions} Permissions
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search entities..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Entity Type Filter */}
          <Select value={selectedEntityType} onValueChange={(value: any) => setSelectedEntityType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="role">Roles</SelectItem>
              <SelectItem value="permission">Permissions</SelectItem>
            </SelectContent>
          </Select>

          {/* Role Filter */}
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Resource Filter */}
          <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Resources</SelectItem>
              {uniqueResources.map(resource => (
                <SelectItem key={resource} value={resource}>
                  {resource}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Layout Type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Layout className="mr-2 h-4 w-4" />
                Layout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Layout Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLayoutType('hierarchical')}>
                Hierarchical
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayoutType('circular')}>
                Circular
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayoutType('network')}>
                Network
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayoutType('compact')}>
                Compact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action buttons */}
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={autoFit}>
            <Maximize2 className="mr-2 h-4 w-4" />
            Auto Fit
          </Button>
          
          {/* Enhanced Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => exportAsImage('png')}>
                <FileImage className="mr-2 h-4 w-4" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAsImage('jpeg')}>
                <Camera className="mr-2 h-4 w-4" />
                Export as JPEG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAsImage('svg')}>
                <FileImage className="mr-2 h-4 w-4" />
                Export as SVG
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={exportAsJSON}>
                <FileText className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Summary
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Diagram */}
        <div 
          ref={diagramRef}
          className="border rounded-lg relative" 
          style={{ height: '700px' }}
        >
          {isExporting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Exporting diagram...</span>
              </div>
            </div>
          )}
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                switch (node.type) {
                  case 'user': return '#3b82f6'
                  case 'role': return '#10b981'  
                  case 'permission': return '#f59e0b'
                  default: return '#6b7280'
                }
              }}
            />
            
            {/* Enhanced Info Panel */}
            <Panel position="top-right">
              <Card className="w-72 bg-white/95 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Diagram Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Current View Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="font-medium text-blue-900">Visible Nodes</div>
                      <div className="text-blue-600">{nodes.length}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="font-medium text-green-900">Connections</div>
                      <div className="text-green-600">{edges.length}</div>
                    </div>
                  </div>

                  {/* Layout Info */}
                  <div className="pt-1 border-t">
                    <div className="text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Layout:</span>
                        <span className="font-medium capitalize">{layoutType}</span>
                      </div>
                      {searchTerm && (
                        <div className="flex justify-between mt-1">
                          <span>Search:</span>
                          <span className="font-medium">"{searchTerm}"</span>
                        </div>
                      )}
                      {selectedEntityType !== 'all' && (
                        <div className="flex justify-between mt-1">
                          <span>Filter:</span>
                          <span className="font-medium capitalize">{selectedEntityType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Node Details */}
                  {selectedNodeId && (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-gray-900 mb-1">Selected Node</div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs">
                          <div className="font-medium">
                            {nodes.find(n => n.id === selectedNodeId)?.data.label}
                          </div>
                          <div className="text-gray-500 capitalize">
                            {nodes.find(n => n.id === selectedNodeId)?.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connection Highlights */}
                  {highlightedNodes.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-gray-900 mb-1">
                        Highlighted Relationships
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <div className="text-xs text-orange-800">
                          {highlightedNodes.length - 1} connected node{highlightedNodes.length !== 2 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="text-xs font-medium text-gray-900 mb-1">Quick Actions</div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 px-2"
                        onClick={autoFit}
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 px-2"
                        onClick={clearFilters}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 px-2"
                        onClick={() => exportAsImage('png')}
                        disabled={isExporting}
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Panel>
          </ReactFlow>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Node Type Legend */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-200"></div>
                <span className="text-sm text-gray-700 font-medium">Users</span>
                <Badge variant="outline" className="text-xs">
                  {nodes.filter(n => n.type === 'user').length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-200"></div>
                <span className="text-sm text-gray-700 font-medium">Roles</span>
                <Badge variant="outline" className="text-xs">
                  {nodes.filter(n => n.type === 'role').length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-orange-200"></div>
                <span className="text-sm text-gray-700 font-medium">Permissions</span>
                <Badge variant="outline" className="text-xs">
                  {nodes.filter(n => n.type === 'permission').length}
                </Badge>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="text-xs text-gray-500 bg-white px-3 py-2 rounded border">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  Click nodes to highlight
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  Drag to reposition
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  Scroll to zoom
                </span>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedEntityType !== 'all' || selectedRoleId || selectedResourceType) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Active Filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {selectedEntityType !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {selectedEntityType}
                  </Badge>
                )}
                {selectedRoleId && (
                  <Badge variant="secondary" className="text-xs">
                    Role: {uniqueRoles.find(r => r.id === selectedRoleId)?.name}
                  </Badge>
                )}
                {selectedResourceType && (
                  <Badge variant="secondary" className="text-xs">
                    Resource: {selectedResourceType}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}