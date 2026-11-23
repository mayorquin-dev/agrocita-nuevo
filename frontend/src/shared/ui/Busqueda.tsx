import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowRight, CalendarDays, ClipboardList, CornerDownLeft, LoaderCircle, Search, Tractor, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { http } from '@/shared/api/http'
import { formato } from '@/shared/lib/format'
import { etiquetaEstado } from './Badge'

export interface ResultadoBusqueda {
  tipo: 'Productor' | 'Finca' | 'Visita' | 'Solicitud'
  id: number
  titulo: string
  subtitulo: string
  ruta: string
  fecha: string | null
  estado: string | null
}

export interface AtajoNavegacion {
  texto: string
  a: string
  icono: LucideIcon
}

const ICONOS: Record<ResultadoBusqueda['tipo'], LucideIcon> = {
  Productor: UserRound,
  Finca: Tractor,
  Visita: CalendarDays,
  Solicitud: ClipboardList,
}

const GRUPOS: Record<ResultadoBusqueda['tipo'], string> = {
  Productor: 'Productores',
  Finca: 'Fincas',
  Visita: 'Visitas',
  Solicitud: 'Solicitudes',
}

interface BusquedaApi {
  abrir: () => void
}

const BusquedaContext = createContext<BusquedaApi | null>(null)

export function useBusqueda(): BusquedaApi {
  const contexto = useContext(BusquedaContext)
  if (!contexto) throw new Error('useBusqueda debe usarse dentro de BusquedaProvider')
  return contexto
}

function useDebounce<T>(valor: T, espera: number): T {
  const [diferido, setDiferido] = useState(valor)

  useEffect(() => {
    const temporizador = window.setTimeout(() => setDiferido(valor), espera)
    return () => window.clearTimeout(temporizador)
  }, [valor, espera])

  return diferido
}

interface Opcion {
  clave: string
  grupo: string
  titulo: string
  detalle?: string
  icono: LucideIcon
  ruta: string
}

function Paleta({ alCerrar, atajos }: { alCerrar: () => void; atajos: AtajoNavegacion[] }) {
  const navegar = useNavigate()
  const [texto, setTexto] = useState('')
  const [activo, setActivo] = useState(0)
  const consulta = useDebounce(texto.trim(), 220)
  const listaId = useId()
  const lista = useRef<HTMLUListElement>(null)

  const resultados = useQuery<ResultadoBusqueda[]>({
    queryKey: ['buscar', consulta],
    queryFn: ({ signal }) => http.get<ResultadoBusqueda[]>('/buscar', { params: { q: consulta }, signal }).then((r) => r.data),
    enabled: consulta.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

  const opciones = useMemo<Opcion[]>(() => {
    const filtro = texto.trim().toLowerCase()
    const navegacion = atajos
      .filter((atajo) => !filtro || atajo.texto.toLowerCase().includes(filtro))
      .map((atajo) => ({ clave: `ir-${atajo.a}`, grupo: 'Ir a', titulo: atajo.texto, icono: atajo.icono, ruta: atajo.a }))

    const encontrados =
      consulta.length >= 2
        ? (resultados.data ?? []).map((resultado) => ({
            clave: `${resultado.tipo}-${resultado.id}`,
            grupo: GRUPOS[resultado.tipo],
            titulo: resultado.titulo,
            detalle: [
              resultado.fecha && formato.fechaHora(resultado.fecha),
              resultado.estado && etiquetaEstado(resultado.estado),
              resultado.subtitulo,
            ]
              .filter(Boolean)
              .join(' · '),
            icono: ICONOS[resultado.tipo],
            ruta: resultado.ruta,
          }))
        : []

    return [...encontrados, ...navegacion]
  }, [atajos, consulta, resultados.data, texto])

  const seleccion = Math.min(activo, Math.max(0, opciones.length - 1))

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${seleccion}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [seleccion])

  const ir = (opcion: Opcion | undefined) => {
    if (!opcion) return
    alCerrar()
    navegar(opcion.ruta)
  }

  const alTeclear = (evento: React.KeyboardEvent) => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setActivo(opciones.length === 0 ? 0 : (seleccion + 1) % opciones.length)
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setActivo(opciones.length === 0 ? 0 : (seleccion - 1 + opciones.length) % opciones.length)
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      ir(opciones[seleccion])
    } else if (evento.key === 'Escape') {
      evento.preventDefault()
      alCerrar()
    }
  }

  const buscando = consulta.length >= 2 && resultados.isFetching
  const sinResultados = consulta.length >= 2 && !resultados.isFetching && opciones.length === 0
  let grupoAnterior = ''

  return createPortal(
    <div className="fixed inset-0 z-[55] flex items-start justify-center px-3 pt-[10vh] sm:px-6">
      <motion.div
        className="absolute inset-0 bg-[#08170f]/50 backdrop-blur-sm"
        onClick={alCerrar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en AgroCita"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="relative flex max-h-[72dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-lift"
      >
        <div className="flex items-center gap-3 border-b border-line-soft px-4">
          {buscando ? (
            <LoaderCircle className="size-5 shrink-0 animate-spin text-ink-faint" aria-hidden />
          ) : (
            <Search className="size-5 shrink-0 text-ink-faint" aria-hidden />
          )}
          <input
            autoFocus
            value={texto}
            onChange={(evento) => {
              setTexto(evento.target.value)
              setActivo(0)
            }}
            onKeyDown={alTeclear}
            placeholder="Busca productores, fincas, visitas o solicitudes…"
            role="combobox"
            aria-expanded="true"
            aria-controls={listaId}
            aria-activedescendant={opciones[seleccion] ? `${listaId}-${seleccion}` : undefined}
            aria-autocomplete="list"
            className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-faint/80 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-faint sm:block">Esc</kbd>
        </div>

        <ul ref={lista} id={listaId} role="listbox" aria-label="Resultados" className="overflow-y-auto p-2">
          {opciones.map((opcion, indice) => {
            const Icono = opcion.icono
            const encabezado = opcion.grupo !== grupoAnterior ? opcion.grupo : null
            grupoAnterior = opcion.grupo

            return (
              <li key={opcion.clave} role="presentation">
                {encabezado && <p className="eyebrow px-3 pt-3 pb-1.5">{encabezado}</p>}
                <div
                  id={`${listaId}-${indice}`}
                  role="option"
                  aria-selected={indice === seleccion}
                  data-indice={indice}
                  onMouseMove={() => setActivo(indice)}
                  onClick={() => ir(opcion)}
                  className={clsx(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
                    indice === seleccion ? 'bg-ochre-soft text-ink' : 'text-ink-soft',
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-paper text-forest">
                    <Icono className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-ink">{opcion.titulo}</span>
                    {opcion.detalle && <span className="block truncate text-[12.5px] text-ink-soft">{opcion.detalle}</span>}
                  </span>
                  {indice === seleccion ? (
                    <CornerDownLeft className="size-4 shrink-0 text-ink-faint" aria-hidden />
                  ) : (
                    <ArrowRight className="size-4 shrink-0 text-ink-faint/60" aria-hidden />
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {(sinResultados || consulta.length < 2) && (
          <p className="border-t border-line-soft px-5 py-3 text-[13px] text-ink-faint">
            {sinResultados ? `Sin resultados para “${consulta}”.` : 'Escribe al menos 2 letras. Usa ↑ ↓ para moverte y Enter para abrir.'}
          </p>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}

export function BusquedaProvider({ atajos, children }: { atajos: AtajoNavegacion[]; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false)
  const abrir = useCallback(() => setAbierta(true), [])
  const cerrar = useCallback(() => setAbierta(false), [])

  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        setAbierta((actual) => !actual)
      } else if (evento.key === '/' && !abierta) {
        const destino = evento.target as HTMLElement | null
        if (destino && (destino.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName))) return
        evento.preventDefault()
        setAbierta(true)
      }
    }

    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierta])

  useEffect(() => {
    if (!abierta) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierta])

  const api = useMemo(() => ({ abrir }), [abrir])

  return (
    <BusquedaContext.Provider value={api}>
      {children}
      {abierta && <Paleta alCerrar={cerrar} atajos={atajos} />}
    </BusquedaContext.Provider>
  )
}
