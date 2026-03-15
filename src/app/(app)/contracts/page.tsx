import { Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ContractsPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-6 py-16">
          <div className="rounded-full bg-muted p-6">
            <Wrench className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-semibold">Contracts</h1>
            <p className="text-xl font-semibold text-primary">Coming Soon</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Contract management features are on their way.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
