import { apiFetch, getCsrfCookie } from "@/lib/api/client"
import type { LoginPayload, RegisterPayload, User } from "@/lib/types"

type LaravelUser = {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

function mapUser(user: LaravelUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.email_verified_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await apiFetch<LaravelUser>("/api/user")

    return mapUser(user)
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 401) {
      return null
    }

    throw error
  }
}

export async function login(payload: LoginPayload): Promise<User | null> {
  await getCsrfCookie()
  await apiFetch<void>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return getCurrentUser()
}

export async function register(payload: RegisterPayload): Promise<User | null> {
  await getCsrfCookie()
  await apiFetch<void>("/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    }),
  })

  return getCurrentUser()
}

export async function logout(): Promise<void> {
  await getCsrfCookie()
  await apiFetch<void>("/logout", {
    method: "POST",
  })
}
