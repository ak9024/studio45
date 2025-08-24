import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Info, Code, Type } from "lucide-react"
import { 
  type EmailTemplate, 
  type CreateEmailTemplateRequest, 
  type UpdateEmailTemplateRequest,
  type TemplateVariable 
} from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { ExistingTemplatesList } from "./ExistingTemplatesList"

interface EmailTemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: EmailTemplate | null
  onSuccess: () => void
  onPreviewTemplate?: (template: EmailTemplate) => void
  onEditTemplate?: (template: EmailTemplate) => void
}

export function EmailTemplateFormDialog({ 
  open, 
  onOpenChange, 
  template, 
  onSuccess,
  onPreviewTemplate,
  onEditTemplate
}: EmailTemplateFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_template: '',
    text_template: '',
    is_active: true,
  })
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [newVariable, setNewVariable] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const isEditMode = !!template

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        html_template: template.html_template || '',
        text_template: template.text_template || '',
        is_active: template.is_active ?? true,
      })
      setVariables(template.variables || [])
    } else {
      setFormData({
        name: '',
        subject: '',
        html_template: '',
        text_template: '',
        is_active: true,
      })
      setVariables([])
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.subject.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.html_template.trim() && !formData.text_template.trim()) {
      toast.error('Please provide at least one template format (HTML or Text)')
      return
    }

    setLoading(true)

    try {
      const requestData = {
        ...formData,
        variables,
      }

      if (isEditMode && template) {
        const response = await adminService.updateEmailTemplate(template.id, requestData as UpdateEmailTemplateRequest)
        if (response.success || response) {
          toast.success('Email template updated successfully')
          onSuccess()
          onOpenChange(false)
        }
      } else {
        const response = await adminService.createEmailTemplate(requestData as CreateEmailTemplateRequest)
        if (response.success || response) {
          toast.success('Email template created successfully')
          onSuccess()
          onOpenChange(false)
        }
      }
    } catch (error: any) {
      console.error('Error saving email template:', error)
      toast.error(error.response?.data?.message || 'Failed to save email template')
    } finally {
      setLoading(false)
    }
  }

  const handleAddVariable = () => {
    if (!newVariable.name.trim() || !newVariable.description.trim()) {
      toast.error('Please provide both variable name and description')
      return
    }

    if (variables.some(v => v.name === newVariable.name)) {
      toast.error('Variable name already exists')
      return
    }

    setVariables([...variables, newVariable])
    setNewVariable({ name: '', description: '' })
  }

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const generateDefaultTextTemplate = () => {
    if (formData.html_template && !formData.text_template) {
      // Simple HTML to text conversion
      const textContent = formData.html_template
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
      
      setFormData({ ...formData, text_template: textContent })
      toast.success('Generated text template from HTML')
    }
  }

  const handleCloneTemplate = (templateToClone: EmailTemplate) => {
    setFormData({
      name: `${templateToClone.name}_copy`,
      subject: templateToClone.subject,
      html_template: templateToClone.html_template,
      text_template: templateToClone.text_template,
      is_active: false, // New cloned templates start inactive
    })
    setVariables([...templateToClone.variables])
    toast.success(`Cloned template: ${templateToClone.name}`)
  }

  // HTML structure detection and enhancement
  const hasCompleteHTMLStructure = (htmlContent: string) => {
    if (!htmlContent.trim()) return false
    const content = htmlContent.toLowerCase()
    return (
      content.includes('<!doctype') &&
      content.includes('<html') &&
      content.includes('<head') &&
      content.includes('<body')
    )
  }

  const wrapWithHTMLStructure = (content: string) => {
    const wrappedContent = `<!DOCTYPE html>
<html>
<head>
  <title>{{.Subject}}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${content}
</body>
</html>`
    return wrappedContent
  }

  const addHTMLStructure = () => {
    if (formData.html_template && !hasCompleteHTMLStructure(formData.html_template)) {
      if (confirm('This will wrap your existing content with a complete HTML document structure including DOCTYPE, html, head, and body tags. Your existing content will be preserved. Continue?')) {
        const enhancedHTML = wrapWithHTMLStructure(formData.html_template)
        setFormData({ ...formData, html_template: enhancedHTML })
        toast.success('Added HTML structure to template')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Email Template' : 'Create New Email Template'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the email template configuration and content.'
              : 'Create a new email template with HTML and text formats.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Existing Templates - Only show when creating new templates */}
        {!isEditMode && (
          <>
            <ExistingTemplatesList
              currentTemplateId={template ? (template as EmailTemplate).id : undefined}
              onCloneTemplate={handleCloneTemplate}
              onPreviewTemplate={onPreviewTemplate}
              onEditTemplate={onEditTemplate}
              className="mb-6"
            />
            <Separator />
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., welcome_email, password_reset"
                disabled={loading}
                required
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => 
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={loading}
              />
              <Label htmlFor="is_active">Active Template</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Welcome to {{.CompanyName}}!"
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use Go template syntax for variables: <code>{"{{.VariableName}}"}</code>
            </p>
          </div>

          {/* Template Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Template Variables
              </CardTitle>
              <CardDescription>
                Define variables that can be used in your email templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.length > 0 && (
                <div className="space-y-2">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{variable.name}</Badge>
                        <span className="text-sm text-muted-foreground">{variable.description}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariable(index)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Variable name (e.g., CompanyName)"
                  value={newVariable.name}
                  onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                  disabled={loading}
                />
                <Input
                  placeholder="Description"
                  value={newVariable.description}
                  onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddVariable}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Template Syntax:</p>
                  <p>Use <code>{"{{.VariableName}}"}</code> to insert variables in your templates.</p>
                  <p>Example: <code>{"Hello {{.UserName}}, welcome to {{.CompanyName}}!"}</code></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Content */}
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
              <CardDescription>
                Provide both HTML and text versions of your email template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    HTML Template
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Text Template
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="html" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="html_template">HTML Template</Label>
                      <div className="flex gap-2">
                        {formData.html_template && !hasCompleteHTMLStructure(formData.html_template) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addHTMLStructure}
                            disabled={loading}
                          >
                            Add HTML Structure
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateDefaultTextTemplate}
                          disabled={loading || !formData.html_template}
                        >
                          Generate Text Version
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      id="html_template"
                      rows={12}
                      value={formData.html_template}
                      onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
                      placeholder="<!DOCTYPE html>
<html>
<head>
  <title>{{.Subject}}</title>
</head>
<body>
  <h1>Hello {{.UserName}}!</h1>
  <p>Welcome to {{.CompanyName}}!</p>
</body>
</html>"
                      disabled={loading}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text_template">Text Template</Label>
                    <Textarea
                      id="text_template"
                      rows={12}
                      value={formData.text_template}
                      onChange={(e) => setFormData({ ...formData, text_template: e.target.value })}
                      placeholder="Hello {{.UserName}}!

Welcome to {{.CompanyName}}!

Best regards,
The {{.CompanyName}} Team"
                      disabled={loading}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Separator />

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Template' : 'Create Template')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}