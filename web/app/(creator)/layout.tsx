import { AuthGuard } from "@/components/auth/auth-guard"

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
