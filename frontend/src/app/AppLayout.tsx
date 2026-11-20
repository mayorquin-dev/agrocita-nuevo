import clsx from 'clsx'
import { ChevronDown, Command, LogOut, MoreHorizontal, Search } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigation } from 'react-router-dom'
import { useAuth, useUsuario } from '@/shared/auth/AuthContext'
import { formato } from '@/shared/lib/format'
import { Cargando } from '@/shared/ui/feedback'
import { Marca } from '@/shared/ui/Marca'
import { salida } from '@/shared/ui/motion'
import { NAVEGACION, NOMBRE_ROL } from './navegacion'
import type { Enlace } from './navegacion'
import { PaletaComandos } from './PaletaComandos'

function ProgresoRuta() {
  const navegacion = useNavigation()
  const cargando = navegacion.state !== 'idle'

  return (
    <AnimatePresence>
      {cargando && (
        <motion.div
          className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-moss via-ochre to-ochre shadow-[0_0_14px_rgb(197_240_90/0.8)]"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, transition: { duration: 2.4, ease: [0.1, 0.8, 0.2, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.35 } }}
          aria-hidden
        />
      )}
    </AnimatePresence>
  )
}

function enlaceActivo(enlace: Enlace, ruta: string) {
  return enlace.exacto ? ruta === enlace.a : ruta === enlace.a || ruta.startsWith(`${enlace.a}/`)
}

function NavegacionSuperior() {
  const usuario = useUsuario()

  return (
    <LayoutGroup id="nav-superior">
      <nav className="relative hidden items-center gap-0.5 lg:flex" aria-label="Principal">
        {NAVEGACION[usuario.rol].map(({ a, texto, icono: Icono, exacto }, indice) => (
          <motion.div
            key={a}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: salida, delay: 0.1 + indice * 0.04 }}
          >
            <NavLink
              to={a}
              end={exacto}
              className={({ isActive }) =>
                clsx(
                  'group relative flex h-10 items-center gap-2 rounded-full px-3 text-[13.5px] font-medium transition-colors duration-200 xl:px-3.5',
                  isActive ? 'text-forest-deep' : 'text-paper/60 hover:text-paper',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-activo"
                      className="absolute inset-0 rounded-full bg-ochre shadow-[0_0_0_1px_rgb(197_240_90/0.4),0_8px_24px_-8px_rgb(197_240_90/0.55)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      aria-hidden
                    />
                  )}
                  <span className="absolute inset-0 rounded-full bg-paper/[0.06] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  <Icono className="relative hidden size-4 xl:block" aria-hidden />
                  <span className="relative">{texto}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </LayoutGroup>
  )
}

function MenuUsuario() {
  const usuario = useUsuario()
  const { cerrar } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    const alPulsarFuera = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('pointerdown', alPulsarFuera)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alPulsarFuera)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
        className="flex cursor-pointer items-center gap-2 rounded-full border border-paper/10 bg-paper/[0.05] py-1 pr-2.5 pl-1 transition hover:border-paper/25"
      >
        <span className="grid size-8 place-items-center rounded-full bg-ochre font-display text-[13px] font-semibold text-forest-deep">
          {formato.iniciales(usuario.nombre)}
        </span>
        <ChevronDown className={clsx('size-3.5 text-paper/60 transition-transform duration-300', abierto && 'rotate-180')} aria-hidden />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            role="menu"
            className="absolute top-[calc(100%+12px)] right-0 w-72 origin-top-right overflow-hidden rounded-[20px] border border-line bg-card text-ink shadow-lift"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.22, ease: salida }}
          >
            <div className="relative overflow-hidden bg-forest-deep px-5 pt-5 pb-4 text-paper">
              <div className="reticula pointer-events-none absolute inset-0" aria-hidden />
              <p className="relative eyebrow !text-ochre">{NOMBRE_ROL[usuario.rol]}</p>
              <p className="relative mt-2 truncate font-display text-lg font-semibold tracking-tight">{usuario.nombre}</p>
              <p className="relative truncate text-[13px] text-paper/60">{usuario.email}</p>
            </div>
            <div className="p-2">
              {usuario.empresaNombre && (
                <p className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-ink-soft">
                  <span className="size-1.5 rounded-full bg-moss" aria-hidden />
                  {usuario.empresaNombre}
                </p>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={cerrar}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-clay transition hover:bg-clay-soft/60"
              >
                <LogOut className="size-4" aria-hidden />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DockMovil({ alAbrirPaleta }: { alAbrirPaleta: () => void }) {
  const usuario = useUsuario()
  const { pathname } = useLocation()
  const todos = NAVEGACION[usuario.rol]
  const sobran = todos.length > 4
  let visibles = sobran ? todos.slice(0, 3) : todos

  if (sobran) {
    const actual = todos.find((enlace) => enlaceActivo(enlace, pathname))
    visibles = actual && !visibles.includes(actual) ? [...visibles.slice(0, 2), actual] : visibles
  }

  return (
    <motion.nav
      aria-label="Principal"
      className="fixed inset-x-3 bottom-3 z-30 lg:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.2 }}
    >
      <LayoutGroup id="dock">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-full border border-paper/10 bg-forest-deep/95 p-1.5 shadow-[0_24px_60px_-20px_rgb(8_23_15/0.9)] backdrop-blur-xl">
          {visibles.map(({ a, texto, icono: Icono, exacto }) => (
            <NavLink
              key={a}
              to={a}
              end={exacto}
              className={({ isActive }) =>
                clsx(
                  'relative flex h-12 min-w-0 items-center justify-center gap-2 rounded-full px-3 text-[13px] font-semibold transition-colors',
                  isActive ? 'flex-[1_1_auto] text-forest-deep' : 'w-12 flex-none text-paper/60',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="dock-activo"
                      className="absolute inset-0 rounded-full bg-ochre"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      aria-hidden
                    />
                  )}
                  <Icono className="relative size-5 shrink-0" aria-hidden />
                  {isActive && (
                    <motion.span className="relative truncate" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                      {texto}
                    </motion.span>
                  )}
                  {!isActive && <span className="sr-only">{texto}</span>}
                </>
              )}
            </NavLink>
          ))}
          {sobran && (
            <button
              type="button"
              onClick={alAbrirPaleta}
              aria-label="Más secciones"
              className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full text-paper/60 transition hover:text-paper"
            >
              <MoreHorizontal className="size-5" />
            </button>
          )}
        </div>
      </LayoutGroup>
    </motion.nav>
  )
}

export function AppLayout() {
  const usuario = useUsuario()
  const [paleta, setPaleta] = useState(false)
  const [compacto, setCompacto] = useState(false)
  const { pathname } = useLocation()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (valor) => setCompacto(valor > 24))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        setPaleta((valor) => !valor)
      }
    }

    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  return (
    <div className="min-h-dvh">
      <ProgresoRuta />

      <motion.header
        className="sticky top-0 z-30"
        animate={{ paddingTop: compacto ? 8 : 14, paddingLeft: compacto ? 8 : 14, paddingRight: compacto ? 8 : 14 }}
        transition={{ duration: 0.4, ease: salida }}
      >
        <motion.div
          className="relative mx-auto flex h-16 max-w-[1360px] items-center gap-3 overflow-hidden rounded-[22px] border border-paper/[0.06] bg-forest-deep px-3 text-paper sm:px-4"
          initial={{ y: -80, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            boxShadow: compacto ? '0 24px 60px -24px rgb(8 23 15 / 0.75)' : '0 10px 30px -18px rgb(8 23 15 / 0.5)',
          }}
          transition={{ duration: 0.7, ease: salida }}
        >
          <div className="reticula pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -top-20 left-1/3 h-40 w-96 rounded-full bg-ochre/10 blur-3xl" aria-hidden />

          <NavLink to={NAVEGACION[usuario.rol][0].a} className="relative shrink-0 rounded-xl pr-1" aria-label="AgroCita, ir al inicio">
            <Marca claro compacto />
          </NavLink>
          <span className="relative mx-1 hidden h-6 w-px bg-paper/10 lg:block" aria-hidden />

          <NavegacionSuperior />

          <div className="relative ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaleta(true)}
              className="group flex h-10 cursor-pointer items-center gap-2.5 rounded-full border border-paper/10 bg-paper/[0.04] px-3 text-[13px] text-paper/55 transition hover:border-paper/25 hover:text-paper"
              aria-label="Buscar o ir a una sección"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden 2xl:inline">Ir a…</span>
              <kbd className="hidden items-center gap-0.5 rounded-md border border-paper/15 px-1.5 py-0.5 font-mono text-[10.5px] sm:flex">
                <Command className="size-2.5" aria-hidden />K
              </kbd>
            </button>
            {usuario.empresaNombre && (
              <span className="hidden items-center gap-2 rounded-full border border-paper/10 px-3 py-2 font-mono text-[10.5px] tracking-[0.12em] text-paper/60 uppercase 2xl:flex">
                <span className="relative grid size-2 place-items-center" aria-hidden>
                  <span className="absolute size-2 animate-ping rounded-full bg-ochre/60" />
                  <span className="size-1.5 rounded-full bg-ochre" />
                </span>
                {usuario.empresaNombre}
              </span>
            )}
            <MenuUsuario />
          </div>
        </motion.div>
      </motion.header>

      <main className="mx-auto w-full max-w-[1280px] px-5 pt-10 pb-32 sm:px-8 lg:px-12 lg:pt-14 lg:pb-20">
        <Suspense fallback={<Cargando />}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: salida }}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>

      <DockMovil alAbrirPaleta={() => setPaleta(true)} />
      <PaletaComandos abierta={paleta} alCerrar={() => setPaleta(false)} />
    </div>
  )
}
