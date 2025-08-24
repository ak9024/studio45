import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Info,
  Code,
  FileText,
  User,
  Building,
  Calendar,
  Link,
  Hash
} from "lucide-react"

export function TemplateVariablesInfo() {
  const standardVariables = [
    {
      name: 'CompanyName',
      description: 'The name of the company sending the email',
      example: 'Studio45',
      icon: Building,
    },
    {
      name: 'UserName',
      description: 'The recipient\'s full name',
      example: 'John Doe',
      icon: User,
    },
    {
      name: 'Email',
      description: 'The recipient\'s email address',
      example: 'john.doe@example.com',
      icon: Hash,
    },
    {
      name: 'ResetURL',
      description: 'Password reset link (for password reset emails)',
      example: 'https://app.com/reset?token=abc123...',
      icon: Link,
    },
    {
      name: 'Year',
      description: 'Current year',
      example: '2025',
      icon: Calendar,
    },
  ]

  const templateSyntax = [
    {
      syntax: '{{.VariableName}}',
      description: 'Basic variable substitution',
      example: 'Hello {{.UserName}}!',
    },
    {
      syntax: '{{if .Variable}}...{{end}}',
      description: 'Conditional content (show only if variable exists)',
      example: '{{if .CompanyName}}<p>From: {{.CompanyName}}</p>{{end}}',
    },
    {
      syntax: '{{range .Items}}...{{end}}',
      description: 'Loop over array/slice variables',
      example: '{{range .OrderItems}}<li>{{.Name}}</li>{{end}}',
    },
    {
      syntax: '{{with .Variable}}...{{end}}',
      description: 'Set context to a variable',
      example: '{{with .User}}<p>Welcome {{.Name}}!</p>{{end}}',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Template Syntax Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Template Syntax Guide
          </CardTitle>
          <CardDescription>
            Email templates use Go's template syntax for dynamic content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templateSyntax.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {item.syntax}
                </Badge>
                <span className="text-sm font-medium">{item.description}</span>
              </div>
              <div className="ml-2 p-3 bg-gray-50 rounded-lg">
                <code className="text-xs text-gray-700">{item.example}</code>
              </div>
              {index < templateSyntax.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Standard Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Standard Variables
          </CardTitle>
          <CardDescription>
            Commonly used variables across different email templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {standardVariables.map((variable) => {
              const IconComponent = variable.icon
              return (
                <div key={variable.name} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <IconComponent className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {`{{.${variable.name}}}`}
                      </Badge>
                      <span className="font-medium text-sm">{variable.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{variable.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Example:</span>
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {variable.example}
                      </code>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-blue-800 space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Always provide both HTML and text versions of your templates for maximum compatibility</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Use descriptive variable names that clearly indicate their purpose</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Include fallback content for optional variables using conditional syntax</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Test your templates with various data scenarios before making them active</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Keep email content concise and mobile-friendly</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Use semantic HTML structure for better accessibility and rendering</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Info className="h-5 w-5" />
            Security & Escaping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-amber-800 space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>HTML templates automatically escape variables to prevent XSS attacks</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Text templates don't perform HTML escaping - they're safe by design</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Only trusted administrators should have access to template management</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <p>Always validate template syntax before saving to prevent rendering errors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}