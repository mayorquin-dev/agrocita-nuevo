import clsx from 'clsx'
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'

export const salida = [0.22, 1, 0.36, 1] as const

interface RevelarProps {
  children: ReactNode
  className?: string
  retraso?: number
  desde?: 'abajo' | 'izquierda' | 'derecha' | 'escala'
}

const origenes = {
  abajo: { y: 36 },
  izquierda: { x: -40 },
  derecha: { x: 40 },
  escala: { scale: 0.94 },
}

export function Revelar({ children, className, retraso = 0, desde = 'abajo' }: RevelarProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: 'blur(6px)', ...origenes[desde] }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: salida, delay: retraso }}
    >
      {children}
    </motion.div>
  )
}

interface TituloAnimadoProps {
  texto: string
  acento?: string
  className?: string
  retraso?: number
  enVista?: boolean
}

export function TituloAnimado({ texto, acento, className, retraso = 0, enVista = false }: TituloAnimadoProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const visible = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const activo = enVista ? visible : true
  const palabras = texto.split(' ')
  const acentos = acento ? acento.split(' ') : []

  return (
    <span ref={ref} className={clsx('block', className)}>
      <span className="sr-only">{[texto, acento].filter(Boolean).join(' ')}</span>
      <span aria-hidden>
        {[...palabras.map((p) => ({ p, a: false })), ...acentos.map((p) => ({ p, a: true }))].map(({ p, a }, indice) => (
          <span key={`${p}-${indice}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className={clsx('inline-block', a && 'italic')}
              initial={{ y: '110%', rotate: 4 }}
              animate={activo ? { y: '0%', rotate: 0 } : undefined}
              transition={{ duration: 1, ease: salida, delay: retraso + indice * 0.07 }}
            >
              {a ? <em>{p}</em> : p}
            </motion.span>
            {' '}
          </span>
        ))}
      </span>
    </span>
  )
}

function PalabraScrub({ palabra, progreso, rango }: { palabra: string; progreso: MotionValue<number>; rango: [number, number] }) {
  const opacidad = useTransform(progreso, rango, [0.14, 1])
  const desenfoque = useTransform(progreso, rango, ['blur(3px)', 'blur(0px)'])

  return (
    <motion.span style={{ opacity: opacidad, filter: desenfoque }} className="inline-block">
      {palabra}&nbsp;
    </motion.span>
  )
}

export function TextoScrub({ texto, className }: { texto: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const palabras = texto.split(' ')

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden>
        {palabras.map((palabra, indice) => {
          const inicio = indice / palabras.length
          return <PalabraScrub key={indice} palabra={palabra} progreso={scrollYProgress} rango={[inicio, inicio + 1 / palabras.length]} />
        })}
      </span>
    </p>
  )
}

export function Magnetico({ children, className, fuerza = 0.3 }: { children: ReactNode; className?: string; fuerza?: number }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18 })
  const sy = useSpring(y, { stiffness: 220, damping: 18 })

  const mover = (evento: MouseEvent<HTMLDivElement>) => {
    const caja = evento.currentTarget.getBoundingClientRect()
    x.set((evento.clientX - caja.left - caja.width / 2) * fuerza)
    y.set((evento.clientY - caja.top - caja.height / 2) * fuerza)
  }

  return (
    <motion.div
      className={clsx('inline-block', className)}
      style={{ x: sx, y: sy }}
      onMouseMove={mover}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

const ANCHO = 1440
const ALTO = 900
const HORIZONTE = 400
const FUGA_X = 720
const SURCOS = 26
const FILAS = 16

interface Pin {
  x: number
  y: number
  etiqueta: string
  retraso: number
}

const PINES: Pin[] = [
  { x: 790, y: 530, etiqueta: 'El Encino · 09:00', retraso: 1.6 },
  { x: 1120, y: 470, etiqueta: 'Los Pinos · Calidad 92%', retraso: 2.1 },
  { x: 300, y: 470, etiqueta: 'La Esperanza · Informe', retraso: 2.6 },
]

export function Campo({ className, pines = true }: { className?: string; pines?: boolean }) {
  const filas = useRef<(SVGLineElement | null)[]>([])
  const reducido = useReducedMotion()

  useAnimationFrame((tiempo) => {
    if (reducido) return
    const t = (tiempo / 5200) % 1

    filas.current.forEach((linea, indice) => {
      if (!linea) return
      const avance = (indice + t) / FILAS
      const y = HORIZONTE + (ALTO + 40 - HORIZONTE) * avance ** 2.3
      linea.setAttribute('y1', String(y))
      linea.setAttribute('y2', String(y))
      linea.setAttribute('stroke-opacity', String(Math.min(0.55, avance * 0.7)))
    })
  })

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id="campo-sol" cx="50%" cy="44%" r="50%">
          <stop offset="0%" stopColor="#c5f05a" stopOpacity="0.32" />
          <stop offset="40%" stopColor="#4c8a5c" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#08170f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="campo-suelo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c5f05a" stopOpacity="0" />
          <stop offset="100%" stopColor="#c5f05a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="campo-niebla" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#08170f" stopOpacity="1" />
          <stop offset="100%" stopColor="#08170f" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={ANCHO} height={ALTO} fill="url(#campo-sol)" />

      {[0, 1, 2].map((capa) => (
        <motion.path
          key={capa}
          d={`M 0 ${HORIZONTE - 10 - capa * 26} C 240 ${HORIZONTE - 70 - capa * 40}, 420 ${HORIZONTE - 20 - capa * 10}, 640 ${HORIZONTE - 60 - capa * 34} S 1060 ${HORIZONTE - 110 - capa * 30}, 1440 ${HORIZONTE - 40 - capa * 30}`}
          fill="none"
          stroke="#c5f05a"
          strokeOpacity={0.22 - capa * 0.05}
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, ease: salida, delay: 0.2 + capa * 0.2 }}
        />
      ))}

      <motion.line
        x1="0"
        x2={ANCHO}
        y1={HORIZONTE}
        y2={HORIZONTE}
        stroke="#c5f05a"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: salida }}
      />

      <g stroke="url(#campo-suelo)" strokeWidth="1">
        {Array.from({ length: SURCOS + 1 }, (_, indice) => {
          const desplazamiento = indice - SURCOS / 2
          return (
            <motion.line
              key={indice}
              x1={FUGA_X + desplazamiento * 14}
              y1={HORIZONTE}
              x2={FUGA_X + desplazamiento * 150}
              y2={ALTO + 40}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.8, ease: salida, delay: 0.3 + Math.abs(desplazamiento) * 0.035 }}
            />
          )
        })}
      </g>

      <g stroke="#c5f05a" strokeWidth="1">
        {Array.from({ length: FILAS }, (_, indice) => {
          const avance = indice / FILAS
          const y = HORIZONTE + (ALTO + 40 - HORIZONTE) * avance ** 2.3
          return (
            <line
              key={indice}
              ref={(nodo) => {
                filas.current[indice] = nodo
              }}
              x1="0"
              x2={ANCHO}
              y1={y}
              y2={y}
              strokeOpacity={Math.min(0.55, avance * 0.7)}
            />
          )
        })}
      </g>

      <rect y={HORIZONTE} width={ANCHO} height="60" fill="url(#campo-niebla)" />

      {pines &&
        PINES.map((pin) => (
          <motion.g
            key={pin.etiqueta}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: salida, delay: pin.retraso }}
            className="max-md:hidden"
          >
            <motion.circle
              cx={pin.x}
              cy={pin.y}
              r="10"
              fill="none"
              stroke="#c5f05a"
              strokeWidth="1.5"
              animate={reducido ? undefined : { r: [8, 34], opacity: [0.9, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: pin.retraso }}
            />
            <circle cx={pin.x} cy={pin.y} r="5" fill="#c5f05a" />
            <line x1={pin.x} x2={pin.x} y1={pin.y - 6} y2={pin.y - 58} stroke="#c5f05a" strokeOpacity="0.6" />
            <rect x={pin.x - 4} y={pin.y - 92} rx="17" height="34" width={pin.etiqueta.length * 9.6 + 34} fill="#08170f" fillOpacity="0.82" stroke="#f5f4ee" strokeOpacity="0.16" />
            <circle cx={pin.x + 13} cy={pin.y - 75} r="3.5" fill="#c5f05a" />
            <text
              x={pin.x + 25}
              y={pin.y - 70.5}
              fill="#f5f4ee"
              fillOpacity="0.9"
              fontFamily="Geist Mono Variable, ui-monospace, monospace"
              fontSize="13"
              letterSpacing="0.5"
            >
              {pin.etiqueta}
            </text>
          </motion.g>
        ))}
    </svg>
  )
}
