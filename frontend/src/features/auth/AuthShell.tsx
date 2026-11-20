import { ArrowUpRight } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Marca } from '@/shared/ui/Marca'
import { Campo, salida } from '@/shared/ui/motion'

interface AuthShellProps {
  children: ReactNode
  frase: ReactNode
  nota: string
}

export function AuthShell({ children, frase, nota }: AuthShellProps) {
  const puntoX = useMotionValue(0)
  const puntoY = useMotionValue(0)
  const suaveX = useSpring(puntoX, { stiffness: 60, damping: 20 })
  const suaveY = useSpring(puntoY, { stiffness: 60, damping: 20 })
  const campoX = useTransform(suaveX, (valor) => valor * -30)
  const campoY = useTransform(suaveY, (valor) => valor * -18)
  const giroX = useTransform(suaveY, (valor) => valor * -4)
  const giroY = useTransform(suaveX, (valor) => valor * 5)

  const alMover = (evento: MouseEvent<HTMLElement>) => {
    puntoX.set(evento.clientX / window.innerWidth - 0.5)
    puntoY.set(evento.clientY / window.innerHeight - 0.5)
  }

  return (
    <div onMouseMove={alMover} className="relative min-h-dvh overflow-hidden bg-forest-deep text-paper">
      <motion.div style={{ x: campoX, y: campoY }} className="pointer-events-none absolute -inset-10" aria-hidden>
        <Campo className="size-full" />
      </motion.div>
      <div className="grano pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(8_23_15/0.55)_0%,transparent_30%,transparent_55%,rgb(8_23_15/0.85)_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-dvh max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
        <motion.header
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: salida }}
        >
          <Link to="/bienvenida" aria-label="AgroCita, conocer la plataforma">
            <Marca claro compacto />
          </Link>
          <Link
            to="/bienvenida"
            className="group flex items-center gap-1.5 rounded-full border border-paper/15 bg-forest-deep/40 px-4 py-2 text-[13px] font-medium text-paper/75 backdrop-blur transition hover:border-ochre/60 hover:text-paper"
          >
            Conoce AgroCita
            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </Link>
        </motion.header>

        <div className="grid flex-1 items-end gap-10 pt-10 pb-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:gap-16 lg:pt-0">
          <div className="max-w-[640px] self-end lg:pb-10">
            <motion.p
              className="eyebrow flex items-center gap-3 !text-ochre"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: salida, delay: 0.3 }}
            >
              <motion.span
                className="h-px w-10 origin-left bg-ochre"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: salida, delay: 0.4 }}
              />
              Asistencia técnica agrícola · Honduras
            </motion.p>
            <motion.h1
              className="mt-5 text-[2.6rem] leading-[0.95] font-semibold text-balance sm:text-[3.4rem] xl:text-[4.6rem]"
              initial={{ opacity: 0, y: 50, filter: 'blur(14px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: salida, delay: 0.35 }}
            >
              {frase}
            </motion.h1>
            <motion.p
              className="mt-6 hidden max-w-md text-[16px] leading-relaxed text-paper/65 sm:block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: salida, delay: 0.6 }}
            >
              {nota}
            </motion.p>
          </div>

          <div className="[perspective:1400px]">
            <motion.main
              style={{ rotateX: giroX, rotateY: giroY }}
              className="relative overflow-hidden rounded-[30px] border border-paper/20 bg-paper p-7 text-ink shadow-[0_60px_120px_-40px_rgb(0_0_0/0.85)] sm:p-10"
              initial={{ opacity: 0, y: 80, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: salida, delay: 0.25 }}
            >
              <motion.span
                className="absolute inset-x-0 top-0 h-1 origin-left bg-gradient-to-r from-forest via-moss to-ochre"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: salida, delay: 0.9 }}
                aria-hidden
              />
              <div className="pointer-events-none absolute -top-24 -right-24 size-60 rounded-full bg-ochre/25 blur-3xl" aria-hidden />
              <div className="relative">{children}</div>
            </motion.main>
          </div>
        </div>

        <motion.footer
          className="hidden items-center justify-between border-t border-paper/10 pt-5 font-mono text-[10.5px] tracking-[0.14em] text-paper/45 uppercase lg:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <span>14.0723° N · 87.1921° O</span>
          <span className="flex items-center gap-6">
            <span>Solicitud</span>
            <span className="h-px w-6 bg-paper/20" />
            <span>Agenda</span>
            <span className="h-px w-6 bg-paper/20" />
            <span>Visita</span>
            <span className="h-px w-6 bg-paper/20" />
            <span className="text-ochre">Informe</span>
          </span>
        </motion.footer>
      </div>
    </div>
  )
}
