import clsx from 'clsx'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export type PreferenciaTema = 'claro' | 'oscuro' | 'sistema'

const CLAVE = 'agrocita.tema'

function leer(): PreferenciaTema {
  try {
    const valor = localStorage.getItem(CLAVE)
    return valor === 'claro' || valor === 'oscuro' ? valor : 'sistema'
  } catch {
    return 'sistema'
  }
}

export function aplicarTema(preferencia: PreferenciaTema = leer()) {
  const raiz = document.documentElement

  if (preferencia === 'sistema') raiz.removeAttribute('data-theme')
  else raiz.setAttribute('data-theme', preferencia === 'oscuro' ? 'dark' : 'light')
}

const SIGUIENTE: Record<PreferenciaTema, PreferenciaTema> = { sistema: 'claro', claro: 'oscuro', oscuro: 'sistema' }
const ETIQUETA: Record<PreferenciaTema, string> = { sistema: 'Tema del sistema', claro: 'Tema claro', oscuro: 'Tema oscuro' }
const ICONO = { sistema: Monitor, claro: Sun, oscuro: Moon }

export function BotonTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<PreferenciaTema>(leer)

  useEffect(() => {
    aplicarTema(tema)
    try {
      localStorage.setItem(CLAVE, tema)
    } catch {
      /* sin almacenamiento: el tema dura solo esta visita */
    }
  }, [tema])

  const Icono = ICONO[tema]

  return (
    <button
      type="button"
      onClick={() => setTema(SIGUIENTE[tema])}
      aria-label={`${ETIQUETA[tema]}. Cambiar a ${ETIQUETA[SIGUIENTE[tema]].toLowerCase()}`}
      title={ETIQUETA[tema]}
      className={clsx('grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg transition', className)}
    >
      <Icono className="size-[18px]" aria-hidden />
    </button>
  )
}
