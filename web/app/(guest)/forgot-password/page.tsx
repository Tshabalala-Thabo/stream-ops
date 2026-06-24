import { AuthFormShell } from "@/components/auth/auth-form-shell"
import { PasswordPlaceholderForm } from "@/components/auth/password-placeholder-form"

export default function ForgotPasswordPage() {
  return (
    <AuthFormShell
      description="Prepare password recovery for StreamOps accounts."
      footer={{
        label: "Remembered it?",
        href: "/login",
        action: "Sign in",
      }}
      title="Forgot password"
    >
      <PasswordPlaceholderForm mode="forgot" />
    </AuthFormShell>
  )
}
