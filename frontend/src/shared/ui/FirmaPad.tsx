import { Eraser } from 'lucide-react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

const LONGITUD_MINIMA = 60

export interface FirmaPadRef {
  limpiar: () => void
  aPng: () => string | null
}

interface Props {
  alCambiar?: (vacia: boolean) => void
  etiqueta?: string
}

export const FirmaPad = forwardRef<FirmaPadRef, Props>(function FirmaPad({ alCambiar, etiqueta = 'Firma del productor' }, ref) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)
  const ultimo = useRef<{ x: number; y: number } | null>(null)
  const trazos = useRef(0)
  const [vacia, setVacia] = useState(true)

  const preparar = useCallback(() => {
    const canvas = lienzo.current
    if (!canvas) return

    const escala = window.devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = Math.round(width * escala)
    canvas.height = Math.round(height * escala)

    const ctx = canvas.getContext('2d')!
    ctx.setTransform(escala, 0, 0, escala, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0d1b14'
    trazos.current = 0
    setVacia(true)
    alCambiar?.(true)
  }, [alCambiar])

  useEffect(() => {
    preparar()
  }, [preparar])

  useImperativeHandle(
    ref,
    () => ({
      limpiar: preparar,
      aPng: () => (trazos.current < LONGITUD_MINIMA || !lienzo.current ? null : lienzo.current.toDataURL('image/png')),
    }),
    [preparar],
  )

  const punto = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    const caja = evento.currentTarget.getBoundingClientRect()
    return { x: evento.clientX - caja.left, y: evento.clientY - caja.top }
  }

  const empezar = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    evento.currentTarget.setPointerCapture(evento.pointerId)
    dibujando.current = true
    ultimo.current = punto(evento)
  }

  const mover = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current || !ultimo.current) return
    const ctx = evento.currentTarget.getContext('2d')!
    const actual = punto(evento)

    ctx.beginPath()
    ctx.moveTo(ultimo.current.x, ultimo.current.y)
    ctx.lineTo(actual.x, actual.y)
    ctx.stroke()

    trazos.current += Math.hypot(actual.x - ultimo.current.x, actual.y - ultimo.current.y)
    ultimo.current = actual

    if (vacia && trazos.current >= LONGITUD_MINIMA) {
      setVacia(false)
      alCambiar?.(false)
    }
  }

  const terminar = () => {
    dibujando.current = false
    ultimo.current = null
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-ink-soft">{etiqueta}</span>
        <button
          type="button"
          onClick={preparar}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[12.5px] font-semibold text-ink-soft transition hover:bg-paper-deep hover:text-ink"
        >
          <Eraser className="size-3.5" aria-hidden />
          Borrar
        </button>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-line bg-white">
        <canvas
          ref={lienzo}
          role="img"
          aria-label={`${etiqueta}. Dibuja la firma con el dedo o el mouse.`}
          className="block h-44 w-full cursor-crosshair touch-none"
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          onPointerLeave={terminar}
        />
        <span className="pointer-events-none absolute inset-x-6 bottom-9 border-b border-dashed border-[#b9bdb6]" aria-hidden />
        {vacia && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] text-[#7a847d]">
            Firma aquí con el dedo
          </span>
        )}
      </div>
    </div>
  )
})
