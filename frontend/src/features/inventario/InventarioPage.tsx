import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Package, Pencil, Plus, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { productoresApi, productoresKeys } from '@/features/productores/api'
import { recetasApi, recetasKeys, TIPOS_PRODUCTO } from '@/features/visitas/api'
import type { Receta } from '@/features/visitas/api'
import { comoNumero, comoTextoOpcional, useZodForm } from '@/shared/forms/zod'
import { useAccion, useFormMutation } from '@/shared/forms/mutations'
import { formato, hoyISO } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/Badge'
import type { Tono } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { FormError, Input, Select, Textarea } from '@/shared/ui/Field'
import { EmptyState, QueryView } from '@/shared/ui/feedback'
import { Card, CardHeader, PageHeader, Segmented } from '@/shared/ui/layout'
import { Modal, ModalActions } from '@/shared/ui/Modal'
import { Pagination } from '@/shared/ui/Table'
import { insumoSchema, inventarioApi, inventarioKeys } from './api'
import type { Insumo, Movimiento, TipoMovimiento } from './api'

const INVALIDAR = [inventarioKeys.insumos, ['recetas'], ['visitas', 'recetas'], ['trazabilidad']]

const TONO_MOVIMIENTO: Record<TipoMovimiento, Tono> = { Entrada: 'moss', Entrega: 'lake', Ajuste: 'amber' }

function InsumoForm({ insumo, alCerrar }: { insumo?: Insumo; alCerrar: () => void }) {
  const form = useZodForm(insumoSchema, {
    nombre: insumo?.nombre ?? '',
    tipo: insumo?.tipo,
    unidad: insumo?.unidad ?? 'kg',
    presentacion: insumo?.presentacion ?? undefined,
    stockMinimo: insumo?.stockMinimo ?? undefined,
    activo: insumo?.activo ?? true,
  })

  const { enviar, errorGeneral, cargando } = useFormMutation(form, {
    mutationFn: (valores) => (insumo ? inventarioApi.actualizar(insumo.id, valores) : inventarioApi.crear(valores)),
    invalidar: [inventarioKeys.insumos],
    mensaje: insumo ? 'Insumo actualizado.' : 'Insumo creado.',
    alExito: alCerrar,
  })

  const {
    register,
    formState: { errors, isValid },
  } = form

  return (
    <Modal abierto alCerrar={alCerrar} ancho="sm" titulo={insumo ? 'Editar insumo' : 'Nuevo insumo'} descripcion="La existencia se mueve con entradas, entregas y ajustes.">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <FormError mensaje={errorGeneral} />
        <Input etiqueta="Nombre" placeholder="Oxicloruro de cobre 50 WP" error={errors.nombre?.message} {...register('nombre')} />
        <div className="grid grid-cols-2 gap-4">
          <Select etiqueta="Tipo" error={errors.tipo?.message} {...register('tipo', comoTextoOpcional)}>
            <option value="">Selecciona…</option>
            {TIPOS_PRODUCTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </Select>
          <Input etiqueta="Unidad" placeholder="kg, L, qq" error={errors.unidad?.message} {...register('unidad')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input etiqueta="Presentación" opcional placeholder="Bolsa 1 kg" error={errors.presentacion?.message} {...register('presentacion', comoTextoOpcional)} />
          <Input etiqueta="Stock mínimo" opcional type="number" step="0.001" min="0" className="font-mono" ayuda="Avisa cuando quede poco." error={errors.stockMinimo?.message} {...register('stockMinimo', comoNumero)} />
        </div>
        {insumo && (
          <label className="flex cursor-pointer items-center gap-3 text-[14px]">
            <input type="checkbox" className="size-4 accent-[#4c8a5c]" {...register('activo')} />
            Activo (los técnicos pueden recetarlo y se puede entregar)
          </label>
        )}
        <ModalActions>
          <Button variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="submit" cargando={cargando} disabled={!isValid}>
            Guardar
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}

interface MovimientoFormProps {
  insumo?: Insumo
  receta?: Receta
  tipoInicial?: TipoMovimiento
  alCerrar: () => void
}

export function MovimientoForm({ insumo: insumoInicial, receta, tipoInicial = 'Entrada', alCerrar }: MovimientoFormProps) {
  const [tipo, setTipo] = useState<TipoMovimiento>(receta ? 'Entrega' : tipoInicial)
  const [insumoId, setInsumoId] = useState<number | undefined>(insumoInicial?.id ?? receta?.insumo?.id)
  const [productorId, setProductorId] = useState<number | undefined>(receta?.productor.id)
  const [recetaId, setRecetaId] = useState<number | undefined>(receta?.id)
  const [cantidad, setCantidad] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)

  const insumos = useQuery({ queryKey: inventarioKeys.insumos, queryFn: () => inventarioApi.listar() })
  const productores = useQuery({
    queryKey: productoresKeys.lista({ tamano: 100 }),
    queryFn: () => productoresApi.listar({ tamano: 100 }),
    enabled: tipo === 'Entrega' && !receta,
  })
  const pendientes = useQuery({
    queryKey: recetasKeys.lista({ estado: 'Pendiente' }),
    queryFn: () => recetasApi.listar({ estado: 'Pendiente' }),
    enabled: tipo === 'Entrega' && !receta,
  })

  const insumo = insumos.data?.find((i) => i.id === insumoId) ?? insumoInicial
  const recetasDelProductor = (pendientes.data ?? []).filter(
    (r) => r.productor.id === productorId && (r.insumo === null || r.insumo.id === insumoId),
  )

  const registrar = useAccion({
    mutationFn: () =>
      inventarioApi.movimiento(insumoId!, {
        tipo,
        cantidad: Number(cantidad),
        productorId: tipo === 'Entrega' ? productorId : undefined,
        recetaId: tipo === 'Entrega' ? recetaId : undefined,
        fecha,
        nota: nota.trim() || undefined,
      }),
    invalidar: INVALIDAR,
    mensaje: tipo === 'Entrega' ? 'Entrega registrada.' : tipo === 'Entrada' ? 'Entrada registrada.' : 'Ajuste registrado.',
    alExito: alCerrar,
  })

  const guardar = () => {
    const valor = Number(cantidad)

    if (!insumoId) return setError('Elige el insumo.')
    if (!cantidad || Number.isNaN(valor) || valor === 0) return setError('Escribe una cantidad válida.')
    if (tipo !== 'Ajuste' && valor < 0) return setError('La cantidad debe ser mayor que cero.')
    if (tipo === 'Entrega' && !productorId) return setError('Elige a qué productor se entrega.')
    if (tipo === 'Entrega' && insumo && valor > insumo.stock) return setError(`Solo hay ${formato.numero(insumo.stock)} ${insumo.unidad} en existencia.`)
    if (tipo === 'Ajuste' && !nota.trim()) return setError('Explica el motivo del ajuste.')
    if (fecha > hoyISO()) return setError('La fecha no puede ser futura.')

    setError(null)
    registrar.mutate()
  }

  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      titulo={receta ? 'Entregar insumo de la receta' : 'Registrar movimiento'}
      descripcion={receta ? `${receta.producto} · ${receta.productor.nombre} · ${receta.finca.nombre}` : 'Entradas suman existencia; entregas a productores la restan.'}
    >
      <div className="flex flex-col gap-4">
        <FormError mensaje={error} />
        {!receta && (
          <Segmented
            etiqueta="Tipo de movimiento"
            valor={tipo}
            alCambiar={setTipo}
            opciones={[
              { valor: 'Entrada', etiqueta: 'Entrada' },
              { valor: 'Entrega', etiqueta: 'Entrega' },
              { valor: 'Ajuste', etiqueta: 'Ajuste' },
            ]}
          />
        )}
        <Select etiqueta="Insumo" value={insumoId ?? ''} disabled={Boolean(receta?.insumo)} onChange={(e) => setInsumoId(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">Selecciona…</option>
          {insumos.data
            ?.filter((i) => i.activo || i.id === insumoId)
            .map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} · {formato.numero(i.stock)} {i.unidad} en existencia
              </option>
            ))}
        </Select>
        {tipo === 'Entrega' && !receta && (
          <>
            <Select
              etiqueta="Productor"
              value={productorId ?? ''}
              onChange={(e) => {
                setProductorId(e.target.value ? Number(e.target.value) : undefined)
                setRecetaId(undefined)
              }}
            >
              <option value="">Selecciona…</option>
              {productores.data?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreCompleto} · {p.dni}
                </option>
              ))}
            </Select>
            {productorId && (
              <Select etiqueta="Receta que respalda la entrega" opcional value={recetaId ?? ''} onChange={(e) => setRecetaId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Sin receta</option>
                {recetasDelProductor.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.producto} · {formatoDosis(r)} · {r.cultivo.nombre} · V-{String(r.visitaId).padStart(4, '0')}
                  </option>
                ))}
              </Select>
            )}
          </>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            etiqueta={tipo === 'Ajuste' ? 'Cantidad (+ suma, − resta)' : 'Cantidad'}
            type="number"
            step="0.001"
            inputMode="decimal"
            className="font-mono"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            ayuda={insumo ? `En existencia: ${formato.numero(insumo.stock)} ${insumo.unidad}` : undefined}
          />
          <Input etiqueta="Fecha" type="date" max={hoyISO()} className="font-mono" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <Textarea
          etiqueta={tipo === 'Ajuste' ? 'Motivo del ajuste' : 'Nota'}
          opcional={tipo !== 'Ajuste'}
          rows={2}
          maxLength={300}
          placeholder={tipo === 'Entrada' ? 'Factura, proveedor…' : tipo === 'Entrega' ? 'Recibió…' : 'Conteo físico, producto vencido…'}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        <ModalActions>
          <Button variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button cargando={registrar.isPending} onClick={guardar}>
            Registrar {tipo.toLowerCase()}
          </Button>
        </ModalActions>
      </div>
    </Modal>
  )
}

function formatoDosis(receta: Receta) {
  return `${formato.numero(receta.dosis)} ${receta.unidad}`
}

function TablaMovimientos({ filtro }: { filtro: { insumoId?: number; tipo?: TipoMovimiento } }) {
  const [pagina, setPagina] = useState(1)
  const consulta = { ...filtro, pagina, tamano: 20 }
  const movimientos = useQuery({
    queryKey: inventarioKeys.movimientos(consulta),
    queryFn: () => inventarioApi.movimientos(consulta),
    placeholderData: keepPreviousData,
  })

  return (
    <QueryView query={movimientos} filas={4}>
      {(datos) =>
        datos.items.length === 0 ? (
          <div className="p-6">
            <EmptyState compacto icono={<Package className="size-5" />} titulo="Sin movimientos" descripcion="Registra la primera entrada de un insumo." />
          </div>
        ) : (
          <>
            <ul>
              {datos.items.map((m) => (
                <FilaMovimiento key={m.id} movimiento={m} />
              ))}
            </ul>
            <Pagination pagina={datos.pagina} tamano={datos.tamano} total={datos.total} alCambiar={setPagina} />
          </>
        )
      }
    </QueryView>
  )
}

export function FilaMovimiento({ movimiento: m, mostrarInsumo = true }: { movimiento: Movimiento; mostrarInsumo?: boolean }) {
  const signo = m.tipo === 'Entrada' ? '+' : m.tipo === 'Entrega' ? '−' : m.cantidad > 0 ? '+' : ''

  return (
    <li className="flex flex-col gap-1 border-b border-line-soft px-5 py-3.5 last:border-0 sm:flex-row sm:items-center sm:gap-4 md:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tono={TONO_MOVIMIENTO[m.tipo]}>{m.tipo}</Badge>
          {mostrarInsumo && <span className="font-semibold">{m.insumo.nombre}</span>}
          {m.productor && <span className="text-[13.5px] text-ink-soft">→ {m.productor.nombre}</span>}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-ink-faint">
          <span className="font-mono">{formato.fecha(m.fecha)}</span> · {m.registradoPor}
          {m.visitaId && (
            <>
              {' · '}
              <Link to={`/visitas/${m.visitaId}`} className="font-semibold text-forest hover:underline">
                receta V-{String(m.visitaId).padStart(4, '0')}
              </Link>
            </>
          )}
          {m.nota && ` · ${m.nota}`}
        </p>
      </div>
      <div className="text-right font-mono tabular-nums">
        <p className={clsx('text-[15px] font-semibold', m.tipo === 'Entrega' ? 'text-lake' : m.tipo === 'Entrada' ? 'text-forest' : 'text-amber-deep')}>
          {signo}
          {formato.numero(Math.abs(m.cantidad))} {m.unidad}
        </p>
        <p className="text-[11.5px] text-ink-faint">quedan {formato.numero(m.stockResultante)}</p>
      </div>
    </li>
  )
}

export function InventarioPage() {
  const insumos = useQuery({ queryKey: inventarioKeys.insumos, queryFn: () => inventarioApi.listar() })
  const [vista, setVista] = useState<'insumos' | 'movimientos' | 'entregas'>('insumos')
  const [editando, setEditando] = useState<{ insumo?: Insumo } | null>(null)
  const [moviendo, setMoviendo] = useState<{ insumo?: Insumo; tipo: TipoMovimiento } | null>(null)

  const bajos = insumos.data?.filter((i) => i.activo && i.stockBajo) ?? []

  return (
    <>
      <PageHeader
        seccion="Administración · Inventario"
        titulo={
          <>
            Insumos y <span className="italic">entregas</span>
          </>
        }
        descripcion="Lo que la organización compra y entrega a cada productor. Las entregas pueden ligarse a la receta que las respalda."
        acciones={
          <>
            <Button variante="secundario" icono={<ArrowUpFromLine className="size-4" />} onClick={() => setMoviendo({ tipo: 'Entrega' })}>
              Entregar
            </Button>
            <Button icono={<Plus className="size-4" />} onClick={() => setEditando({})}>
              Nuevo insumo
            </Button>
          </>
        }
      />

      {bajos.length > 0 && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber/40 bg-amber-soft px-4 py-3 text-[14px] text-amber-deep" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Stock bajo: {bajos.map((i) => `${i.nombre} (${formato.numero(i.stock)} ${i.unidad})`).join(', ')}.
          </span>
        </div>
      )}

      <div className="mb-5">
        <Segmented
          etiqueta="Vista"
          valor={vista}
          alCambiar={setVista}
          opciones={[
            { valor: 'insumos', etiqueta: 'Insumos' },
            { valor: 'entregas', etiqueta: 'Entregas' },
            { valor: 'movimientos', etiqueta: 'Todos los movimientos' },
          ]}
        />
      </div>

      {vista === 'insumos' ? (
        <QueryView query={insumos}>
          {(lista) =>
            lista.length === 0 ? (
              <EmptyState
                icono={<Package className="size-5" />}
                titulo="Todavía no hay insumos"
                descripcion="Registra los productos que la organización compra y entrega: fertilizantes, fungicidas, semillas…"
                accion={
                  <Button variante="acento" icono={<Plus className="size-4" />} onClick={() => setEditando({})}>
                    Crear el primer insumo
                  </Button>
                }
              />
            ) : (
              <ul className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {lista.map((insumo) => (
                  <li key={insumo.id} className={clsx('flex flex-col rounded-2xl border bg-card p-5 shadow-sheet', insumo.activo ? 'border-line' : 'border-line opacity-60')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[17px] leading-tight font-semibold">{insumo.nombre}</p>
                        <p className="mt-0.5 text-[13px] text-ink-soft">
                          {insumo.tipo}
                          {insumo.presentacion && ` · ${insumo.presentacion}`}
                        </p>
                      </div>
                      {!insumo.activo ? <Badge>Inactivo</Badge> : insumo.stockBajo ? <Badge tono="amber">Stock bajo</Badge> : null}
                    </div>
                    <p className="mt-4 font-display text-[2.2rem] leading-none font-semibold tabular-nums">
                      {formato.numero(insumo.stock)} <span className="text-lg font-normal text-ink-soft">{insumo.unidad}</span>
                    </p>
                    <p className="mt-1 text-[12.5px] text-ink-faint">
                      {insumo.stockMinimo != null ? `Mínimo ${formato.numero(insumo.stockMinimo)} ${insumo.unidad}` : 'Sin mínimo definido'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
                      <Button tamano="sm" variante="secundario" icono={<ArrowDownToLine className="size-3.5" />} onClick={() => setMoviendo({ insumo, tipo: 'Entrada' })}>
                        Entrada
                      </Button>
                      <Button tamano="sm" variante="secundario" icono={<ArrowUpFromLine className="size-3.5" />} disabled={!insumo.activo || insumo.stock <= 0} onClick={() => setMoviendo({ insumo, tipo: 'Entrega' })}>
                        Entregar
                      </Button>
                      <Button tamano="sm" variante="fantasma" aria-label={`Ajustar ${insumo.nombre}`} icono={<SlidersHorizontal className="size-3.5" />} onClick={() => setMoviendo({ insumo, tipo: 'Ajuste' })}>
                        Ajuste
                      </Button>
                      <Button tamano="sm" variante="fantasma" aria-label={`Editar ${insumo.nombre}`} icono={<Pencil className="size-3.5" />} onClick={() => setEditando({ insumo })}>
                        Editar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryView>
      ) : (
        <Card className="animate-rise overflow-hidden">
          <CardHeader
            titulo={vista === 'entregas' ? 'Entregas a productores' : 'Movimientos'}
            descripcion={vista === 'entregas' ? 'Qué recibió cada productor y con qué receta.' : 'Entradas, entregas y ajustes, del más reciente al más antiguo.'}
          />
          <TablaMovimientos key={vista} filtro={vista === 'entregas' ? { tipo: 'Entrega' } : {}} />
        </Card>
      )}

      {editando && <InsumoForm insumo={editando.insumo} alCerrar={() => setEditando(null)} />}
      {moviendo && <MovimientoForm insumo={moviendo.insumo} tipoInicial={moviendo.tipo} alCerrar={() => setMoviendo(null)} />}
    </>
  )
}

export function MisEntregas() {
  const entregas = useQuery({
    queryKey: inventarioKeys.movimientos({ mias: true }),
    queryFn: () => inventarioApi.movimientos({ tamano: 50 }),
  })

  return (
    <Card className="overflow-hidden">
      <CardHeader titulo="Insumos recibidos" descripcion="Lo que la organización te ha entregado." />
      <QueryView query={entregas} filas={2}>
        {(datos) =>
          datos.items.length === 0 ? (
            <div className="p-5 md:p-6">
              <EmptyState compacto icono={<Package className="size-5" />} titulo="Aún no has recibido insumos" />
            </div>
          ) : (
            <ul>
              {datos.items.map((m) => (
                <FilaMovimiento key={m.id} movimiento={m} />
              ))}
            </ul>
          )
        }
      </QueryView>
    </Card>
  )
}
