"use client"

import { useState } from "react"
import { User, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setUsername } from "@/lib/user"
import { useLanguage } from "@/lib/language-context"

interface UsernameDialogProps {
  open: boolean
  onComplete: (username: string) => void
  onCancel: () => void
}

type DialogState = "input" | "checking" | "warning"

export function UsernameDialog({ open, onComplete, onCancel }: UsernameDialogProps) {
  const { t } = useLanguage()
  const [name, setName] = useState("")
  const [dialogState, setDialogState] = useState<DialogState>("input")
  const [pendingName, setPendingName] = useState("")

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setDialogState("checking")
    setPendingName(trimmedName)

    try {
      const res = await fetch(`/api/username?username=${encodeURIComponent(trimmedName)}`)
      const data = await res.json()

      if (data.exists) {
        setDialogState("warning")
      } else {
        confirmUsername(trimmedName)
      }
    } catch (error) {
      console.error("Username check failed:", error)
      // On error, allow the user to proceed
      confirmUsername(trimmedName)
    }
  }

  const confirmUsername = (username: string) => {
    setUsername(username)
    onComplete(username)
    resetDialog()
  }

  const resetDialog = () => {
    setName("")
    setDialogState("input")
    setPendingName("")
  }

  const handleCancel = () => {
    resetDialog()
    onCancel()
  }

  const handleBackToInput = () => {
    setDialogState("input")
    // Keep the name so user can edit it
  }

  const handleContinueAnyway = () => {
    confirmUsername(pendingName)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[400px]">
        {dialogState === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-left gap-2">
                <User className="h-5 w-5 text-primary" />
                {t("welcome")}
              </DialogTitle>
              <DialogDescription className="items-left text-left gap-2">
                {t("enterNameToInteract")}
                <br />
                <span className="text-xs text-muted-foreground/80">{t("usernameTip")}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("yourName")}</Label>
                <Input
                  id="username"
                  placeholder={t("enterYourName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={!name.trim()}>
                {t("continue")}
              </Button>
            </div>
          </>
        )}

        {dialogState === "checking" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                {t("checking")}
              </DialogTitle>
              <DialogDescription>{t("verifyingName")}</DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            </div>
          </>
        )}

        {dialogState === "warning" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {t("nameAlreadyUsed")}
              </DialogTitle>
              <DialogDescription>
                <span className="font-semibold text-foreground">"{pendingName}"</span> {t("nameUsedBefore")}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("nameUsedDescription")}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBackToInput}>
                {t("chooseDifferentName")}
              </Button>
              <Button onClick={handleContinueAnyway}>
                {t("continueAnyway")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
