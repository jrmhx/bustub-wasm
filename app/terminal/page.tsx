import { BusTubTerminal } from "@/components/terminal"

export default function TerminalPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">BusTub Terminal</h1>
        <p className="text-muted-foreground">
          Interactive database shell with full BusTub functionality
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)]">
        <BusTubTerminal className="h-full" />
      </div>
    </div>
  )
}
