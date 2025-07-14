import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { login } from "@/lib/auth"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Card className="w-full max-w-md glass border-0 hover-lift overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
        <CardHeader className="relative pb-4">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Login
          </CardTitle>
          <CardDescription className="text-center text-base">
            Acesse o painel de controle da Polícia Oasis.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <form action={login} className="grid gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
              className="h-12 bg-white/50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-blue-200 rounded-xl"
            />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Senha"
              required
              className="h-12 bg-white/50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-blue-200 rounded-xl"
            />
            <Button
              type="submit"
              className="h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover-lift rounded-xl"
            >
              Entrar
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-semibold">
              Registre-se aqui
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
