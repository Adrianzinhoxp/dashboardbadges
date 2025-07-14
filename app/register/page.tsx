import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { register } from "@/lib/auth"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Card className="w-full max-w-md glass border-0 hover-lift overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-teal-500/5 to-cyan-500/5"></div>
        <CardHeader className="relative pb-4">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Registro de Admin
          </CardTitle>
          <CardDescription className="text-center text-base">
            Crie uma nova conta de administrador para o painel.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <form action={register} className="grid gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
              className="h-12 bg-white/50 border-gray-200 focus:bg-white focus:border-green-300 focus:ring-green-200 rounded-xl"
            />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Senha"
              required
              className="h-12 bg-white/50 border-gray-200 focus:bg-white focus:border-green-300 focus:ring-green-200 rounded-xl"
            />
            {/* Campo oculto para definir is_admin como true. Em produção, isso seria controlado de forma mais segura. */}
            <input type="hidden" name="isAdmin" value="true" />
            <Button
              type="submit"
              className="h-12 bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 hover:from-green-700 hover:via-teal-700 hover:to-cyan-700 shadow-lg hover-lift rounded-xl"
            >
              Registrar
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-green-600 hover:underline font-semibold">
              Faça login aqui
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
