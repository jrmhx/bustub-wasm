import { DatabaseInterface } from "@/components/database-interface"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="pt-6">
        <DatabaseInterface />
      </div>
    </main>
  )
}
