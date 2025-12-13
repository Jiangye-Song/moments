"use client"

import { useState, useEffect } from "react"
import { Construction, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/maintenance")
      const data = await res.json()
      setEnabled(data.enabled)
    } catch (error) {
      console.error("Failed to fetch maintenance status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMaintenance = async () => {
    setIsUpdating(true)
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      })
      
      if (!res.ok) {
        throw new Error("Failed to update")
      }
      
      const data = await res.json()
      setEnabled(data.enabled)
      toast.success(data.enabled ? "Maintenance mode enabled" : "Maintenance mode disabled")
    } catch (error) {
      toast.error("Failed to update maintenance mode")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className={enabled ? "border-amber-500/50" : ""}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Construction className={`h-5 w-5 ${enabled ? "text-amber-500" : "text-muted-foreground"}`} />
          <CardTitle className="text-lg">Maintenance Mode</CardTitle>
        </div>
        <CardDescription>
          When enabled, visitors will see a maintenance message instead of posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {enabled && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Maintenance mode is currently active. Visitors cannot see any posts.
                </p>
              </div>
            )}
            <Button
              variant={enabled ? "destructive" : "default"}
              onClick={toggleMaintenance}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : enabled ? (
                "Disable Maintenance Mode"
              ) : (
                "Enable Maintenance Mode"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
