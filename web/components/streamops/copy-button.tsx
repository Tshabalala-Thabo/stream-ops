"use client"

import { Check, Copy } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

type CopyButtonProps = {
  value: string | null
  label?: string
}

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    if (!value) {
      return
    }

    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Button
      className="gap-2"
      disabled={!value}
      size="sm"
      type="button"
      variant="outline"
      onClick={handleCopy}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  )
}
