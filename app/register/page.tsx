"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Gift, Languages, Mail, Lock, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

// --- СЛОВАРЬ (i18n) ---
const translations = {
  en: {
    title: "Create Account",
    desc: "Start creating your wishlists today",
    email: "Email",
    password: "Password",
    registerBtn: "Create Account",
    creating: "Creating...",
    hasAccount: "Already have an account?",
    login: "Login",
    successTitle: "Almost there!",
    successDesc: "We sent a verification link to",
    successInfo: "Check your inbox to activate your account.",
    backToLogin: "Back to Login",
    error: "Error",
    logo: "WishLink"
  },
  ru: {
    title: "Регистрация",
    desc: "Начните создавать списки желаний",
    email: "Электронная почта",
    password: "Пароль",
    registerBtn: "Создать аккаунт",
    creating: "Создаем...",
    hasAccount: "Уже есть аккаунт?",
    login: "Войти",
    successTitle: "Почти готово!",
    successDesc: "Мы отправили письмо для подтверждения на",
    successInfo: "Проверьте почту, чтобы активировать аккаунт.",
    backToLogin: "Вернуться ко входу",
    error: "Ошибка",
    logo: "WishLink"
  }
}

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [lang, setLang] = useState<'en' | 'ru'>('en')
  const router = useRouter()
  const t = translations[lang]

  // Загружаем язык
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'en' | 'ru'
    if (savedLang) setLang(savedLang)
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ru' : 'en'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }

  const handleRegister = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(`${t.error}: ${error.message}`)
      setLoading(false)
    } else {
      setIsSuccess(true)
      setLoading(false)
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

      <Card className="w-full max-w-sm shadow-xl border-0 overflow-hidden">
        {isSuccess ? (
          /* ЭКРАН УСПЕХА */
          <div className="p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} />
            </div>
            <CardTitle className="text-2xl font-bold mb-2">{t.successTitle}</CardTitle>
            <p className="text-slate-600 mb-1">{t.successDesc}</p>
            <p className="font-bold text-slate-900 mb-4">{email}</p>
            <p className="text-sm text-slate-500 mb-8">{t.successInfo}</p>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full h-12 border-2 font-bold">
                {t.backToLogin}
              </Button>
            </Link>
          </div>
        ) : (
          /* ЭКРАН ФОРМЫ */
          <>
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
                onClick={handleRegister} 
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-all" 
                disabled={loading || !email || !password}
              >
                {loading ? <><Loader2 className="mr-2 animate-spin" /> {t.creating}</> : t.registerBtn}
              </Button>

              <div className="text-center text-sm text-slate-500 pt-2">
                {t.hasAccount} <Link href="/login" className="text-violet-600 font-bold hover:underline">{t.login}</Link>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
} 