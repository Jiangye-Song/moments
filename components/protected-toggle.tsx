"use client"

import { useState, useEffect } from "react"
import { Shield, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ProtectedToggle() {
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/protected-mode")
      const data = await res.json()
      setEnabled(data.enabled)
    } catch (error) {
      console.error("Failed to fetch protected mode status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProtected = async () => {
    setIsUpdating(true)
    try {
      const res = await fetch("/api/protected-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      })
      
      if (!res.ok) {
        throw new Error("Failed to update")
      }
      
      const data = await res.json()
      setEnabled(data.enabled)
      toast.success(data.enabled ? "Protected mode enabled" : "Protected mode disabled")
    } catch (error) {
      toast.error("Failed to update protected mode")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className={enabled ? "border-blue-500/50" : ""}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className={`h-5 w-5 ${enabled ? "text-blue-500" : "text-muted-foreground"}`} />
          <CardTitle className="text-lg">Protected Mode</CardTitle>
        </div>
        <CardDescription>
          When enabled, users can only see their own likes &amp; comments (or replies to their comments)
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
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Protected mode is active. Users can only see their own interactions and replies to their comments.
                </p>
              </div>
            )}
            <Button
              variant={enabled ? "destructive" : "default"}
              onClick={toggleProtected}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : enabled ? (
                "Disable Protected Mode"
              ) : (
                "Enable Protected Mode"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
