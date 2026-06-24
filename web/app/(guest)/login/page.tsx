import { AuthFormShell } from "@/components/auth/auth-form-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthFormShell
      description="Sign in to upload videos and manage your processing pipeline."
      footer={{
        label: "Need an account?",
        href: "/register",
        action: "Create one",
      }}
      title="Sign in"
    >
      <LoginForm />
    </AuthFormShell>
  )
}
