import { AuthFormShell } from "@/components/auth/auth-form-shell"
import { PasswordPlaceholderForm } from "@/components/auth/password-placeholder-form"

export default function ResetPasswordPage() {
  return (
    <AuthFormShell
      description="Prepare password reset for StreamOps accounts."
      footer={{
        label: "Go back to",
        href: "/login",
        action: "sign in",
      }}
      title="Reset password"
    >
      <PasswordPlaceholderForm mode="reset" />
    </AuthFormShell>
  )
}
