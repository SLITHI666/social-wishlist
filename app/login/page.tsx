"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Gift, Languages, Mail, Lock, Loader2 } from "lucide-react"
import Link from "next/link"

// --- СЛОВАРЬ (i18n) ---
const translations = {
  en: {
    title: "Login to WishLink",
    desc: "Manage your wishlists and events",
    email: "Email",
    password: "Password",
    loginBtn: "Login",
    loggingIn: "Logging in...",
    noAccount: "Don't have an account?",
    register: "Register",
    error: "Error",
    logo: "WishLink"
  },
  ru: {
    title: "Вход в WishLink",
    desc: "Управляйте своими списками и событиями",
    email: "Электронная почта",
    password: "Пароль",
    loginBtn: "Войти",
    loggingIn: "Входим...",
    noAccount: "Нет аккаунта?",
    register: "Регистрация",
    error: "Ошибка",
    logo: "WishLink"
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'en' | 'ru'>('en')
  const router = useRouter()
  const t = translations[lang]

  // Загружаем язык из памяти
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'en' | 'ru'
    if (savedLang) setLang(savedLang)
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ru' : 'en'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(`${t.error}: ${error.message}`)
      setLoading(false)
    } else {
      router.push("/") 
      router.refresh() 
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      
      {/* Кнопка переключения языка сверху */}
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={toggleLang} className="text-slate-500 font-bold">
          <Languages size={18} className="mr-2"/> {lang.toUpperCase()}
        </Button>
      </div>

      <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
        <div className="bg-violet-600 text-white p-2 rounded-xl shadow-lg shadow-violet-200">
          <Gift size={24} />
        </div>
        <span className="font-bold text-2xl text-slate-900">{t.logo}</span>
      </Link>

      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">{t.title}</CardTitle>
          <CardDescription>{t.desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <Input 
                className="pl-10 h-12" 
                placeholder={t.email} 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <Input 
                className="pl-10 h-12" 
                placeholder={t.password} 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-all" 
            disabled={loading}
          >
            {loading ? <><Loader2 className="mr-2 animate-spin" /> {t.loggingIn}</> : t.loginBtn}
          </Button>

          <div className="text-center text-sm text-slate-500 pt-2">
            {t.noAccount} <Link href="/register" className="text-violet-600 font-bold hover:underline">{t.register}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}