import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import "./globals.css"
import { getSession, isAdminSession } from "@/lib/auth" // Importar funções de autenticação
import { redirect } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Police Badge Dashboard",
  description: "Dashboard para gerenciamento de badges de viaturas policiais.",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  const isAdmin = await isAdminSession()

  // Protege a rota principal, redirecionando para login se não houver sessão ou não for admin
  if (!session || !isAdmin) {
    // Permite acesso às páginas de login e registro
    if (!globalThis.location?.pathname.startsWith("/login") && !globalThis.location?.pathname.startsWith("/register")) {
      redirect("/login")
    }
  }

  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
