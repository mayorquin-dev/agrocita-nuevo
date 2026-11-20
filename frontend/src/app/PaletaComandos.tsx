import clsx from 'clsx'
import { ArrowRight, CornerDownLeft, LogOut, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUsuario } from '@/shared/auth/AuthContext'
import { salida } from '@/shared/ui/motion'
import { NAVEGACION } from './navegacion'

interface Comando {
  id: string
  texto: string
  descripcion: string
  icono: typeof Search
  ejecutar: () => void
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function PaletaComandos({ abierta, alCerrar }: { abierta: boolean; alCerrar: () => void }) {
  return createPortal(<AnimatePresence>{abierta && <Contenido alCerrar={alCerrar} />}</AnimatePresence>, document.body)
}

function Contenido({ alCerrar }: { alCerrar: () => void }) {
  const usuario = useUsuario()
  const { cerrar } = useAuth()
  const navegar = useNavigate()
  const [consulta, setConsulta] = useState('')
  const [activo, setActivo] = useState(0)

  const comandos = useMemo<Comando[]>(
    () => [
      ...NAVEGACION[usuario.rol].map((enlace) => ({
        id: enlace.a,
        texto: enlace.texto,
        descripcion: enlace.descripcion,
        icono: enlace.icono,
        ejecutar: () => navegar(enlace.a),
      })),
      { id: 'salir', texto: 'Cerrar sesión', descripcion: 'Salir de AgroCita en este dispositivo', icono: LogOut, ejecutar: cerrar },
    ],
    [usuario.rol, navegar, cerrar],
  )

  const filtrados = useMemo(() => {
    const termino = normalizar(consulta.trim())
    if (!termino) return comandos
    return comandos.filter((comando) => normalizar(`${comando.texto} ${comando.descripcion}`).includes(termino))
  }, [comandos, consulta])

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const elegir = (comando?: Comando) => {
    if (!comando) return
    alCerrar()
    comando.ejecutar()
  }

  const alPulsar = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setActivo((valor) => (valor + 1) % Math.max(filtrados.length, 1))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setActivo((valor) => (valor - 1 + filtrados.length) % Math.max(filtrados.length, 1))
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      elegir(filtrados[activo])
    } else if (evento.key === 'Escape') {
      alCerrar()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <motion.div
        className="absolute inset-0 bg-forest-deep/55 backdrop-blur-md"
        onClick={alCerrar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar y navegar"
        className="relative w-full max-w-xl overflow-hidden rounded-[24px] border border-paper/10 bg-forest-deep text-paper shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)]"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.32, ease: salida }}
      >
        <div className="reticula pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex items-center gap-3 border-b border-paper/10 px-5">
          <Search className="size-[18px] text-ochre" aria-hidden />
          <input
            autoFocus
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value)
              setActivo(0)
            }}
            onKeyDown={alPulsar}
            placeholder="Ir a… solicitudes, agenda, informes"
            aria-label="Buscar sección"
            className="h-16 flex-1 bg-transparent text-[16px] text-paper placeholder:text-paper/35 focus:outline-none"
          />
          <kbd className="rounded-md border border-paper/15 px-1.5 py-0.5 font-mono text-[10.5px] text-paper/50">ESC</kbd>
        </div>

        <ul className="relative max-h-[52vh] overflow-y-auto p-2" role="listbox">
          {filtrados.length === 0 && <li className="px-4 py-10 text-center text-sm text-paper/50">Nada coincide con “{consulta}”.</li>}
          {filtrados.map((comando, indice) => {
            const Icono = comando.icono
            const seleccionado = indice === activo

            return (
              <li key={comando.id} role="option" aria-selected={seleccionado}>
                <button
                  type="button"
                  onMouseEnter={() => setActivo(indice)}
                  onClick={() => elegir(comando)}
                  className="relative flex w-full cursor-pointer items-center gap-4 rounded-2xl px-3 py-3 text-left"
                >
                  {seleccionado && (
                    <motion.span
                      layoutId="paleta-activo"
                      className="absolute inset-0 rounded-2xl border border-paper/10 bg-paper/[0.07]"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      aria-hidden
                    />
                  )}
                  <span
                    className={clsx(
                      'relative grid size-10 shrink-0 place-items-center rounded-xl border transition-colors',
                      seleccionado ? 'border-ochre/40 bg-ochre text-forest-deep' : 'border-paper/10 bg-paper/[0.04] text-paper/60',
                    )}
                  >
                    <Icono className="size-[18px]" aria-hidden />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{comando.texto}</span>
                    <span className="block truncate text-[13px] text-paper/50">{comando.descripcion}</span>
                  </span>
                  <ArrowRight
                    className={clsx(
                      'relative size-4 transition duration-300',
                      seleccionado ? 'translate-x-0 text-ochre opacity-100' : '-translate-x-2 opacity-0',
                    )}
                    aria-hidden
                  />
                </button>
              </li>
            )
          })}
        </ul>

        <div className="relative flex items-center justify-between border-t border-paper/10 px-5 py-3 font-mono text-[10.5px] tracking-[0.12em] text-paper/40 uppercase">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-paper/15 px-1">↑</kbd>
            <kbd className="rounded border border-paper/15 px-1">↓</kbd>
            Moverse
          </span>
          <span className="flex items-center gap-2">
            <CornerDownLeft className="size-3" aria-hidden />
            Abrir
          </span>
        </div>
      </motion.div>
    </div>
  )
}
