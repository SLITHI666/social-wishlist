"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { 
  Gift, Plus, Share2, Users, Lock, Trash2, ExternalLink, 
  CheckCircle, PartyPopper, EyeOff, Sparkles, 
  Calendar, Loader2, LogOut, AlertCircle, ArrowLeft, Clock, Archive, Languages
} from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"

// --- СЛОВАРЬ (i18n) ---
const translations = {
  en: {
    logo: "WishLink",
    myEvents: "My Events",
    owner: "Owner",
    guest: "Guest",
    logout: "Logout",
    upcoming: "Upcoming",
    eventPassed: "Event Passed",
    archive: "Archive",
    dateNotSet: "Date not set",
    aiIdeas: "AI Ideas",
    addGift: "Add Gift",
    share: "Share",
    copied: "Link copied!",
    emptyWishlist: "Wishlist is empty",
    emptyDescOwner: "Add gifts manually or use AI!",
    emptyDescGuest: "The owner hasn't added anything yet.",
    progress: "Progress",
    collected: "Collected",
    goal: "Goal",
    funded: "Fully Funded!",
    archiveMsg: "Archive (Event Passed)",
    cancelReserve: "Cancel Reservation",
    alreadyReserved: "Taken",
    youReserved: "YOU",
    reserveBtn: "Reserve",
    contributeBtn: "Contribute",
    deleteConfirm: "Delete this gift?",
    newName: "Name",
    newPrice: "Price",
    newImg: "Image URL (optional)",
    newLink: "Product Link (optional)",
    newAutoInfo: "If left empty, we will generate a style card and a search link.",
    addBtn: "Add to List",
    contributeTitle: "Make a contribution",
    yourName: "Your Name",
    amount: "Amount",
    confirmBtn: "Confirm",
    aiTitle: "AI Assistant",
    aiDesc: "Tell me interests, and I'll suggest gifts.",
    aiPlaceholder: "Gamer, loves coffee...",
    aiFind: "Find Ideas",
    aiError: "AI could not generate ideas.",
    surpriseDesc: "Status hidden (Surprise)",
    back: "Back"
  },
  ru: {
    logo: "WishLink",
    myEvents: "Мои события",
    owner: "Владелец",
    guest: "Гость",
    logout: "Выйти",
    upcoming: "Скоро праздник",
    eventPassed: "Событие прошло",
    archive: "Архив",
    dateNotSet: "Дата не указана",
    aiIdeas: "AI Идеи",
    addGift: "Добавить",
    share: "Поделиться",
    copied: "Ссылка скопирована!",
    emptyWishlist: "Список пуст",
    emptyDescOwner: "Добавьте желания вручную или через AI!",
    emptyDescGuest: "Именинник еще ничего не добавил.",
    progress: "Прогресс",
    collected: "Собрано",
    goal: "Цель",
    funded: "Сбор закрыт!",
    archiveMsg: "Архив (Событие прошло)",
    cancelReserve: "Отменить бронь",
    alreadyReserved: "Занято",
    youReserved: "ВЫ",
    reserveBtn: "Куплю сам",
    contributeBtn: "Скинуться",
    deleteConfirm: "Удалить этот подарок?",
    newName: "Название",
    newPrice: "Цена",
    newImg: "Ссылка на фото",
    newLink: "Ссылка на товар",
    newAutoInfo: "Если оставить пустым, мы создадим карточку и ссылку на Яндекс.",
    addBtn: "Добавить в список",
    contributeTitle: "Внести вклад",
    yourName: "Ваше имя",
    amount: "Сумма",
    confirmBtn: "Подтвердить",
    aiTitle: "AI Помощник",
    aiDesc: "Напиши интересы, а я предложу подарки.",
    aiPlaceholder: "Геймер, любит кофе...",
    aiFind: "Найти",
    aiError: "AI не смог придумать идеи.",
    surpriseDesc: "Статус скрыт (Сюрприз)",
    back: "Назад"
  }
}

interface Wishlist {
  id: string; title: string; owner_id: string | null; event_date: string | null;
}
interface Item {
  id: string; name: string; price: number; image_url: string | null; url: string | null;
  reserved_by_guest_id: string | null; total_contributed: number;
}

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const wishlistId = params.id as string

  // --- I18N ---
  const [lang, setLang] = useState<'en' | 'ru'>('en')
  const t = translations[lang]

  // --- STATE ---
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [guestId, setGuestId] = useState<string>("") 
  const [isOwner, setIsOwner] = useState(false)

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isContributeOpen, setIsContributeOpen] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(false)
  
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiIdeas, setAiIdeas] = useState<any[]>([])
  const [aiError, setAiError] = useState("")

  const [activeItem, setActiveItem] = useState<Item | null>(null)

  // Forms
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [newItemUrl, setNewItemUrl] = useState("") 
  const [newItemLink, setNewItemLink] = useState("") 
  const [contributeAmount, setContributeAmount] = useState("1000")
  const [contributorName, setContributorName] = useState("")

  const isEventPassed = wishlist?.event_date 
    ? new Date(wishlist.event_date) < new Date(new Date().setHours(0,0,0,0)) 
    : false;

  // --- UTILS ---
  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ru' : 'en'
    setLang(newLang); localStorage.setItem('lang', newLang);
  }

  const generateSearchLink = (query: string) => `https://market.yandex.ru/search?text=${encodeURIComponent(query)}`;

  const getGradient = (name: string) => {
    const gradients = ["bg-gradient-to-br from-pink-500 to-rose-500", "bg-gradient-to-br from-indigo-500 to-blue-500", "bg-gradient-to-br from-emerald-500 to-teal-500", "bg-gradient-to-br from-orange-400 to-red-500", "bg-gradient-to-br from-violet-500 to-purple-500"];
    let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  }

  // --- INIT & FETCH ---
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'en' | 'ru'
    if (savedLang) setLang(savedLang)

    let storedGuestId = localStorage.getItem('wishlist_guest_id') || Math.random().toString(36).substring(2);
    localStorage.setItem('wishlist_guest_id', storedGuestId);
    setGuestId(storedGuestId);

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: wl } = await supabase.from('wishlists').select('*').eq('id', wishlistId).single()
      if (wl) setWishlist(wl)
      if (user && wl && user.id === wl.owner_id) setIsOwner(true)
    }
    check()
  }, [wishlistId])

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('room_updates').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [wishlistId])

  const fetchData = async () => {
    const { data: itemsData } = await supabase.from('items').select('*').eq('wishlist_id', wishlistId).order('created_at', { ascending: true })
    if (!itemsData) return setLoading(false)
    const { data: contributions } = await supabase.from('contributions').select('*').in('item_id', itemsData.map(i => i.id))
    const itemsWithTotals = itemsData.map(item => ({
      ...item, total_contributed: contributions?.filter(c => c.item_id === item.id).reduce((sum, c) => sum + c.amount, 0) || 0
    }))
    setItems(itemsWithTotals); setLoading(false);
  }

  // --- ACTIONS ---
  const generateIdeas = async () => {
    setAiLoading(true); setAiIdeas([]); setAiError("")
    try {
      const res = await fetch('/api/generate', { method: 'POST', body: JSON.stringify({ prompt: aiPrompt }) })
      const data = await res.json();
      if (data.ideas) setAiIdeas(data.ideas); else setAiError(t.aiError);
    } catch { setAiError("API Error") } finally { setAiLoading(false) }
  }

  const addItem = async (name: string, price: number, img?: string, link?: string) => {
    await supabase.from('items').insert([{
      wishlist_id: wishlistId, name, price, image_url: img || null,
      url: link || generateSearchLink(name)
    }]);
    setIsAddItemOpen(false); setIsAIOpen(false);
    setNewItemName(""); setNewItemPrice(""); setNewItemUrl(""); setNewItemLink("");
  }

  const deleteItem = async (id: string) => {
    if (confirm(t.deleteConfirm)) await supabase.from('items').delete().eq('id', id);
  }

  const toggleReservation = async (item: Item) => {
    const newId = item.reserved_by_guest_id === guestId ? null : guestId;
    await supabase.from('items').update({ reserved_by_guest_id: newId }).eq('id', item.id);
  }

  // ФУНКЦИЯ ВКЛАДА (Которая была потеряна)
  const makeContribution = async () => {
    if (!activeItem || !contributeAmount) return
    await supabase.from('contributions').insert([{
      item_id: activeItem.id,
      amount: parseFloat(contributeAmount),
      contributor_name: contributorName || "Guest",
      guest_id: guestId
    }])
    setIsContributeOpen(false); setContributeAmount("1000"); setContributorName("")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut(); router.push('/login');
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-violet-600" /></div>

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <nav className="bg-white/80 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="ghost" size="sm" className="text-slate-500"><ArrowLeft size={20} /><span className="ml-2 hidden sm:inline">{t.myEvents}</span></Button></Link>
            <Link href="/" className="flex items-center gap-2 font-bold text-xl"><Gift className="text-violet-600" size={24} />{t.logo}</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="font-bold">{lang.toUpperCase()}</Button>
            {isOwner ? (
                <div className="flex items-center gap-2">
                    <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{t.owner}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600"><LogOut size={18} /></Button>
                </div>
            ) : <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase">{t.guest}</span>}
          </div>
        </div>
      </nav>

      <div className="bg-white border-b border-slate-100 pt-10 pb-12 mb-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 ${isEventPassed ? 'bg-slate-100 text-slate-500' : 'bg-violet-50 text-violet-700'}`}>
                {isEventPassed ? <Archive size={14} /> : <PartyPopper size={14} />} {isEventPassed ? t.eventPassed : t.upcoming}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold">{wishlist?.title}</h1>
              <div className="flex items-center gap-3 text-slate-500 mt-2">
                <Calendar size={20} className={isEventPassed ? "text-slate-400" : "text-violet-600"} /> 
                <span className={isEventPassed ? "line-through opacity-50" : ""}>{wishlist?.event_date ? new Date(wishlist.event_date).toLocaleDateString() : t.dateNotSet}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {isOwner && (
                <><Button onClick={() => setIsAIOpen(true)} variant="outline" className="text-violet-600 border-violet-200"><Sparkles size={20} className="mr-2" /> {t.aiIdeas}</Button>
                <Button onClick={() => setIsAddItemOpen(true)} className="bg-slate-900"><Plus size={20} className="mr-2" /> {t.addGift}</Button></>
              )}
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(window.location.href); alert(t.copied) }}><Share2 size={20} className="mr-2"/> {t.share}</Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4">
        {items.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed rounded-3xl"><Gift size={40} className="mx-auto text-violet-300 mb-4"/><h3 className="text-2xl font-bold">{t.emptyWishlist}</h3><p>{isOwner ? t.emptyDescOwner : t.emptyDescGuest}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => {
              const percent = Math.min((item.total_contributed / item.price) * 100, 100);
              const isReserved = !!item.reserved_by_guest_id;
              const itemLink = item.url || generateSearchLink(item.name);
              return (
                <Card key={item.id} className={`overflow-hidden group hover:shadow-xl transition-all relative ${isEventPassed ? 'opacity-70' : ''}`}>
                  <a href={itemLink} target="_blank" className="block relative aspect-video bg-slate-100">
                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className={`w-full h-full ${getGradient(item.name)} flex items-center justify-center text-white font-bold px-4 text-center`}>{item.name}</div>}
                    <div className="absolute top-4 left-4 bg-white/95 px-3 py-1 rounded-lg font-bold shadow-lg">{item.price.toLocaleString()} ₽</div>
                    {!isOwner && isReserved && <div className="absolute top-4 right-4 bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold">{item.reserved_by_guest_id === guestId ? t.youReserved : t.alreadyReserved}</div>}
                  </a>
                  {isOwner && <Button variant="ghost" className="absolute top-4 right-4 bg-white text-red-500 p-2 h-auto" onClick={() => deleteItem(item.id)}><Trash2 size={18}/></Button>}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-4">{item.name}</h3>
                    <div className="mt-auto pt-4 border-t">
                      {isOwner ? (
                        <div className="space-y-2"><div className="flex justify-between text-sm"><span>{t.progress}</span><span>{Math.round(percent)}%</span></div><Progress value={percent} className="h-2"/>{isReserved && <div className="text-xs text-center text-slate-400 mt-2 flex items-center justify-center gap-1"><EyeOff size={12}/> {t.surpriseDesc}</div>}</div>
                      ) : (
                        <div className="space-y-4">
                           <div className="flex justify-between text-sm"><div>{t.collected}: <b>{item.total_contributed} ₽</b></div><div>{t.goal}: {item.price} ₽</div></div>
                           <Progress value={percent} className={`h-2 ${percent >= 100 ? "[&>div]:bg-green-500" : ""}`} />
                           {isEventPassed ? <div className="bg-slate-100 py-3 rounded-xl text-center text-sm font-bold">{t.archive}</div> : percent >= 100 ? <div className="bg-green-50 text-green-700 py-3 rounded-xl text-center text-sm font-bold">{t.funded}</div> : isReserved ? (item.reserved_by_guest_id === guestId ? <Button variant="outline" className="w-full border-red-200 text-red-600" onClick={() => toggleReservation(item)}>{t.cancelReserve}</Button> : <Button disabled className="w-full">{t.alreadyReserved}</Button>) : <div className="flex gap-2"><Button className="flex-1" variant="outline" onClick={() => toggleReservation(item)}>{t.reserveBtn}</Button><Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold" onClick={() => { setActiveItem(item); setIsContributeOpen(true); }}>{t.contributeBtn}</Button></div>}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.addGift}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder={t.newName} value={newItemName} onChange={e => setNewItemName(e.target.value)} />
            <Input type="number" placeholder={t.newPrice} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
            <Input placeholder={t.newImg} value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} />
            <Input placeholder={t.newLink} value={newItemLink} onChange={e => setNewItemLink(e.target.value)} />
            <Button onClick={() => addItem(newItemName, Number(newItemPrice), newItemUrl, newItemLink)} className="w-full bg-slate-900">{t.addBtn}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.contributeTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Label>{t.yourName}</Label><Input placeholder="John Doe" value={contributorName} onChange={e => setContributorName(e.target.value)} />
            <Label>{t.amount} (₽)</Label><Input type="number" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} />
            <Button onClick={makeContribution} className="w-full bg-violet-600 text-white font-bold">{t.confirmBtn}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="text-violet-500"/> {t.aiTitle}</DialogTitle><DialogDescription>{t.aiDesc}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input placeholder={t.aiPlaceholder} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generateIdeas()} />
              <Button onClick={generateIdeas} disabled={aiLoading || !aiPrompt} className="bg-violet-600">{aiLoading ? <Loader2 className="animate-spin"/> : t.aiFind}</Button>
            </div>
            {aiError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex gap-2"><AlertCircle size={16}/> {aiError}</div>}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {aiIdeas.map((idea, idx) => (
                <Card key={idx} className="p-3 flex justify-between items-center">
                  <div className="flex-1 mr-2"><div className="font-bold">{idea.name}</div><div className="text-xs text-slate-500">{idea.description}</div><div className="text-sm font-semibold text-violet-600">{idea.price} ₽</div></div>
                  <Button size="sm" onClick={() => addItem(idea.name, idea.price)} className="bg-slate-900 text-white h-8 w-8 p-0 rounded-full"><Plus size={16} /></Button>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}