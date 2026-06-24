import { AuthFormShell } from "@/components/auth/auth-form-shell"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <AuthFormShell
      description="Create an account and start uploading public videos immediately."
      footer={{
        label: "Already have an account?",
        href: "/login",
        action: "Sign in",
      }}
      title="Create account"
    >
      <RegisterForm />
    </AuthFormShell>
  )
}
