import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Eye, 
  Code, 
  Type, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Settings
} from "lucide-react"
import { 
  type EmailTemplate,
  type PreviewEmailTemplateResponse 
} from "@/types/api.types"
import { adminService } from "@/services/api"

interface EmailTemplatePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: EmailTemplate | null
}

export function EmailTemplatePreviewDialog({ 
  open, 
  onOpenChange, 
  template 
}: EmailTemplatePreviewDialogProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<PreviewEmailTemplateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      // Initialize variable values with sample data
      const defaultValues: Record<string, string> = {}
      template.variables.forEach(variable => {
        switch (variable.name) {
          case 'CompanyName':
            defaultValues[variable.name] = 'Studio45'
            break
          case 'UserName':
            defaultValues[variable.name] = 'John Doe'
            break
          case 'Email':
            defaultValues[variable.name] = 'john.doe@example.com'
            break
          case 'ResetURL':
            defaultValues[variable.name] = 'https://example.com/reset?token=abc123'
            break
          case 'Year':
            defaultValues[variable.name] = new Date().getFullYear().toString()
            break
          default:
            defaultValues[variable.name] = `Sample ${variable.name}`
        }
      })
      setVariableValues(defaultValues)
    }
  }, [template])

  useEffect(() => {
    if (template && Object.keys(variableValues).length > 0) {
      generatePreview()
    }
  }, [template, variableValues])

  const generatePreview = async () => {
    if (!template) return

    setLoading(true)
    setError(null)

    try {
      const response = await adminService.previewEmailTemplate(template.id, {
        variables: variableValues,
      })

      // Handle different possible response formats
      console.log('Preview API response:', response)
      
      let previewData = null
      const responseAny = response as any
      
      // Check if response has the preview data directly (backend returns raw data)
      if (responseAny && responseAny.subject && responseAny.html_content) {
        previewData = responseAny
      }
      // Check if wrapped in ApiResponse format with data field
      else if (response && response.data) {
        const data = response.data as any
        if (data && data.subject) {
          previewData = data
        }
      }
      // Check if wrapped in success structure
      else if (response && response.success && response.data) {
        const data = response.data as any
        if (data && data.subject) {
          previewData = data
        }
      }
      // Handle case where response might be the direct preview object
      else if (responseAny && typeof responseAny === 'object') {
        // Look for preview properties at any level
        if (responseAny.subject || responseAny.html_content) {
          previewData = responseAny
        }
      }
      
      if (previewData) {
        setPreview(previewData)
      } else {
        console.warn('Could not extract preview data from response:', response)
        throw new Error('Invalid preview response format')
      }
    } catch (error: any) {
      console.error('Error generating preview:', error)
      console.error('Full error details:', error.response)
      setError(error.response?.data?.message || error.message || 'Failed to generate preview')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }))
  }

  const resetToDefaults = () => {
    if (template) {
      const defaultValues: Record<string, string> = {}
      template.variables.forEach(variable => {
        switch (variable.name) {
          case 'CompanyName':
            defaultValues[variable.name] = 'Studio45'
            break
          case 'UserName':
            defaultValues[variable.name] = 'John Doe'
            break
          case 'Email':
            defaultValues[variable.name] = 'john.doe@example.com'
            break
          case 'ResetURL':
            defaultValues[variable.name] = 'https://example.com/reset?token=abc123'
            break
          case 'Year':
            defaultValues[variable.name] = new Date().getFullYear().toString()
            break
          default:
            defaultValues[variable.name] = `Sample ${variable.name}`
        }
      })
      setVariableValues(defaultValues)
    }
  }

  if (!template) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Email Template</DialogTitle>
            <DialogDescription>No template selected for preview</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Email Template: {template.name}
          </DialogTitle>
          <DialogDescription>
            Customize variable values to see how your template will render
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Variables Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Template Variables
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetToDefaults}
                    disabled={loading}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Adjust values to customize the preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.variables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No variables defined for this template
                  </p>
                ) : (
                  template.variables.map((variable) => (
                    <div key={variable.name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={variable.name} className="text-xs font-medium">
                          {variable.name}
                        </Label>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {`{{.${variable.name}}}`}
                        </Badge>
                      </div>
                      <Input
                        id={variable.name}
                        size={20}
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.description}
                        disabled={loading}
                        className="text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        {variable.description}
                      </p>
                    </div>
                  ))
                )}

                <div className="pt-4">
                  <Button 
                    onClick={generatePreview}
                    disabled={loading}
                    size="sm"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-3 w-3" />
                        Update Preview
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-4 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Preview Error</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardHeader>
                  <Skeleton className="h-4 w-[200px]" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            )}

            {!loading && !error && preview && (
              <div className="space-y-4">
                {/* Subject Preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Email Subject
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium bg-gray-50 p-3 rounded border">
                      {preview.subject}
                    </p>
                  </CardContent>
                </Card>

                {/* Content Preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Email Content Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="html" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="html" className="flex items-center gap-2">
                          <Type className="h-3 w-3" />
                          HTML Version
                        </TabsTrigger>
                        <TabsTrigger value="text" className="flex items-center gap-2">
                          <Code className="h-3 w-3" />
                          Text Version
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="html">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">HTML Preview:</Label>
                          <div className="border rounded-lg overflow-hidden">
                            <div 
                              className="p-4 bg-white min-h-[300px]"
                              dangerouslySetInnerHTML={{ __html: preview.html_content }}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="text">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Text Preview:</Label>
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <pre className="text-sm whitespace-pre-wrap font-mono">
                              {preview.text_content}
                            </pre>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {!loading && !error && !preview && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Eye className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No preview available
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Click "Update Preview" to generate a preview with your variables
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}