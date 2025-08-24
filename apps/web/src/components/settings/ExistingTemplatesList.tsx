import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Search, 
  Eye, 
  Copy, 
  Edit,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type EmailTemplate } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface ExistingTemplatesListProps {
  currentTemplateId?: string // Exclude this template from the list
  onCloneTemplate?: (template: EmailTemplate) => void
  onEditTemplate?: (template: EmailTemplate) => void
  onPreviewTemplate?: (template: EmailTemplate) => void
  className?: string
}

export function ExistingTemplatesList({
  currentTemplateId,
  onCloneTemplate,
  onEditTemplate,
  onPreviewTemplate,
  className = "",
}: ExistingTemplatesListProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, statusFilter, currentTemplateId])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminService.getEmailTemplates()
      
      let templatesData: EmailTemplate[] = []
      if (response) {
        const data = (response as any)?.templates || 
                     (response as any).data?.templates || 
                     (response as any).data || 
                     response
        
        if (Array.isArray(data)) {
          templatesData = data
        } else {
          console.warn('Unexpected templates response format:', response)
        }
      }
      
      setTemplates(templatesData)
    } catch (error: any) {
      console.error('Error loading templates:', error)
      setError('Failed to load existing templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates.filter(template => {
      // Exclude current template being edited
      if (currentTemplateId && template.id === currentTemplateId) {
        return false
      }
      
      // Search filter
      const matchesSearch = searchTerm === "" || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && template.is_active) ||
        (statusFilter === "inactive" && !template.is_active)
      
      return matchesSearch && matchesStatus
    })
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    setFilteredTemplates(filtered)
  }

  const handleClone = (template: EmailTemplate) => {
    if (onCloneTemplate) {
      onCloneTemplate(template)
      toast.success(`Cloned template: ${template.name}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary"
  }

  const activeCount = templates.filter(t => t.is_active && t.id !== currentTemplateId).length
  const inactiveCount = templates.filter(t => !t.is_active && t.id !== currentTemplateId).length
  const totalCount = templates.filter(t => t.id !== currentTemplateId).length

  if (loading && templates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Existing Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Existing Templates
                  {totalCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {totalCount}
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {totalCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Badge variant="default" className="text-xs px-1">
                      {activeCount}
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-1">
                      {inactiveCount}
                    </Badge>
                  </div>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CardDescription className="text-xs">
            {isOpen 
              ? "Browse and clone existing email templates"
              : `${totalCount} templates available`
            }
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadTemplates}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}

            {totalCount > 0 && (
              <>
                {/* Search and Filter Controls */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2">
                        <Filter className="h-3 w-3 mr-1" />
                        {statusFilter === "all" ? "All" : statusFilter === "active" ? "Active" : "Inactive"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                        All Templates ({totalCount})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                        Active ({activeCount})
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                        Inactive ({inactiveCount})
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Templates List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-6">
                      <Mail className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500 mt-2">
                        {searchTerm || statusFilter !== "all" 
                          ? "No templates match your filters"
                          : "No templates found"
                        }
                      </p>
                    </div>
                  ) : (
                    filteredTemplates.map((template, index) => (
                      <div key={template.id}>
                        <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg group">
                          <div className="p-1.5 bg-blue-50 rounded">
                            <Mail className="h-3 w-3 text-blue-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {template.name}
                              </span>
                              <Badge 
                                variant={getStatusColor(template.is_active)}
                                className="text-xs px-1 py-0"
                              >
                                {template.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-600 truncate">
                              {template.subject}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(template.created_at)}
                              </span>
                              {template.variables.length > 0 && (
                                <span>
                                  {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onPreviewTemplate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onPreviewTemplate(template)}
                                className="h-7 w-7 p-0"
                                title="Preview template"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {onCloneTemplate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClone(template)}
                                className="h-7 w-7 p-0"
                                title="Clone template"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {onEditTemplate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditTemplate(template)}
                                className="h-7 w-7 p-0"
                                title="Edit template"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {index < filteredTemplates.length - 1 && (
                          <Separator className="my-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {totalCount === 0 && !loading && !error && (
              <div className="text-center py-6">
                <Mail className="mx-auto h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500 mt-2">
                  No email templates exist yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Create your first template to get started
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}