import clsx from 'clsx'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  KeyRound,
  Layers,
  MousePointer2,
  ShieldCheck,
  Sprout,
  Tractor,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { rutaInicial, useAuth } from '@/shared/auth/AuthContext'
import { Contours } from '@/shared/ui/layout'
import { Marca } from '@/shared/ui/Marca'
import { Campo, Magnetico, Revelar, salida, TextoScrub, TituloAnimado } from '@/shared/ui/motion'

function useDestino() {
  const { usuario } = useAuth()
  return usuario ? { a: rutaInicial(usuario.rol), texto: 'Ir a mi panel' } : { a: '/login', texto: 'Entrar a mi cuenta' }
}

function BotonAcento({ a, children }: { a: string; children: ReactNode }) {
  return (
    <Magnetico>
      <Link
        to={a}
        className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-ochre pr-2 pl-7 text-[15px] font-semibold text-forest-deep shadow-[0_18px_40px_-14px_rgb(197_240_90/0.7)] transition-shadow hover:shadow-[0_24px_60px_-12px_rgb(197_240_90/0.9)]"
      >
        <span className="relative">{children}</span>
        <span className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-forest-deep text-ochre">
          <ArrowRight className="size-4 transition-transform duration-500 ease-[var(--ease-salida)] group-hover:translate-x-8" aria-hidden />
          <ArrowRight className="absolute size-4 -translate-x-8 transition-transform duration-500 ease-[var(--ease-salida)] group-hover:translate-x-0" aria-hidden />
        </span>
      </Link>
    </Magnetico>
  )
}

function Cabecera() {
  const destino = useDestino()
  const { scrollY } = useScroll()
  const [solida, setSolida] = useState(false)

  useMotionValueEvent(scrollY, 'change', (valor) => setSolida(valor > 60))

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5"
      initial={{ y: -90 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, ease: salida, delay: 0.2 }}
    >
      <div
        className={clsx(
          'mx-auto flex h-16 max-w-[1360px] items-center justify-between rounded-full px-3 pl-5 transition-[background-color,border-color,box-shadow] duration-500',
          solida
            ? 'border border-paper/10 bg-forest-deep/80 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)] backdrop-blur-xl'
            : 'border border-transparent',
        )}
      >
        <Link to="/bienvenida" aria-label="AgroCita">
          <Marca claro compacto />
        </Link>
        <nav className="hidden items-center gap-1 text-[13.5px] font-medium text-paper/65 md:flex" aria-label="Secciones">
          {[
            ['#recorrido', 'Cómo funciona'],
            ['#roles', 'Roles'],
            ['#organizaciones', 'Organizaciones'],
          ].map(([href, texto]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 transition hover:bg-paper/[0.06] hover:text-paper">
              {texto}
            </a>
          ))}
        </nav>
        <Link
          to={destino.a}
          className="group flex h-11 items-center gap-2 rounded-full bg-paper px-5 text-[13.5px] font-semibold text-forest-deep transition hover:bg-ochre"
        >
          {destino.texto}
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </Link>
      </div>
    </motion.header>
  )
}

function Portada() {
  const destino = useDestino()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const escalaCampo = useTransform(scrollYProgress, [0, 1], [1, 1.35])
  const subirCampo = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const subirTexto = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const desvanecer = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-forest-deep text-paper">
      <motion.div style={{ scale: escalaCampo, y: subirCampo }} className="absolute inset-0 origin-[50%_45%]" aria-hidden>
        <Campo className="size-full" />
      </motion.div>
      <div className="grano pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(8_23_15/0.5)_0%,transparent_25%,transparent_50%,rgb(8_23_15/0.92)_100%)]" aria-hidden />

      <motion.div
        style={{ y: subirTexto, opacity: desvanecer }}
        className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-10 sm:px-8 lg:px-12 lg:pb-14"
      >
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <motion.p
              className="eyebrow flex items-center gap-3 !text-ochre"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: salida, delay: 0.5 }}
            >
              <span className="h-px w-10 bg-ochre" />
              Asistencia técnica agrícola · Honduras
            </motion.p>
            <h1 className="mt-6 text-[3rem] leading-[0.92] font-semibold tracking-[-0.045em] sm:text-[4.6rem] lg:text-[6.4rem] xl:text-[7.4rem]">
              <TituloAnimado texto="Cada visita," retraso={0.55} />
              <TituloAnimado texto="en su" acento="surco." retraso={0.75} className="text-paper" />
            </h1>
          </div>

          <motion.div
            className="max-w-sm lg:pb-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: salida, delay: 1.2 }}
          >
            <p className="text-[16px] leading-relaxed text-paper/70">
              Solicitudes, agenda, inspecciones e informes de cada finca en un solo historial que la organización, el técnico y el
              productor consultan por igual.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <BotonAcento a={destino.a}>{destino.texto}</BotonAcento>
              <Link
                to="/registro"
                className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-paper/80 underline decoration-paper/25 underline-offset-[6px] transition hover:text-paper hover:decoration-ochre"
              >
                Tengo un código
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-12 flex items-center justify-between border-t border-paper/10 pt-5 font-mono text-[10.5px] tracking-[0.14em] text-paper/45 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          <span>14.0723° N · 87.1921° O</span>
          <span className="flex items-center gap-3">
            Desliza
            <span className="relative h-8 w-px overflow-hidden bg-paper/15">
              <motion.span
                className="absolute inset-x-0 top-0 h-3 bg-ochre"
                animate={{ y: [-12, 32] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </span>
          </span>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Manifiesto() {
  return (
    <section className="relative overflow-hidden bg-paper px-5 py-32 sm:px-8 lg:px-12 lg:py-48">
      <Contours animado className="pointer-events-none absolute -top-40 -right-64 size-[760px] text-moss/20" />
      <div className="relative mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Revelar>
          <p className="eyebrow flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-ochre shadow-[0_0_0_3px_rgb(197_240_90/0.35)]" />
            El problema
          </p>
        </Revelar>
        <TextoScrub
          className="font-display text-[1.9rem] leading-[1.12] font-medium tracking-[-0.035em] text-ink sm:text-[2.6rem] lg:text-[3.4rem]"
          texto="Antes, la visita vivía en una libreta, el informe en un correo y el seguimiento en la memoria del técnico. AgroCita pone todo en una sola línea de tiempo por finca: lo que se pidió, lo que se vio y lo que se recomendó."
        />
      </div>
    </section>
  )
}

interface Paso {
  numero: string
  etiqueta: string
  titulo: string
  texto: string
  icono: LucideIcon
}

const PASOS: Paso[] = [
  {
    numero: '01',
    etiqueta: 'Solicitud',
    titulo: 'El productor pide la visita',
    texto: 'Elige la finca, los cultivos y una fecha deseada. La solicitud llega a su organización al instante.',
    icono: ClipboardList,
  },
  {
    numero: '02',
    etiqueta: 'Agenda',
    titulo: 'La organización la programa',
    texto: 'El administrador asigna un técnico y una fecha. El productor ve la confirmación en su panel.',
    icono: CalendarDays,
  },
  {
    numero: '03',
    etiqueta: 'Visita',
    titulo: 'El técnico inspecciona',
    texto: 'Registra calidad, fertilización y observaciones de cada cultivo, directamente en campo.',
    icono: Tractor,
  },
  {
    numero: '04',
    etiqueta: 'Informe',
    titulo: 'Queda en el historial',
    texto: 'Cada informe se suma al historial del cultivo. Nada se pierde y nada se sobrescribe.',
    icono: FileText,
  },
]

function PanelSolicitud() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Nueva solicitud</p>
        <span className="rounded-full bg-amber-soft px-2.5 py-1 font-mono text-[10px] tracking-wider text-amber-deep uppercase">Borrador</span>
      </div>
      {[
        ['Finca', 'El Encino · Santa Bárbara'],
        ['Fecha deseada', 'Miércoles 18 de noviembre'],
      ].map(([etiqueta, valor], indice) => (
        <motion.div
          key={etiqueta}
          className="rounded-2xl border border-line bg-card px-4 py-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: salida, delay: 0.1 + indice * 0.12 }}
        >
          <p className="text-[12px] font-semibold text-ink-faint">{etiqueta}</p>
          <p className="mt-0.5 text-[15px] font-semibold">{valor}</p>
        </motion.div>
      ))}
      <div className="flex flex-wrap gap-2">
        {['Café', 'Plátano', 'Aguacate'].map((cultivo, indice) => (
          <motion.span
            key={cultivo}
            className={clsx(
              'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold',
              indice < 2 ? 'border-forest bg-forest text-paper' : 'border-line text-ink-soft',
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.4 + indice * 0.08 }}
          >
            {cultivo}
          </motion.span>
        ))}
      </div>
      <div className="relative mt-2">
        <motion.div
          className="flex h-12 items-center justify-center rounded-xl bg-forest text-[14px] font-semibold text-paper"
          animate={{ scale: [1, 1, 0.96, 1] }}
          transition={{ duration: 0.5, delay: 1.3, times: [0, 0.4, 0.6, 1] }}
        >
          Enviar solicitud
        </motion.div>
        <motion.span
          className="absolute top-1/2 left-1/2 text-ink"
          initial={{ x: 120, y: 60, opacity: 0 }}
          animate={{ x: 10, y: 4, opacity: 1 }}
          transition={{ duration: 0.9, ease: salida, delay: 0.6 }}
          aria-hidden
        >
          <MousePointer2 className="size-5 fill-paper" />
        </motion.span>
      </div>
    </div>
  )
}

function PanelAgenda() {
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Agenda · semana 47</p>
        <p className="font-mono text-[11px] text-ink-faint">Téc. R. Paz</p>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {dias.map((dia, indice) => (
          <div key={dia} className="flex flex-col gap-2">
            <p className={clsx('text-center font-mono text-[10.5px] tracking-wider uppercase', indice === 2 ? 'text-forest' : 'text-ink-faint')}>
              {dia} {16 + indice}
            </p>
            {[0, 1, 2].map((hora) => (
              <div key={hora} className="relative h-16 rounded-xl border border-dashed border-line bg-paper/60">
                {indice === 0 && hora === 1 && <div className="absolute inset-1 rounded-lg bg-lake-soft" />}
                {indice === 3 && hora === 0 && <div className="absolute inset-1 rounded-lg bg-moss-soft" />}
                {indice === 2 && hora === 0 && (
                  <motion.div
                    className="absolute inset-1 z-10 flex flex-col justify-between rounded-lg bg-forest p-2 text-paper shadow-lift"
                    initial={{ x: -150, y: 90, rotate: -8, opacity: 0 }}
                    animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.4 }}
                  >
                    <span className="font-mono text-[9.5px] text-ochre">09:00</span>
                    <span className="truncate text-[11px] font-semibold">El Encino</span>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <motion.div
        className="mt-4 flex items-center gap-2 rounded-xl bg-ochre-soft px-3 py-2.5 text-[13px] font-semibold text-ochre-deep"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: salida, delay: 1.1 }}
      >
        <Check className="size-4" aria-hidden />
        Visita programada y notificada al productor
      </motion.div>
    </div>
  )
}

function PanelVisita() {
  const puntos = ['Estado fitosanitario del lote', 'Muestreo de calidad del grano', 'Plan de fertilización', 'Observaciones del técnico']

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Visita en curso</p>
        <span className="flex items-center gap-1.5 rounded-full bg-lake-soft px-2.5 py-1 font-mono text-[10px] tracking-wider text-lake uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-lake" />
          En campo
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {puntos.map((punto, indice) => (
          <li key={punto} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3">
            <motion.span
              className="grid size-6 shrink-0 place-items-center rounded-full border border-line"
              initial={{ backgroundColor: 'rgb(255 255 255)', borderColor: 'rgb(223 222 212)' }}
              animate={{ backgroundColor: 'rgb(15 42 29)', borderColor: 'rgb(15 42 29)' }}
              transition={{ duration: 0.3, delay: 0.4 + indice * 0.35 }}
            >
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 + indice * 0.35 }}>
                <Check className="size-3.5 text-ochre" aria-hidden />
              </motion.span>
            </motion.span>
            <span className="text-[14px] font-medium">{punto}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl bg-forest-deep p-4 text-paper">
        <div className="flex items-end justify-between">
          <p className="font-mono text-[10.5px] tracking-[0.14em] text-paper/55 uppercase">Calidad del lote</p>
          <p className="font-display text-3xl leading-none font-semibold">
            92<span className="text-lg text-ochre">%</span>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper/10">
          <motion.div
            className="h-full rounded-full bg-ochre"
            initial={{ width: 0 }}
            animate={{ width: '92%' }}
            transition={{ duration: 1.4, ease: salida, delay: 1.6 }}
          />
        </div>
      </div>
    </div>
  )
}

function PanelInforme() {
  const informes = [
    { fecha: '18 nov 2026', texto: 'Roya controlada, aplicar fertilización foliar', actual: true },
    { fecha: '02 sep 2026', texto: 'Floración uniforme, calidad 88%' },
    { fecha: '14 jun 2026', texto: 'Inicio de plan nutricional' },
  ]

  return (
    <div>
      <p className="eyebrow">Historial · Café, lote norte</p>
      <ol className="relative mt-5 flex flex-col gap-3 pl-6">
        <motion.span
          className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-line"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, ease: salida }}
          aria-hidden
        />
        {informes.map((informe, indice) => (
          <motion.li
            key={informe.fecha}
            className="relative"
            initial={{ opacity: 0, y: indice === 0 ? -40 : 0, scale: indice === 0 ? 1.05 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: salida, delay: indice === 0 ? 0.6 : 0.1 + indice * 0.1 }}
          >
            <span
              className={clsx(
                'absolute top-4 -left-6 size-[15px] rounded-full border-2',
                informe.actual ? 'border-ochre bg-forest shadow-[0_0_0_4px_rgb(197_240_90/0.3)]' : 'border-line bg-card',
              )}
              aria-hidden
            />
            <div className={clsx('rounded-2xl border px-4 py-3', informe.actual ? 'border-forest bg-forest text-paper shadow-lift' : 'border-line bg-card')}>
              <p className={clsx('font-mono text-[10.5px] tracking-wider uppercase', informe.actual ? 'text-ochre' : 'text-ink-faint')}>
                {informe.fecha}
              </p>
              <p className="mt-1 text-[14px] font-semibold">{informe.texto}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

function SegmentoProgreso({ progreso, desde, hasta }: { progreso: MotionValue<number>; desde: number; hasta: number }) {
  const ancho = useTransform(progreso, [desde, hasta], ['0%', '100%'])

  return (
    <div className="relative h-[3px] overflow-hidden rounded-full bg-line">
      <motion.span className="absolute inset-y-0 left-0 bg-forest" style={{ width: ancho }} />
    </div>
  )
}

const PANELES = [PanelSolicitud, PanelAgenda, PanelVisita, PanelInforme]

function Recorrido() {
  const ref = useRef<HTMLElement>(null)
  const [activo, setActivo] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progreso = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  useMotionValueEvent(scrollYProgress, 'change', (valor) => {
    setActivo(Math.min(PASOS.length - 1, Math.max(0, Math.floor(valor * PASOS.length))))
  })

  const Panel = PANELES[activo]
  const paso = PASOS[activo]

  return (
    <section id="recorrido" ref={ref} className="relative bg-paper-deep" style={{ height: `${PASOS.length * 90 + 40}vh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(13_27_20/0.07)_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-20">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-ochre shadow-[0_0_0_3px_rgb(197_240_90/0.35)]" />
              Cómo funciona
            </p>

            <div className="mt-6 flex items-start gap-5 lg:mt-10">
              <div className="relative font-display text-[5.5rem] leading-[0.8] font-semibold tracking-[-0.06em] text-forest sm:text-[8rem] lg:text-[11rem]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={paso.numero}
                    className="block"
                    initial={{ y: '60%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={{ y: '-60%', opacity: 0 }}
                    transition={{ duration: 0.6, ease: salida }}
                  >
                    {paso.numero}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="pt-2 lg:pt-5">
                <p className="font-mono text-[11px] tracking-[0.16em] text-ink-faint uppercase">/ 0{PASOS.length}</p>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={paso.numero}
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease: salida }}
                className="mt-6 max-w-lg"
              >
                <h2 className="text-[2rem] leading-[1] font-semibold sm:text-[2.6rem] lg:text-[3.2rem]">{paso.titulo}</h2>
                <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">{paso.texto}</p>
              </motion.div>
            </AnimatePresence>

            <ol className="mt-10 hidden max-w-lg grid-cols-4 gap-3 sm:grid">
              {PASOS.map((item, indice) => {
                const Icono = item.icono
                return (
                  <li key={item.numero} className="flex flex-col gap-2">
                    <SegmentoProgreso progreso={progreso} desde={indice / PASOS.length} hasta={(indice + 1) / PASOS.length} />
                    <span
                      className={clsx(
                        'flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-300',
                        indice === activo ? 'text-forest' : 'text-ink-faint',
                      )}
                    >
                      <Icono className="size-3.5" aria-hidden />
                      {item.etiqueta}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="relative [perspective:1600px]">
            <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-ochre/30 via-moss/10 to-transparent blur-2xl" aria-hidden />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activo}
                className="relative min-h-[420px] rounded-[30px] border border-line bg-paper p-6 shadow-[0_50px_100px_-40px_rgb(8_23_15/0.45)] sm:p-7"
                initial={{ opacity: 0, rotateX: 18, y: 50, scale: 0.94 }}
                animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, rotateX: -12, y: -40, scale: 0.96 }}
                transition={{ duration: 0.55, ease: salida }}
              >
                <div className="mb-5 flex items-center gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-line" />
                  <span className="size-2.5 rounded-full bg-line" />
                  <span className="size-2.5 rounded-full bg-line" />
                  <span className="ml-3 h-6 flex-1 rounded-full bg-paper-deep" />
                </div>
                <Panel />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

interface RolInfo {
  rol: string
  titulo: string
  texto: string
  puntos: string[]
  icono: LucideIcon
  oscuro?: boolean
}

const ROLES: RolInfo[] = [
  {
    rol: 'Productor',
    titulo: 'Pide asistencia sin llamadas',
    texto: 'Registra sus fincas y cultivos, solicita visitas y consulta el historial técnico de cada lote.',
    puntos: ['Fincas y cultivos', 'Solicitudes', 'Informes'],
    icono: UserRound,
  },
  {
    rol: 'Técnico',
    titulo: 'Su ruta del día, en orden',
    texto: 'Ve las visitas asignadas, registra calidad y fertilización, y cierra cada visita con su informe.',
    puntos: ['Mis visitas', 'Inspección', 'Cierre'],
    icono: Sprout,
    oscuro: true,
  },
  {
    rol: 'Administrador',
    titulo: 'La agenda bajo control',
    texto: 'Recibe solicitudes, asigna técnicos, mantiene los catálogos e invita a nuevos productores.',
    puntos: ['Agenda', 'Técnicos', 'Catálogos'],
    icono: CalendarDays,
  },
  {
    rol: 'Plataforma',
    titulo: 'Muchas organizaciones, una base',
    texto: 'Cada organización con su plan, sus datos aislados y su propio equipo de trabajo.',
    puntos: ['Organizaciones', 'Planes', 'Suscripción'],
    icono: Layers,
    oscuro: true,
  },
]

function Roles() {
  const [abierto, setAbierto] = useState(0)

  return (
    <section id="roles" className="bg-paper px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-3xl text-[2.6rem] leading-[0.95] font-semibold sm:text-[3.6rem] lg:text-[4.6rem]">
            <TituloAnimado texto="Cuatro miradas," enVista />
            <TituloAnimado texto="un mismo" acento="registro." enVista retraso={0.15} />
          </h2>
          <Revelar retraso={0.2} className="max-w-sm">
            <p className="text-[16px] leading-relaxed text-ink-soft">
              Cada persona entra a su propio panel, con lo que necesita ver y nada más. El historial es el mismo para todos.
            </p>
          </Revelar>
        </div>

        <Revelar retraso={0.1} className="mt-14">
          <div className="flex flex-col gap-3 lg:h-[520px] lg:flex-row">
            {ROLES.map((rol, indice) => {
              const Icono = rol.icono
              const expandido = indice === abierto

              return (
                <motion.button
                  key={rol.rol}
                  type="button"
                  layout
                  onMouseEnter={() => setAbierto(indice)}
                  onFocus={() => setAbierto(indice)}
                  onClick={() => setAbierto(indice)}
                  aria-expanded={expandido}
                  className={clsx(
                    'relative flex min-h-[220px] cursor-pointer flex-col overflow-hidden rounded-[28px] border p-6 text-left max-lg:!basis-auto lg:min-h-0 lg:p-8',
                    rol.oscuro ? 'border-forest-deep bg-forest-deep text-paper' : 'border-line bg-paper-deep text-ink',
                  )}
                  style={{ flexGrow: expandido ? 2.4 : 1, flexBasis: 0 }}
                  transition={{ duration: 0.7, ease: salida }}
                >
                  {rol.oscuro && <div className="reticula pointer-events-none absolute inset-0" aria-hidden />}
                  <Contours
                    className={clsx(
                      'pointer-events-none absolute -right-40 -bottom-48 size-[520px] transition-transform duration-[1.4s] ease-[var(--ease-salida)]',
                      rol.oscuro ? 'text-ochre/20' : 'text-moss/25',
                      expandido ? 'scale-110 rotate-12' : 'scale-90',
                    )}
                  />
                  <motion.div layout="position" className="relative flex items-center justify-between gap-4">
                    <span
                      className={clsx(
                        'grid size-12 place-items-center rounded-2xl transition-colors duration-500',
                        expandido ? 'bg-ochre text-forest-deep' : rol.oscuro ? 'bg-paper/10 text-paper' : 'bg-card text-forest',
                      )}
                    >
                      <Icono className="size-5" aria-hidden />
                    </span>
                    <span className={clsx('font-mono text-[11px] tracking-[0.14em]', rol.oscuro ? 'text-paper/45' : 'text-ink-faint')}>
                      0{indice + 1}
                    </span>
                  </motion.div>

                  <motion.p
                    layout="position"
                    className={clsx(
                      'relative mt-auto pt-10 font-display leading-none font-semibold tracking-[-0.04em] whitespace-nowrap transition-[font-size] duration-500',
                      expandido ? 'text-[1.8rem] lg:text-[2.6rem]' : 'text-[1.8rem] lg:text-[1.6rem]',
                    )}
                  >
                    {rol.rol}
                  </motion.p>

                  <AnimatePresence initial={false}>
                    {expandido && (
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5, ease: salida }}
                      >
                        <div className="max-w-md pt-4">
                          <p className={clsx('text-[17px] font-semibold', rol.oscuro ? 'text-ochre' : 'text-forest')}>{rol.titulo}</p>
                          <p className={clsx('mt-2 text-[15px] leading-relaxed', rol.oscuro ? 'text-paper/65' : 'text-ink-soft')}>{rol.texto}</p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {rol.puntos.map((punto) => (
                              <span
                                key={punto}
                                className={clsx(
                                  'rounded-full border px-3 py-1 font-mono text-[10.5px] tracking-[0.1em] uppercase',
                                  rol.oscuro ? 'border-paper/15 text-paper/70' : 'border-line text-ink-soft',
                                )}
                              >
                                {punto}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </Revelar>
      </div>
    </section>
  )
}

const ORGANIZACIONES = [
  { nombre: 'AgroConsulta', plan: 'Plan Profesional', productores: 'Productores vinculados', color: 'bg-ochre' },
  { nombre: 'AgroServicios', plan: 'Plan Básico', productores: 'Técnicos en campo', color: 'bg-lake' },
  { nombre: 'Cooperativa del Valle', plan: 'Plan Profesional', productores: 'Fincas registradas', color: 'bg-amber' },
]

function Organizaciones() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const abanico = useTransform(scrollYProgress, [0.15, 0.5], [0, 1])

  return (
    <section id="organizaciones" ref={ref} className="relative overflow-hidden bg-forest-deep px-5 py-28 text-paper sm:px-8 lg:px-12 lg:py-40">
      <div className="reticula pointer-events-none absolute inset-0" aria-hidden />
      <div className="grano pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 -left-40 size-[520px] rounded-full bg-moss/25 blur-[120px]" aria-hidden />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative order-2 h-[440px] [perspective:1400px] lg:order-1">
          {ORGANIZACIONES.map((organizacion, indice) => (
            <CartaOrganizacion key={organizacion.nombre} indice={indice} abanico={abanico} {...organizacion} />
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <p className="eyebrow flex items-center gap-2 !text-ochre">
            <span className="h-px w-8 bg-ochre" />
            Multiempresa
          </p>
          <h2 className="mt-6 text-[2.6rem] leading-[0.95] font-semibold sm:text-[3.4rem] lg:text-[4.2rem]">
            <TituloAnimado texto="Una plataforma," enVista />
            <TituloAnimado texto="cada organización" acento="aparte." enVista retraso={0.15} />
          </h2>
          <Revelar retraso={0.2}>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-paper/65">
              Las organizaciones de asistencia técnica trabajan sobre la misma plataforma, pero cada una solo ve sus productores, sus
              técnicos y sus informes.
            </p>
          </Revelar>
          <ul className="mt-10 flex flex-col divide-y divide-paper/10 border-y border-paper/10">
            {[
              { icono: ShieldCheck, texto: 'Datos aislados por organización' },
              { icono: KeyRound, texto: 'Acceso por rol en cada sesión' },
              { icono: Building2, texto: 'Código de invitación para productores' },
            ].map(({ icono: Icono, texto }, indice) => (
              <Revelar key={texto} retraso={0.1 * indice} desde="izquierda">
                <li className="group flex items-center gap-4 py-4">
                  <span className="grid size-10 place-items-center rounded-xl border border-paper/10 bg-paper/[0.04] text-ochre transition group-hover:bg-ochre group-hover:text-forest-deep">
                    <Icono className="size-[18px]" aria-hidden />
                  </span>
                  <span className="text-[16px] font-medium">{texto}</span>
                </li>
              </Revelar>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

interface CartaOrganizacionProps {
  nombre: string
  plan: string
  productores: string
  color: string
  indice: number
  abanico: MotionValue<number>
}

function CartaOrganizacion({ nombre, plan, productores, color, indice, abanico }: CartaOrganizacionProps) {
  const centro = indice - 1
  const x = useTransform(abanico, [0, 1], [0, centro * 70])
  const y = useTransform(abanico, [0, 1], [indice * -14, Math.abs(centro) * 30 - 10])
  const rotate = useTransform(abanico, [0, 1], [0, centro * 9])
  const rotateX = useTransform(abanico, [0, 1], [30, 0])

  return (
    <motion.div
      style={{ x, y, rotate, rotateX, zIndex: indice === 1 ? 3 : 2 - Math.abs(centro) }}
      className="absolute top-1/2 left-1/2 -mt-[150px] -ml-[150px] w-[300px] rounded-[26px] border border-paper/15 bg-paper p-5 text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] sm:-ml-[170px] sm:w-[340px]"
    >
      <div className="flex items-center justify-between">
        <span className={clsx('grid size-11 place-items-center rounded-xl font-display text-lg font-semibold text-forest-deep', color)}>
          {nombre.charAt(0)}
        </span>
        <span className="rounded-full bg-paper-deep px-2.5 py-1 font-mono text-[10px] tracking-wider text-ink-soft uppercase">{plan}</span>
      </div>
      <p className="mt-10 font-display text-2xl font-semibold tracking-[-0.03em]">{nombre}</p>
      <p className="mt-1 text-[13px] text-ink-soft">{productores}</p>
      <div className="mt-5 grid grid-cols-6 items-end gap-1.5">
        {[40, 62, 48, 76, 58, 88].map((alto, barra) => (
          <span key={barra} className="rounded-sm bg-forest/80" style={{ height: `${alto * 0.6}px`, opacity: 0.35 + barra * 0.11 }} />
        ))}
      </div>
    </motion.div>
  )
}

function Cierre() {
  const destino = useDestino()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const marcaY = useTransform(scrollYProgress, [0.3, 1], ['40%', '0%'])

  return (
    <section ref={ref} className="relative overflow-hidden bg-paper px-5 pt-36 sm:px-8 lg:px-12 lg:pt-52">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center text-center">
        <Revelar>
          <span className="grid size-14 place-items-center rounded-2xl bg-forest text-ochre shadow-lift">
            <Sprout className="size-6" aria-hidden />
          </span>
        </Revelar>
        <h2 className="mt-8 max-w-4xl text-[2.6rem] leading-[0.95] font-semibold sm:text-[3.8rem] lg:text-[5rem]">
          <TituloAnimado texto="Tu próxima visita empieza" enVista />
          <TituloAnimado texto="con una" acento="solicitud." enVista retraso={0.2} />
        </h2>
        <Revelar retraso={0.3} className="mt-10 flex flex-wrap items-center justify-center gap-5">
          <BotonAcento a={destino.a}>{destino.texto}</BotonAcento>
          <Link
            to="/registro"
            className="inline-flex h-14 items-center rounded-full border border-line px-7 text-[15px] font-semibold text-ink transition hover:border-forest hover:bg-forest hover:text-paper"
          >
            Registrar mi finca
          </Link>
        </Revelar>
      </div>

      <footer className="relative mx-auto mt-32 max-w-[1440px]">
        <div className="flex flex-col justify-between gap-4 border-t border-line py-6 font-mono text-[10.5px] tracking-[0.14em] text-ink-faint uppercase sm:flex-row">
          <span>AgroCita · Asistencia técnica agrícola</span>
          <span>Hecho en Honduras</span>
        </div>
        <motion.p
          style={{ y: marcaY }}
          className="pointer-events-none -mb-[0.22em] text-center font-display text-[22vw] leading-[0.8] font-semibold tracking-[-0.07em] text-transparent select-none [-webkit-text-stroke:1px_var(--color-forest)] lg:text-[19vw]"
          aria-hidden
        >
          Agro<span className="font-serif font-normal italic [-webkit-text-stroke:0] text-forest">Cita</span>
        </motion.p>
      </footer>
    </section>
  )
}

export function LandingPage() {
  const { scrollYProgress } = useScroll()
  const barra = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })

  return (
    <div className="bg-paper">
      <motion.div style={{ scaleX: barra }} className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-ochre" aria-hidden />
      <Cabecera />
      <main>
        <Portada />
        <Manifiesto />
        <Recorrido />
        <Roles />
        <Organizaciones />
        <Cierre />
      </main>
    </div>
  )
}
