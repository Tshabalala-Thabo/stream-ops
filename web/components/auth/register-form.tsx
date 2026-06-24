"use client"

import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuth()
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await register({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
        passwordConfirmation: String(formData.get("passwordConfirmation") || ""),
      })

      router.replace(searchParams.get("redirectTo") || "/")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create account.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input autoComplete="name" id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="new-password"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordConfirmation">Confirm password</Label>
        <Input
          autoComplete="new-password"
          id="passwordConfirmation"
          name="passwordConfirmation"
          required
          type="password"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}
