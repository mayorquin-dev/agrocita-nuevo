import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import {
  AlertTriangle,
  Camera,
  CircleCheckBig,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Microscope,
  PenLine,
  Pill,
  Printer,
  ShieldCheck,
  Sprout,
  Tractor,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fincasApi, fincasKeys } from '@/features/fincas/api'
import { productoresApi, productoresKeys } from '@/features/productores/api'
import { descargarArchivo } from '@/shared/api/archivos'
import { http, limpiarParams } from '@/shared/api/http'
import type { Referencia } from '@/shared/api/http'
import { useUsuario } from '@/shared/auth/AuthContext'
import { formato } from '@/shared/lib/format'
import { Badge, EstadoBadge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import { EmptyState, QueryView } from '@/shared/ui/feedback'
import { Card, CardHeader, Dato, PageHeader } from '@/shared/ui/layout'
import { useToast } from '@/shared/ui/Toast'

interface Trazabilidad {
  lote: {
    id: number
    nombre: string
    tipoCultivo: string
    variedad: string | null
    areaManzanas: number | null
    fechaSiembra: string | null
    activo: boolean
    finca: Referencia
    departamento: string
    municipio: string
    direccion: string
    productor: Referencia
    dniProductor: string
  }
  desde: string | null
  hasta: string | null
  generado: string
  cumplimiento: {
    visitasCompletadas: number
    visitasConFirma: number
    visitasConInforme: number
    evidencias: number
    evidenciasConUbicacion: number
    recetas: number
    recetasConSeguimiento: number
    recetasAplicadas: number
    recetasVencidas: number
    inspecciones: number
    puntaje: number
    alertas: string[]
  }
  productos: {
    producto: string
    tipo: string
    dosis: number
    unidad: string
    fechaIndicada: string
    fechaAplicada: string | null
    estado: string
    origen: string
    responsable: string | null
  }[]
  eventos: {
    fecha: string
    tipo: string
    titulo: string
    detalle: string
    responsable: string | null
    estado: string | null
    visitaId: number | null
  }[]
}

const ICONO_EVENTO: Record<string, LucideIcon> = {
  Solicitud: ClipboardList,
  Visita: Tractor,
  Informe: FileText,
  Firma: PenLine,
  Inspeccion: Microscope,
  Receta: Pill,
  Seguimiento: CircleCheckBig,
  Fertilizacion: FlaskConical,
  Aplicacion: FlaskConical,
  Evidencia: Camera,
}

function Selector() {
  const usuario = useUsuario()
  const navegar = useNavigate()
  const esAdmin = usuario.rol === 'AdminEmpresa'
  const [productorId, setProductorId] = useState<number>()
  const [fincaId, setFincaId] = useState<number>()

  const productores = useQuery({
    queryKey: productoresKeys.lista({ tamano: 100 }),
    queryFn: () => productoresApi.listar({ tamano: 100 }),
    enabled: esAdmin,
  })
  const productor = useQuery({
    queryKey: productoresKeys.detalle(productorId ?? 0),
    queryFn: () => productoresApi.obtener(productorId!),
    enabled: esAdmin && Boolean(productorId),
  })
  const misFincas = useQuery({ queryKey: fincasKeys.todas, queryFn: fincasApi.listar, enabled: !esAdmin })
  const finca = useQuery({ queryKey: fincasKeys.detalle(fincaId ?? 0), queryFn: () => fincasApi.obtener(fincaId!), enabled: Boolean(fincaId) })

  const fincas = esAdmin ? productor.data?.fincas : misFincas.data

  return (
    <Card className="animate-rise max-w-3xl">
      <CardHeader titulo="Elige el lote" descripcion="Cada cultivo registrado en una finca es un lote con su propio historial." />
      <div className="grid gap-4 p-5 md:p-6">
        {esAdmin && (
          <Select
            etiqueta="Productor"
            value={productorId ?? ''}
            onChange={(e) => {
              setProductorId(e.target.value ? Number(e.target.value) : undefined)
              setFincaId(undefined)
            }}
          >
            <option value="">{productores.isPending ? 'Cargando…' : 'Selecciona…'}</option>
            {productores.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombreCompleto} · {p.dni}
              </option>
            ))}
          </Select>
        )}
        <Select
          etiqueta="Finca"
          disabled={!fincas}
          value={fincaId ?? ''}
          onChange={(e) => setFincaId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Selecciona…</option>
          {fincas?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre} · {f.municipio}
            </option>
          ))}
        </Select>
        {fincas && fincas.length === 0 && <p className="text-[13.5px] text-ink-soft">No hay fincas registradas.</p>}
        {finca.data && (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {finca.data.cultivos.length === 0 && <li className="text-[13.5px] text-ink-soft">Esta finca no tiene cultivos.</li>}
            {finca.data.cultivos.map((cultivo) => (
              <li key={cultivo.id}>
                <button
                  type="button"
                  onClick={() => navegar(`/trazabilidad/${cultivo.id}`)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-left transition hover:border-forest hover:shadow-sheet"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-moss-soft text-forest-light">
                    <Sprout className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{cultivo.nombre}</span>
                    <span className="block truncate text-[12.5px] text-ink-soft">
                      {cultivo.tipoCultivo}
                      {cultivo.variedad && ` · ${cultivo.variedad}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

function Reporte({ cultivoId }: { cultivoId: number }) {
  const toast = useToast()
  const [rango, setRango] = useState({ desde: '', hasta: '' })
  const [descargando, setDescargando] = useState(false)
  const filtro = limpiarParams(rango)
  const rangoValido = !rango.desde || !rango.hasta || rango.desde <= rango.hasta

  const datos = useQuery({
    queryKey: ['trazabilidad', cultivoId, filtro],
    queryFn: () => http.get<Trazabilidad>(`/trazabilidad/cultivos/${cultivoId}`, { params: filtro }).then((r) => r.data),
    enabled: rangoValido,
    placeholderData: keepPreviousData,
  })

  const exportar = async (nombre: string) => {
    setDescargando(true)
    try {
      await descargarArchivo(`/trazabilidad/cultivos/${cultivoId}/excel`, nombre, filtro)
    } catch (error) {
      toast.error(error)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <QueryView query={datos}>
      {({ lote, cumplimiento: c, productos, eventos, generado }) => (
        <>
          <PageHeader
            seccion="Trazabilidad · Historial del lote"
            volver={{ a: '/trazabilidad', texto: 'Otro lote' }}
            titulo={
              <>
                {lote.nombre} <span className="font-light text-ink-soft italic">· {lote.finca.nombre}</span>
              </>
            }
            descripcion={`Bitácora lista para auditorías de certificación: visitas, inspecciones, productos aplicados, evidencias y firmas.`}
            acciones={
              <div className="flex flex-wrap gap-2.5 print:hidden">
                <Button variante="secundario" icono={<Printer className="size-4" />} onClick={() => window.print()}>
                  Imprimir / PDF
                </Button>
                <Button
                  variante="secundario"
                  icono={<FileSpreadsheet className="size-4" />}
                  cargando={descargando}
                  onClick={() => void exportar(`trazabilidad-${lote.finca.nombre}-${lote.nombre}.xlsx`.replace(/\s+/g, '-').toLowerCase())}
                >
                  Excel
                </Button>
              </div>
            }
          />

          <div className="mb-6 flex flex-wrap items-end gap-3 print:hidden">
            <Input etiqueta="Desde" type="date" className="font-mono" value={rango.desde} max={rango.hasta || undefined} onChange={(e) => setRango({ ...rango, desde: e.target.value })} />
            <Input etiqueta="Hasta" type="date" className="font-mono" value={rango.hasta} min={rango.desde || undefined} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} />
            {(rango.desde || rango.hasta) && (
              <Button variante="fantasma" onClick={() => setRango({ desde: '', hasta: '' })}>
                Todo el historial
              </Button>
            )}
          </div>

          <div className="stagger flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader titulo="Ficha del lote" numero="01" />
                <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 md:px-6">
                  <Dato etiqueta="Cultivo">
                    {lote.tipoCultivo}
                    {lote.variedad && <span className="block text-sm text-ink-soft">Variedad {lote.variedad}</span>}
                  </Dato>
                  <Dato etiqueta="Área sembrada" mono>
                    {formato.area(lote.areaManzanas)}
                  </Dato>
                  <Dato etiqueta="Siembra" mono>
                    {formato.fecha(lote.fechaSiembra)}
                  </Dato>
                  <Dato etiqueta="Estado">{lote.activo ? 'Activo' : 'Inactivo'}</Dato>
                  <Dato etiqueta="Productor">
                    {lote.productor.nombre}
                    <span className="block font-mono text-sm text-ink-soft">DNI {lote.dniProductor}</span>
                  </Dato>
                  <Dato etiqueta="Ubicación">
                    {lote.direccion}
                    <span className="block text-sm text-ink-soft">
                      {lote.municipio}, {lote.departamento}
                    </span>
                  </Dato>
                </dl>
                <p className="border-t border-line-soft px-5 py-3 font-mono text-[11.5px] text-ink-faint md:px-6">Generado {formato.fechaHora(generado)}</p>
              </Card>

              <Card>
                <CardHeader titulo="Cumplimiento" numero="02" descripcion="Firmas, informes, seguimiento de recetas y GPS." />
                <div className="flex flex-col gap-4 px-5 py-5 md:px-6">
                  <div className="flex items-center gap-4">
                    <span
                      className={clsx(
                        'grid size-20 shrink-0 place-items-center rounded-full border-4 font-display text-2xl font-semibold tabular-nums',
                        c.puntaje >= 90 ? 'border-moss text-forest' : c.puntaje >= 60 ? 'border-amber text-amber-deep' : 'border-clay text-clay',
                      )}
                    >
                      {c.puntaje}%
                    </span>
                    <p className="text-[14px] text-ink-soft">
                      {c.alertas.length === 0 ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-forest">
                          <ShieldCheck className="size-4" aria-hidden /> Sin observaciones
                        </span>
                      ) : (
                        `${c.alertas.length} observación(es) para corregir antes de la auditoría.`
                      )}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-[13.5px]">
                    {[
                      ['Visitas con firma', `${c.visitasConFirma}/${c.visitasCompletadas}`],
                      ['Visitas con informe', `${c.visitasConInforme}/${c.visitasCompletadas}`],
                      ['Recetas con seguimiento', `${c.recetasConSeguimiento}/${c.recetas}`],
                      ['Evidencias con GPS', `${c.evidenciasConUbicacion}/${c.evidencias}`],
                      ['Inspecciones', String(c.inspecciones)],
                      ['Recetas aplicadas', String(c.recetasAplicadas)],
                    ].map(([etiqueta, valor]) => (
                      <div key={etiqueta} className="rounded-lg bg-paper px-3 py-2">
                        <dt className="text-ink-soft">{etiqueta}</dt>
                        <dd className="font-mono text-[15px] font-semibold text-ink">{valor}</dd>
                      </div>
                    ))}
                  </dl>
                  {c.alertas.length > 0 && (
                    <ul className="flex flex-col gap-1.5">
                      {c.alertas.map((alerta) => (
                        <li key={alerta} className="flex items-start gap-2 text-[13.5px] text-clay">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          {alerta}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <CardHeader titulo="Productos aplicados" numero="03" descripcion="Recetas y aplicaciones registradas en el lote." />
              {productos.length === 0 ? (
                <p className="px-5 py-6 text-[14px] text-ink-faint md:px-6">Sin productos registrados en el periodo.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-line bg-paper/60">
                        {['Producto', 'Dosis', 'Indicado', 'Aplicado', 'Estado', 'Responsable'].map((titulo) => (
                          <th key={titulo} scope="col" className="eyebrow px-5 py-3 md:px-6">
                            {titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((p, i) => (
                        <tr key={`${p.producto}-${i}`} className="border-b border-line-soft last:border-0">
                          <td className="px-5 py-3 md:px-6">
                            <span className="font-semibold">{p.producto}</span>
                            <span className="block text-[12.5px] text-ink-soft">
                              {p.tipo} · {p.origen}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono md:px-6">
                            {formato.numero(p.dosis)} {p.unidad}
                          </td>
                          <td className="px-5 py-3 font-mono md:px-6">{formato.fecha(p.fechaIndicada)}</td>
                          <td className="px-5 py-3 font-mono md:px-6">{formato.fecha(p.fechaAplicada)}</td>
                          <td className="px-5 py-3 md:px-6">{p.estado === 'Vencida' ? <Badge tono="clay">Vencida</Badge> : <EstadoBadge estado={p.estado} />}</td>
                          <td className="px-5 py-3 text-ink-soft md:px-6">{p.responsable ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader titulo="Bitácora" numero="04" descripcion="Todo lo ocurrido en el lote, en orden cronológico." />
              {eventos.length === 0 ? (
                <div className="p-5 md:p-6">
                  <EmptyState compacto titulo="Sin eventos en el periodo" />
                </div>
              ) : (
                <ol className="relative px-5 py-5 md:px-6">
                  <span className="absolute top-7 bottom-7 left-[38px] w-px bg-line md:left-[42px]" aria-hidden />
                  {eventos.map((evento, i) => {
                    const Icono = ICONO_EVENTO[evento.tipo] ?? ClipboardList

                    return (
                      <li key={`${evento.tipo}-${evento.fecha}-${i}`} className="relative flex gap-4 pb-5 last:pb-0 print:break-inside-avoid">
                        <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border border-line bg-card text-forest">
                          <Icono className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pt-1">
                          <p className="font-mono text-[12px] text-ink-faint">{formato.fechaHora(evento.fecha)}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 font-semibold">
                            {evento.titulo}
                            {evento.estado && <EstadoBadge estado={evento.estado} />}
                          </p>
                          {evento.detalle && <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{evento.detalle}</p>}
                          <p className="mt-0.5 text-[12.5px] text-ink-faint">
                            {evento.responsable}
                            {evento.visitaId && (
                              <>
                                {evento.responsable && ' · '}
                                <Link to={`/visitas/${evento.visitaId}`} className="font-semibold text-forest hover:underline print:no-underline">
                                  V-{String(evento.visitaId).padStart(4, '0')}
                                </Link>
                              </>
                            )}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </QueryView>
  )
}

export function TrazabilidadPage() {
  const cultivoId = Number(useParams().cultivoId)

  if (cultivoId > 0) return <Reporte key={cultivoId} cultivoId={cultivoId} />

  return (
    <>
      <PageHeader
        seccion="Trazabilidad"
        titulo={
          <>
            Historial por <span className="italic">lote</span>
          </>
        }
        descripcion="Reúne visitas, inspecciones, productos aplicados, fotos con GPS y firmas de un cultivo para auditorías de Rainforest, orgánico o exportación."
      />
      <Selector />
    </>
  )
}
