import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronDown, History } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formato } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/Badge'
import type { Tono } from '@/shared/ui/Badge'
import { EmptyState, QueryView } from '@/shared/ui/feedback'
import { Card, CardHeader } from '@/shared/ui/layout'
import { auditoriaApi, auditoriaKeys, ENTIDADES, nombreCampo, RUTA_ENTIDAD } from './api'
import type { RegistroAuditoria } from './api'

const TONO_ACCION: Record<RegistroAuditoria['accion'], Tono> = {
  Creado: 'moss',
  Modificado: 'lake',
  Eliminado: 'clay',
}

function Valor({ texto, tachado = false }: { texto: string | null; tachado?: boolean }) {
  if (texto === null || texto === '') return <span className="text-ink-faint italic">vacío</span>
  return <span className={clsx('font-mono text-[12.5px] break-all', tachado && 'text-ink-faint line-through')}>{texto}</span>
}

export function RegistroAuditoriaItem({ registro, mostrarEntidad = true }: { registro: RegistroAuditoria; mostrarEntidad?: boolean }) {
  const [abierto, setAbierto] = useState(registro.cambios.length <= 3 && registro.accion === 'Modificado')
  const ruta = RUTA_ENTIDAD[registro.entidad]?.(registro.entidadId)
  const resumen = registro.cambios.slice(0, 3).map((c) => nombreCampo(c.campo)).join(', ')

  return (
    <li className="border-b border-line-soft last:border-0">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left transition hover:bg-paper/60 md:px-6"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tono={TONO_ACCION[registro.accion]}>{registro.accion}</Badge>
            {mostrarEntidad && (
              <span className="text-[14.5px] font-semibold">
                {ENTIDADES[registro.entidad] ?? registro.entidad} <span className="font-mono text-[12.5px] text-ink-soft">#{registro.entidadId}</span>
              </span>
            )}
            <span className="text-[13px] text-ink-soft">
              por <span className="font-semibold text-ink">{registro.usuario}</span>
              {registro.rol && <span className="text-ink-faint"> · {registro.rol}</span>}
            </span>
          </div>
          <p className="mt-1 truncate text-[12.5px] text-ink-faint">
            <span className="font-mono">{formato.fechaHora(registro.fecha)}</span>
            {resumen && ` · ${resumen}${registro.cambios.length > 3 ? '…' : ''}`}
          </p>
        </div>
        <ChevronDown className={clsx('mt-1 size-4 shrink-0 text-ink-faint transition', abierto && 'rotate-180')} aria-hidden />
      </button>
      {abierto && (
        <div className="animate-fade px-5 pb-4 md:px-6">
          {registro.cambios.length === 0 ? (
            <p className="text-[13px] text-ink-faint">Sin detalle de campos.</p>
          ) : (
            <dl className="grid gap-1.5 rounded-xl border border-line-soft bg-paper/60 p-3">
              {registro.cambios.map((cambio) => (
                <div key={cambio.campo} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-3">
                  <dt className="text-[12.5px] font-semibold text-ink-soft">{nombreCampo(cambio.campo)}</dt>
                  <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    {registro.accion === 'Modificado' ? (
                      <>
                        <Valor texto={cambio.antes} tachado />
                        <span className="text-ochre-deep" aria-label="cambió a">→</span>
                        <Valor texto={cambio.despues} />
                      </>
                    ) : (
                      <Valor texto={registro.accion === 'Eliminado' ? cambio.antes : cambio.despues} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {ruta && mostrarEntidad && (
            <Link to={ruta} className="mt-2 inline-block text-[13px] font-semibold text-forest hover:underline">
              Abrir registro
            </Link>
          )}
        </div>
      )}
    </li>
  )
}

export function HistorialCambios({ entidad, entidadId }: { entidad: string; entidadId: number }) {
  const filtro = { entidad, entidadId: String(entidadId), tamano: 50 }
  const registros = useQuery({ queryKey: auditoriaKeys.lista(filtro), queryFn: () => auditoriaApi.listar(filtro) })

  return (
    <Card className="overflow-hidden">
      <CardHeader titulo="Historial de cambios" descripcion="Quién modificó este registro y cuándo." />
      <QueryView query={registros} filas={2}>
        {(datos) =>
          datos.items.length === 0 ? (
            <div className="p-5 md:p-6">
              <EmptyState compacto icono={<History className="size-5" />} titulo="Sin cambios registrados" descripcion="El historial empieza a guardarse desde esta versión." />
            </div>
          ) : (
            <ul>
              {datos.items.map((registro) => (
                <RegistroAuditoriaItem key={registro.id} registro={registro} mostrarEntidad={false} />
              ))}
            </ul>
          )
        }
      </QueryView>
    </Card>
  )
}
