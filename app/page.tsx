"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Gift, Loader2, LogOut, Plus, Trash2, Calendar, ChevronRight, Languages } from "lucide-react"
import Link from "next/link"
import { translations } from "@/lib/translations"

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState<'en' | 'ru'>('en')
  const t = translations[lang]

  const [user, setUser] = useState<any>(null)
  const [wishlists, setWishlists] = useState<any[]>([])
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDate, setNewDate] = useState("")
  const [creating, setCreating] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'en' | 'ru'
    if (savedLang) setLang(savedLang)

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        setLoadingData(true)
        const { data } = await supabase.from('wishlists').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
        if (data) setWishlists(data)
        setLoadingData(false)
      }
      setLoadingAuth(false)
    }
    init()
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ru' : 'en'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }

  const createWishlist = async () => {
    if (!newTitle || !user) return
    setCreating(true)
    const { data, error } = await supabase.from('wishlists').insert([{ title: newTitle, owner_id: user.id, event_date: newDate || null }]).select()
    if (!error) router.push(`/wishlist/${data[0].id}`)
    setCreating(false)
  }

  const deleteWishlist = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return
    const { error } = await supabase.from('wishlists').delete().eq('id', id)
    if (!error) setWishlists(wishlists.filter(w => w.id !== id))
  }

  if (loadingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-violet-600"/></div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 text-white p-2 rounded-xl shadow-lg"><Gift size={20} /></div>
          <span className="font-bold text-xl text-slate-800">{t.logo}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="text-slate-500 font-bold">
            <Languages size={18} className="mr-2"/> {lang.toUpperCase()}
          </Button>
          {user && (
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-slate-500 hover:text-red-600">
              <LogOut size={16} className="mr-2"/> {t.logout}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {!user ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md shadow-xl border-0 text-center py-8">
              <CardHeader>
                <CardTitle className="text-3xl font-bold">{t.welcome}</CardTitle>
                <CardDescription className="text-lg">{t.authDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/login"><Button className="w-full text-lg py-6 bg-violet-600 font-bold">{t.login}</Button></Link>
                <Link href="/register"><Button variant="outline" className="w-full text-lg py-6 font-bold">{t.register}</Button></Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">{t.myEvents}</h1>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild><Button className="bg-slate-900"><Plus size={18} className="mr-2"/> {t.newEvent}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.newEvent}</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Label>{t.eventTitle}</Label>
                    <Input placeholder={t.placeholderTitle} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <Label>{t.eventDate}</Label>
                    <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                    <Button onClick={createWishlist} className="w-full bg-violet-600" disabled={creating}>{creating ? t.loading : t.createBtn}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {wishlists.length === 0 ? (
               <Card className="p-10 text-center border-dashed border-2"><Plus size={40} className="mx-auto text-slate-300 mb-4"/><CardTitle>{t.noEvents}</CardTitle><CardDescription>{t.noEventsDesc}</CardDescription></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wishlists.map(list => (
                  <Card key={list.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => router.push(`/wishlist/${list.id}`)}>
                    <CardHeader>
                      <CardTitle>{list.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar size={14}/> {list.event_date ? new Date(list.event_date).toLocaleDateString() : t.dateNotSet}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                      <span className="text-violet-600 font-bold flex items-center">{t.open} <ChevronRight size={16}/></span>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteWishlist(list.id) }} className="text-slate-400 hover:text-red-600"><Trash2 size={18}/></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}