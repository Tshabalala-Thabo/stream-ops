import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordPlaceholderForm({ mode }: { mode: "forgot" | "reset" }) {
  return (
    <form className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      {mode === "reset" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" required type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirmation">Confirm new password</Label>
            <Input
              id="passwordConfirmation"
              name="passwordConfirmation"
              required
              type="password"
            />
          </div>
        </>
      ) : null}
      <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        Password recovery UI is staged for the auth flow, but API wiring will be completed after
        the core sign-in and registration path is stable.
      </p>
      <Button className="w-full" disabled type="button">
        {mode === "forgot" ? "Send reset link" : "Reset password"}
      </Button>
    </form>
  )
}
