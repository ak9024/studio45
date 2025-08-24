import { createContext, useContext } from "react"
import type { ReactNode } from "react"

interface CollapsibleContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = createContext<CollapsibleContextType | null>(null)

interface CollapsibleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

const Collapsible = ({ open, onOpenChange, children }: CollapsibleProps) => {
  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange }}>
      <div>{children}</div>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps {
  asChild?: boolean
  children: ReactNode
}

const CollapsibleTrigger = ({ children }: CollapsibleTriggerProps) => {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within a Collapsible')
  }

  return <div>{children}</div>
}

interface CollapsibleContentProps {
  children: ReactNode
}

const CollapsibleContent = ({ children }: CollapsibleContentProps) => {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error('CollapsibleContent must be used within a Collapsible')
  }

  if (!context.open) {
    return null
  }

  return <div>{children}</div>
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }