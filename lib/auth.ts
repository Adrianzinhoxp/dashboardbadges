"use server"

import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import { redirect } from "next/navigation"

// Em uma aplicação real, use uma biblioteca de hashing de senhas como 'bcrypt'
// import bcrypt from 'bcryptjs'

// Inicializa o cliente SQL. Se DATABASE_URL não estiver definida,
// usaremos um cliente mock para permitir a pré-visualização.
let sql: ReturnType<typeof neon> | null = null

if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL)
} else {
  console.warn(
    "DATABASE_URL environment variable is not set. Running in mock database mode for preview/development. Data will not be persisted.",
  )
  // Mock do cliente SQL para simular operações de banco de dados no preview
  sql = {
    query: async (strings: TemplateStringsArray, ...values: any[]) => {
      console.log("MOCK DB Query:", strings.join(""), values)
      // Simula resultados para as operações de autenticação
      if (strings[0].includes("SELECT id FROM users WHERE email")) {
        // Simula que o email "admin@example.com" já existe para teste de registro
        if (values[0] === "admin@example.com") return [{ id: "mock-existing-id" }]
        return [] // Nenhum usuário existente
      }
      if (strings[0].includes("INSERT INTO users")) {
        return [{ id: "mock-user-id-123", email: values[0], is_admin: values[2] }]
      }
      if (strings[0].includes("SELECT id, email, password_hash, is_admin FROM users WHERE email")) {
        // Simula um login bem-sucedido para um usuário admin de teste
        if (values[0] === "admin@example.com" && values[1] === "password") {
          return [{ id: "mock-admin-id-456", email: "admin@example.com", password_hash: "password", is_admin: true }]
        }
        return [] // Credenciais inválidas
      }
      return [] // Retorno padrão para outras queries
    },
    // Adicione outros métodos se forem usados, como `sql.end()`
  } as any // Cast para 'any' para compatibilidade com o tipo do mock
}

interface UserSession {
  id: string
  email: string
  isAdmin: boolean
}

const SESSION_COOKIE_NAME = "police_dashboard_session"

export async function register(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const isAdmin = formData.get("isAdmin") === "true" // Apenas para demonstração, em produção isso seria controlado

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." }
  }

  if (!sql) {
    // Comportamento mock para registro
    console.warn("MOCK: Skipping actual database registration. Simulating success.")
    cookies().set(SESSION_COOKIE_NAME, JSON.stringify({ id: "mock-user-id", email, isAdmin }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    redirect("/")
    return
  }

  // Em uma aplicação real, use bcrypt.hash(password, 10)
  const passwordHash = password // Placeholder: Em produção, use bcrypt para hash

  try {
    const existingUser = await sql.query`SELECT id FROM users WHERE email = ${email}`
    if (existingUser.length > 0) {
      return { error: "Este email já está registrado." }
    }

    const [user] = await sql.query`
      INSERT INTO users (email, password_hash, is_admin)
      VALUES (${email}, ${passwordHash}, ${isAdmin})
      RETURNING id, email, is_admin;
    `

    const session: UserSession = {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
    }
    cookies().set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    redirect("/")
  } catch (error) {
    console.error("Erro ao registrar:", error)
    return { error: "Erro ao registrar usuário." }
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." }
  }

  if (!sql) {
    // Comportamento mock para login
    console.warn("MOCK: Skipping actual database login. Simulating success for admin@example.com:password.")
    if (email === "admin@example.com" && password === "password") {
      cookies().set(SESSION_COOKIE_NAME, JSON.stringify({ id: "mock-admin-id", email, isAdmin: true }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
      redirect("/")
    } else {
      return { error: "Credenciais inválidas (MOCK)." }
    }
    return
  }

  try {
    const [user] = await sql.query`SELECT id, email, password_hash, is_admin FROM users WHERE email = ${email}`

    if (!user) {
      return { error: "Credenciais inválidas." }
    }

    // Em uma aplicação real, use bcrypt.compare(password, user.password_hash)
    const passwordMatch = password === user.password_hash // Placeholder: Em produção, compare com hash

    if (!passwordMatch) {
      return { error: "Credenciais inválidas." }
    }

    const session: UserSession = {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
    }
    cookies().set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    redirect("/")
  } catch (error) {
    console.error("Erro ao fazer login:", error)
    return { error: "Erro ao fazer login." }
  }
}

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME)
  redirect("/login")
}

export async function getSession(): Promise<UserSession | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)
  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value) as UserSession
    return session
  } catch (error) {
    console.error("Erro ao parsear sessão:", error)
    // Se o SQL não estiver configurado, e a sessão for inválida,
    // podemos retornar uma sessão mock para o admin para facilitar o preview.
    if (!sql && process.env.NODE_ENV === "development") {
      console.warn("MOCK: Invalid session, but DATABASE_URL not set. Returning mock admin session for preview.")
      return { id: "mock-admin-id", email: "admin@example.com", isAdmin: true }
    }
    return null
  }
}

export async function isAdminSession(): Promise<boolean> {
  const session = await getSession()
  // Se o SQL não estiver configurado, e estivermos em desenvolvimento,
  // podemos considerar sempre admin para o preview.
  if (!sql && process.env.NODE_ENV === "development") {
    console.warn("MOCK: DATABASE_URL not set. Assuming admin for preview.")
    return true
  }
  return session?.isAdmin === true
}
