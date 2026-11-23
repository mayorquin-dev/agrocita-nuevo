import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { AlertTriangle, FileSpreadsheet, Gauge } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { descargarArchivo } from '@/shared/api/archivos'
import { http } from '@/shared/api/http'
import type { Referencia } from '@/shared/api/http'
import { formato, hoyISO, sumarDias } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import { EmptyState, ErrorPanel, Skeleton } from '@/shared/ui/feedback'
import { Card, CardHeader, PageHeader, Segmented } from '@/shared/ui/layout'
import { useToast } from '@/shared/ui/Toast'

interface Indicadores {
  desde: string
  hasta: string
  resumen: {
    solicitudes: number
    solicitudesAtendidas: number
    solicitudesConVisita: number
    solicitudesATiempo: number
    porcentajeATiempo: number | null
    horasPromedioRespuesta: number | null
    diasPromedioAtencion: number | null
    visitas: number
    visitasCompletadas: number
    visitasCanceladas: number
    visitasConFirma: number
    recetas: number
    recetasAplicadas: number
    recetasNoAplicadas: number
    recetasPendientes: number
    recetasVencidas: number
    porcentajeCumplimientoRecetas: number | null
  }
  porTecnico: {
    tecnico: Referencia
    visitas: number
    completadas: number
    canceladas: number
    recetas: number
    recetasAplicadas: number
    horasPromedioRespuesta: number | null
  }[]
  porZona: { departamento: string; municipio: string; solicitudes: number; visitas: number; pendientes: number }[]
  porCultivo: { tipoCultivo: string; solicitudes: number; recetas: number }[]
  porMes: { mes: string; solicitudes: number; atendidas: number; visitasCompletadas: number }[]
}

type Periodo = '30' | '90' | '180' | '365' | 'otro'

function horas(valor: number | null): string {
  if (valor == null) return '—'
  if (valor < 48) return `${formato.numero(Math.round(valor * 10) / 10)} h`
  return `${formato.numero(Math.round((valor / 24) * 10) / 10)} d`
}

function Tile({ etiqueta, valor, nota, alerta = false }: { etiqueta: string; valor: ReactNode; nota?: ReactNode; alerta?: boolean }) {
  return (
    <div className={clsx('flex flex-col rounded-[20px] border bg-card p-5 shadow-sheet', alerta ? 'border-clay/40' : 'border-line/80')}>
      <p className="eyebrow">{etiqueta}</p>
      <p className="mt-4 font-display text-[2.4rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">{valor}</p>
      {nota && <p className={clsx('mt-2 text-[13px]', alerta ? 'text-clay' : 'text-ink-soft')}>{nota}</p>}
    </div>
  )
}

function BarrasHorizontales({ filas, unidad }: { filas: { etiqueta: string; valor: number; detalle?: string }[]; unidad: string }) {
  const maximo = Math.max(1, ...filas.map((fila) => fila.valor))

  if (filas.length === 0) return <p className="px-5 py-6 text-[14px] text-ink-faint md:px-6">Sin datos en el periodo.</p>

  return (
    <ul className="flex flex-col gap-3 px-5 py-5 md:px-6">
      {filas.map((fila) => (
        <li key={fila.etiqueta} className="group grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3" title={`${fila.etiqueta}: ${fila.valor} ${unidad}${fila.detalle ? ` · ${fila.detalle}` : ''}`}>
          <span className="truncate text-[13.5px] text-ink-soft">{fila.etiqueta}</span>
          <span className="h-3.5 rounded-r-[4px] bg-paper-deep" aria-hidden>
            <span
              className="block h-full rounded-r-[4px] bg-moss transition-[filter] group-hover:brightness-110"
              style={{ width: `${Math.max(2, (fila.valor / maximo) * 100)}%` }}
            />
          </span>
          <span className="min-w-8 text-right font-mono text-[13px] text-ink tabular-nums">{fila.valor}</span>
        </li>
      ))}
    </ul>
  )
}

function SerieMensual({ meses }: { meses: Indicadores['porMes'] }) {
  const maximo = Math.max(1, ...meses.map((mes) => mes.solicitudes))
  const [activo, setActivo] = useState<number | null>(null)

  return (
    <div className="px-5 pt-5 pb-4 md:px-6">
      <div className="relative flex h-48 items-end gap-[2px] border-b border-line" role="img" aria-label="Solicitudes recibidas por mes">
        {meses.map((mes, indice) => (
          <div
            key={mes.mes}
            className="relative flex h-full flex-1 cursor-default items-end justify-center"
            onMouseEnter={() => setActivo(indice)}
            onMouseLeave={() => setActivo(null)}
            onFocus={() => setActivo(indice)}
            onBlur={() => setActivo(null)}
            tabIndex={0}
            aria-label={`${formato.mesAnio(mes.mes)}: ${mes.solicitudes} solicitudes, ${mes.atendidas} atendidas`}
          >
            <span
              className={clsx('w-full max-w-12 rounded-t-[4px] bg-moss transition-[filter]', activo === indice && 'brightness-110')}
              style={{ height: `${(mes.solicitudes / maximo) * 100}%`, minHeight: mes.solicitudes > 0 ? 3 : 0 }}
            />
            {activo === indice && (
              <span className="pointer-events-none absolute bottom-full z-10 mb-2 w-max rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] shadow-lift">
                <span className="block font-semibold text-ink">{formato.mesAnio(mes.mes)}</span>
                <span className="block text-ink-soft">{mes.solicitudes} solicitudes</span>
                <span className="block text-ink-soft">{mes.atendidas} atendidas</span>
                <span className="block text-ink-soft">{mes.visitasCompletadas} visitas completadas</span>
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[2px]">
        {meses.map((mes) => (
          <span key={mes.mes} className="flex-1 truncate text-center font-mono text-[10.5px] text-ink-faint uppercase">
            {formato.mesAnio(mes.mes)}
          </span>
        ))}
      </div>
    </div>
  )
}

export function IndicadoresPage() {
  const toast = useToast()
  const hoy = hoyISO()
  const [periodo, setPeriodo] = useState<Periodo>('90')
  const [rango, setRango] = useState({ desde: sumarDias(hoy, -89), hasta: hoy })
  const [descargando, setDescargando] = useState(false)

  const filtro = periodo === 'otro' ? rango : { desde: sumarDias(hoy, -(Number(periodo) - 1)), hasta: hoy }
  const rangoValido = Boolean(filtro.desde && filtro.hasta && filtro.desde <= filtro.hasta)

  const datos = useQuery({
    queryKey: ['indicadores', filtro],
    queryFn: () => http.get<Indicadores>('/indicadores', { params: filtro }).then((r) => r.data),
    enabled: rangoValido,
    placeholderData: keepPreviousData,
  })

  const exportar = async () => {
    setDescargando(true)
    try {
      await descargarArchivo('/indicadores/excel', `indicadores-${filtro.desde}-a-${filtro.hasta}.xlsx`, filtro)
    } catch (error) {
      toast.error(error)
    } finally {
      setDescargando(false)
    }
  }

  const r = datos.data?.resumen

  return (
    <>
      <PageHeader
        seccion="Administración · Indicadores"
        titulo={
          <>
            Cómo va la <span className="italic">asistencia</span>
          </>
        }
        descripcion="Tiempos de respuesta, trabajo por técnico, cumplimiento de recetas y dónde se concentran los problemas."
        acciones={
          <Button variante="secundario" icono={<FileSpreadsheet className="size-4" />} cargando={descargando} disabled={!rangoValido} onClick={() => void exportar()}>
            Exportar a Excel
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <Segmented
          etiqueta="Periodo"
          valor={periodo}
          alCambiar={setPeriodo}
          opciones={[
            { valor: '30', etiqueta: '30 días' },
            { valor: '90', etiqueta: '90 días' },
            { valor: '180', etiqueta: '6 meses' },
            { valor: '365', etiqueta: '1 año' },
            { valor: 'otro', etiqueta: 'Otro' },
          ]}
        />
        {periodo === 'otro' && (
          <div className="flex gap-3">
            <Input etiqueta="Desde" type="date" className="font-mono" max={rango.hasta} value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} />
            <Input etiqueta="Hasta" type="date" className="font-mono" min={rango.desde} max={hoy} value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} />
          </div>
        )}
      </div>

      {datos.isError ? (
        <ErrorPanel error={datos.error} alReintentar={() => void datos.refetch()} />
      ) : !r || !datos.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : r.solicitudes === 0 && r.visitas === 0 ? (
        <EmptyState icono={<Gauge className="size-5" />} titulo="Sin actividad en el periodo" descripcion="Prueba con un periodo más largo." />
      ) : (
        <div className={clsx('stagger flex flex-col gap-6 transition-opacity', datos.isFetching && 'opacity-70')}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile etiqueta="Atendidas a tiempo" valor={formato.porcentaje(r.porcentajeATiempo)} nota={`${r.solicitudesATiempo} de ${r.solicitudesConVisita} con visita antes de la fecha deseada`} />
            <Tile etiqueta="Respuesta promedio" valor={horas(r.horasPromedioRespuesta)} nota="Desde la solicitud hasta programar la visita" />
            <Tile etiqueta="Atención promedio" valor={r.diasPromedioAtencion == null ? '—' : `${formato.numero(r.diasPromedioAtencion)} d`} nota="Desde la solicitud hasta la visita completada" />
            <Tile etiqueta="Solicitudes" valor={r.solicitudes} nota={`${r.solicitudesAtendidas} atendidas`} />
            <Tile etiqueta="Visitas completadas" valor={r.visitasCompletadas} nota={`${r.visitasConFirma} con firma · ${r.visitasCanceladas} canceladas`} />
            <Tile etiqueta="Cumplimiento de recetas" valor={formato.porcentaje(r.porcentajeCumplimientoRecetas)} nota={`${r.recetasAplicadas} aplicadas · ${r.recetasNoAplicadas} no aplicadas`} />
            <Tile etiqueta="Recetas pendientes" valor={r.recetasPendientes} nota={`de ${r.recetas} emitidas`} />
            <Tile
              etiqueta="Recetas vencidas"
              valor={r.recetasVencidas}
              alerta={r.recetasVencidas > 0}
              nota={
                r.recetasVencidas > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="size-3.5" aria-hidden /> Sin confirmar si se aplicaron
                  </span>
                ) : (
                  'Todo al día'
                )
              }
            />
          </div>

          <Card>
            <CardHeader titulo="Solicitudes por mes" descripcion="Pasa el cursor por cada barra para ver atendidas y visitas." />
            <SerieMensual meses={datos.data.porMes} />
          </Card>

          <Card className="overflow-hidden">
            <CardHeader titulo="Por técnico" descripcion="Visitas programadas en el periodo." />
            {datos.data.porTecnico.length === 0 ? (
              <p className="px-5 py-6 text-[14px] text-ink-faint md:px-6">Sin visitas en el periodo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[14.5px]">
                  <thead>
                    <tr className="border-b border-line bg-paper/60">
                      {['Técnico', 'Visitas', 'Completadas', 'Canceladas', 'Recetas', 'Aplicadas', 'Respuesta'].map((titulo, i) => (
                        <th key={titulo} scope="col" className={clsx('eyebrow px-5 py-3 md:px-6', i > 0 && 'text-right')}>
                          {titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.data.porTecnico.map((fila) => (
                      <tr key={fila.tecnico.id} className="border-b border-line-soft last:border-0">
                        <td className="px-5 py-3 font-semibold md:px-6">{fila.tecnico.nombre}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums md:px-6">{fila.visitas}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums md:px-6">{fila.completadas}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums md:px-6">{fila.canceladas}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums md:px-6">{fila.recetas}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums md:px-6">{fila.recetasAplicadas}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums md:px-6">{horas(fila.horasPromedioRespuesta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader titulo="Solicitudes por zona" descripcion="Municipio y departamento de la finca." />
              <BarrasHorizontales
                unidad="solicitudes"
                filas={datos.data.porZona.slice(0, 10).map((zona) => ({
                  etiqueta: `${zona.municipio}, ${zona.departamento}`,
                  valor: zona.solicitudes,
                  detalle: `${zona.visitas} visitas · ${zona.pendientes} pendientes`,
                }))}
              />
            </Card>
            <Card>
              <CardHeader titulo="Solicitudes por cultivo" descripcion="Tipo de cultivo afectado." />
              <BarrasHorizontales
                unidad="solicitudes"
                filas={datos.data.porCultivo.map((cultivo) => ({
                  etiqueta: cultivo.tipoCultivo,
                  valor: cultivo.solicitudes,
                  detalle: `${cultivo.recetas} recetas`,
                }))}
              />
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
