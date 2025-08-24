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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Send, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  RefreshCw
} from "lucide-react"
import { 
  type EmailTemplate 
} from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface EmailTemplateTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: EmailTemplate | null
}

export function EmailTemplateTestDialog({ 
  open, 
  onOpenChange, 
  template 
}: EmailTemplateTestDialogProps) {
  const [testEmail, setTestEmail] = useState('')
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [lastSent, setLastSent] = useState<string | null>(null)

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
            defaultValues[variable.name] = 'Test User'
            break
          case 'Email':
            defaultValues[variable.name] = testEmail || 'test@example.com'
            break
          case 'ResetURL':
            defaultValues[variable.name] = 'https://example.com/reset?token=test123'
            break
          case 'Year':
            defaultValues[variable.name] = new Date().getFullYear().toString()
            break
          default:
            defaultValues[variable.name] = `Test ${variable.name}`
        }
      })
      setVariableValues(defaultValues)
    }
  }, [template, testEmail])

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!template) {
      toast.error('No template selected')
      return
    }

    if (!testEmail.trim()) {
      toast.error('Please enter a test email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const response = await adminService.testEmailTemplate(template.id, {
        email: testEmail,
        variables: variableValues,
      })

      if (response.success || response.data) {
        toast.success(`Test email sent successfully to ${testEmail}`)
        setLastSent(new Date().toLocaleTimeString())
      } else {
        throw new Error('Failed to send test email')
      }
    } catch (error: any) {
      console.error('Error sending test email:', error)
      toast.error(error.response?.data?.message || 'Failed to send test email')
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
            defaultValues[variable.name] = 'Test User'
            break
          case 'Email':
            defaultValues[variable.name] = testEmail || 'test@example.com'
            break
          case 'ResetURL':
            defaultValues[variable.name] = 'https://example.com/reset?token=test123'
            break
          case 'Year':
            defaultValues[variable.name] = new Date().getFullYear().toString()
            break
          default:
            defaultValues[variable.name] = `Test ${variable.name}`
        }
      })
      setVariableValues(defaultValues)
      toast.success('Reset to default test values')
    }
  }

  if (!template) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>No template selected for testing</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Email: {template.name}
          </DialogTitle>
          <DialogDescription>
            Send a test email with sample data to verify your template
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendTest} className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Name:</span>
                <Badge variant="outline">{template.name}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Subject:</span>
                <span className="text-muted-foreground">{template.subject}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Status:</span>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Test Email Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Test Email Configuration</CardTitle>
              <CardDescription>
                Configure the recipient and test data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Recipient Email Address *</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The test email will be sent to this address
                </p>
              </div>

              {lastSent && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Last test email sent at {lastSent}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Variables */}
          {template.variables.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Test Variables
                  </span>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={resetToDefaults}
                    disabled={loading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </CardTitle>
                <CardDescription>
                  Customize the variable values for this test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.variables.map((variable) => (
                    <div key={variable.name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`var-${variable.name}`} className="text-xs font-medium">
                          {variable.name}
                        </Label>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {`{{.${variable.name}}}`}
                        </Badge>
                      </div>
                      <Input
                        id={`var-${variable.name}`}
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.description}
                        disabled={loading}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {variable.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Test Email Notice</p>
                  <p className="mt-1">
                    This will send a real email to the specified address using the current template configuration. 
                    Make sure the email address is correct and that you have permission to send test emails.
                  </p>
                </div>
              </div>
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
            <Button 
              type="submit" 
              disabled={loading || !testEmail.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}