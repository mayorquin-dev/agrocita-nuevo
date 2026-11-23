import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { CalendarClock, Check, FlaskConical, Package, Pill, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useUsuario } from '@/shared/auth/AuthContext'
import { comoNumero, comoTextoOpcional, reglas, useZodForm } from '@/shared/forms/zod'
import { useAccion, useFormMutation } from '@/shared/forms/mutations'
import { formato, hoyISO, sumarDias } from '@/shared/lib/format'
import { Badge, EstadoBadge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { FormError, Input, Select, Textarea } from '@/shared/ui/Field'
import { EmptyState, QueryView } from '@/shared/ui/feedback'
import { Card, CardHeader, PageHeader, Segmented } from '@/shared/ui/layout'
import { Modal, ModalActions } from '@/shared/ui/Modal'
import { inventarioApi, inventarioKeys } from '@/features/inventario/api'
import { MisEntregas, MovimientoForm } from '@/features/inventario/InventarioPage'
import { recetasApi, recetasKeys, TIPOS_PRODUCTO, visitasApi, visitasKeys } from './api'
import type { Receta, VisitaDetalle } from './api'

const UNIDADES = ['kg/mz', 'g/bomba', 'L/mz', 'ml/bomba', 'cc/L', 'g/planta', 'qq/mz', 'oz/mz']

const recetaSchema = z.object({
  insumoId: z.number().int().positive().optional(),
  cultivoId: reglas.id('El cultivo es obligatorio.'),
  producto: reglas.texto('El producto es obligatorio.', 120, 'El producto no puede superar los 120 caracteres.'),
  tipoProducto: z.enum(TIPOS_PRODUCTO, { error: 'El tipo de producto es obligatorio.' }),
  dosis: z.number({ error: 'La dosis es obligatoria.' }).positive('La dosis debe ser mayor que cero.').lt(1_000_000, 'La dosis es demasiado grande.'),
  unidad: reglas.texto('La unidad es obligatoria.', 30, 'La unidad no puede superar los 30 caracteres.'),
  metodoAplicacion: reglas.opcional(100, 'El método no puede superar los 100 caracteres.'),
  fechaAplicacion: z
    .string({ error: 'La fecha de aplicación es obligatoria.' })
    .min(1, 'La fecha de aplicación es obligatoria.')
    .refine((valor) => valor >= hoyISO(), 'La fecha de aplicación no puede ser pasada.'),
  indicaciones: reglas.opcional(500, 'Las indicaciones no pueden superar los 500 caracteres.'),
})

const seguimientoSchema = z
  .object({
    estado: z.enum(['Aplicada', 'NoAplicada'], { error: 'Indica si el producto se aplicó.' }),
    fechaAplicacionReal: z.string().optional(),
    comentario: reglas.opcional(500, 'El comentario no puede superar los 500 caracteres.'),
  })
  .refine((v) => v.estado !== 'Aplicada' || Boolean(v.fechaAplicacionReal), {
    path: ['fechaAplicacionReal'],
    message: 'La fecha en que se aplicó es obligatoria.',
  })
  .refine((v) => !v.fechaAplicacionReal || v.fechaAplicacionReal <= hoyISO(), {
    path: ['fechaAplicacionReal'],
    message: 'La fecha de aplicación no puede ser futura.',
  })
  .refine((v) => v.estado !== 'NoAplicada' || Boolean(v.comentario?.trim()), {
    path: ['comentario'],
    message: 'Explica por qué no se aplicó.',
  })

const INVALIDAR_RECETAS = [recetasKeys.todas, ['visitas', 'recetas'], ['trazabilidad']]

function RecetaForm({ visita, alCerrar }: { visita: VisitaDetalle; alCerrar: () => void }) {
  const insumos = useQuery({ queryKey: [...inventarioKeys.insumos, 'activos'], queryFn: () => inventarioApi.listar(true) })

  const form = useZodForm(recetaSchema, {
    insumoId: undefined,
    cultivoId: visita.cultivos.length === 1 ? visita.cultivos[0].id : undefined,
    producto: '',
    tipoProducto: undefined,
    dosis: undefined,
    unidad: 'kg/mz',
    metodoAplicacion: undefined,
    fechaAplicacion: hoyISO(),
    indicaciones: undefined,
  })

  const { enviar, errorGeneral, cargando } = useFormMutation(form, {
    mutationFn: (valores) => visitasApi.crearReceta(visita.id, valores),
    invalidar: INVALIDAR_RECETAS,
    mensaje: 'Receta emitida. El productor la verá en su lista.',
    alExito: alCerrar,
  })

  const {
    register,
    setValue,
    formState: { errors, isValid },
  } = form

  return (
    <Modal abierto alCerrar={alCerrar} titulo="Emitir receta" descripcion="Producto, dosis y fecha que el productor debe aplicar.">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <FormError mensaje={errorGeneral} />
        <Select etiqueta="Cultivo o lote" error={errors.cultivoId?.message} {...register('cultivoId', comoNumero)}>
          <option value="">Selecciona…</option>
          {visita.cultivos.map((cultivo) => (
            <option key={cultivo.id} value={cultivo.id}>
              {cultivo.nombre}
            </option>
          ))}
        </Select>
        {insumos.data && insumos.data.length > 0 && (
          <Select
            etiqueta="Del inventario de la organización"
            opcional
            ayuda="Si eliges un insumo, la organización podrá entregarlo ligado a esta receta."
            {...register('insumoId', {
              setValueAs: (valor: unknown) => (valor === '' || valor == null ? undefined : Number(valor)),
              onChange: (evento: React.ChangeEvent<HTMLSelectElement>) => {
                const elegido = insumos.data?.find((i) => i.id === Number(evento.target.value))
                if (!elegido) return
                setValue('producto', elegido.nombre, { shouldValidate: true })
                setValue('tipoProducto', elegido.tipo, { shouldValidate: true })
              },
            })}
          >
            <option value="">Otro producto (escribirlo)</option>
            {insumos.data.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre} · {formato.numero(insumo.stock)} {insumo.unidad} disponibles
              </option>
            ))}
          </Select>
        )}
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <Input etiqueta="Producto" placeholder="Oxicloruro de cobre 50 WP" error={errors.producto?.message} {...register('producto')} />
          <Select etiqueta="Tipo" error={errors.tipoProducto?.message} {...register('tipoProducto', comoTextoOpcional)}>
            <option value="">Selecciona…</option>
            {TIPOS_PRODUCTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input etiqueta="Dosis" type="number" step="0.001" min="0" inputMode="decimal" className="font-mono" error={errors.dosis?.message} {...register('dosis', comoNumero)} />
          <div>
            <Input etiqueta="Unidad" list="unidades-receta" error={errors.unidad?.message} {...register('unidad')} />
            <datalist id="unidades-receta">
              {UNIDADES.map((unidad) => (
                <option key={unidad} value={unidad} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input etiqueta="Aplicar el" type="date" min={hoyISO()} className="font-mono" error={errors.fechaAplicacion?.message} {...register('fechaAplicacion')} />
          <Input etiqueta="Método" opcional placeholder="Aspersión foliar, al suelo…" error={errors.metodoAplicacion?.message} {...register('metodoAplicacion', comoTextoOpcional)} />
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Atajos de fecha">
          {[
            ['Hoy', 0],
            ['En 3 días', 3],
            ['En 7 días', 7],
            ['En 15 días', 15],
          ].map(([texto, dias]) => (
            <button
              key={texto}
              type="button"
              onClick={() => setValue('fechaAplicacion', sumarDias(hoyISO(), Number(dias)), { shouldValidate: true })}
              className="cursor-pointer rounded-full border border-line bg-card px-3 py-1 text-[12.5px] font-semibold text-ink-soft transition hover:border-forest hover:text-forest"
            >
              {texto}
            </button>
          ))}
        </div>
        <Textarea etiqueta="Indicaciones" opcional rows={3} placeholder="Aplicar por la mañana, sin lluvia. Usar equipo de protección." error={errors.indicaciones?.message} {...register('indicaciones', comoTextoOpcional)} />
        <ModalActions>
          <Button variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="submit" cargando={cargando} disabled={!isValid}>
            Emitir receta
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}

export function SeguimientoRecetaForm({ receta, alCerrar }: { receta: Receta; alCerrar: () => void }) {
  const form = useZodForm(seguimientoSchema, {
    estado: receta.estado === 'NoAplicada' ? 'NoAplicada' : 'Aplicada',
    fechaAplicacionReal: receta.fechaAplicacionReal ?? (receta.fechaAplicacion <= hoyISO() ? receta.fechaAplicacion : hoyISO()),
    comentario: receta.comentarioSeguimiento ?? undefined,
  })

  const { enviar, errorGeneral, cargando } = useFormMutation(form, {
    mutationFn: (valores) =>
      recetasApi.seguimiento(receta.id, {
        estado: valores.estado,
        fechaAplicacionReal: valores.estado === 'Aplicada' ? valores.fechaAplicacionReal : undefined,
        comentario: valores.comentario,
      }),
    invalidar: INVALIDAR_RECETAS,
    mensaje: 'Seguimiento registrado.',
    alExito: alCerrar,
  })

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form
  const estado = watch('estado')

  return (
    <Modal abierto alCerrar={alCerrar} ancho="sm" titulo="¿Se aplicó?" descripcion={`${receta.producto} · ${formato.numero(receta.dosis)} ${receta.unidad}`}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <FormError mensaje={errorGeneral} />
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Resultado">
          {(
            [
              ['Aplicada', 'Sí, se aplicó', Check],
              ['NoAplicada', 'No se aplicó', X],
            ] as const
          ).map(([valor, texto, Icono]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={estado === valor}
              onClick={() => setValue('estado', valor, { shouldValidate: true })}
              className={clsx(
                'flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold transition',
                estado === valor
                  ? valor === 'Aplicada'
                    ? 'border-forest bg-forest text-paper'
                    : 'border-clay bg-clay-soft text-clay'
                  : 'border-line bg-card text-ink-soft hover:border-ink-faint',
              )}
            >
              <Icono className="size-4" aria-hidden />
              {texto}
            </button>
          ))}
        </div>
        {estado === 'Aplicada' && (
          <Input etiqueta="Fecha en que se aplicó" type="date" max={hoyISO()} className="font-mono" error={errors.fechaAplicacionReal?.message} {...register('fechaAplicacionReal')} />
        )}
        <Textarea
          etiqueta={estado === 'NoAplicada' ? 'Por qué no se aplicó' : 'Comentario'}
          opcional={estado === 'Aplicada'}
          rows={3}
          placeholder={estado === 'NoAplicada' ? 'No se consiguió el producto, llovió…' : 'Se aplicó con bomba de mochila…'}
          error={errors.comentario?.message}
          {...register('comentario', comoTextoOpcional)}
        />
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

export function EstadoReceta({ receta }: { receta: Receta }) {
  if (receta.vencida) return <Badge tono="clay">Vencida</Badge>
  return <EstadoBadge estado={receta.estado} />
}

export function RecetaItem({
  receta,
  mostrarContexto = false,
  puedeSeguimiento,
  puedeEliminar = false,
  alSeguimiento,
}: {
  receta: Receta
  mostrarContexto?: boolean
  puedeSeguimiento: boolean
  puedeEliminar?: boolean
  alSeguimiento: (receta: Receta) => void
}) {
  const esAdmin = useUsuario().rol === 'AdminEmpresa'
  const [entregando, setEntregando] = useState(false)
  const eliminar = useAccion({
    mutationFn: () => recetasApi.eliminar(receta.id),
    invalidar: INVALIDAR_RECETAS,
    mensaje: 'Receta eliminada.',
  })

  return (
    <li className="flex flex-col gap-3 border-b border-line-soft px-5 py-4 last:border-0 sm:flex-row sm:items-start md:px-6">
      <span
        className={clsx(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          receta.estado === 'Aplicada' ? 'bg-moss-soft text-forest-light' : receta.vencida ? 'bg-clay-soft text-clay' : 'bg-ochre-soft text-ochre-deep',
        )}
        aria-hidden
      >
        <Pill className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[16px] leading-tight font-semibold">{receta.producto}</p>
          <Badge punto={false}>{receta.tipoProducto}</Badge>
          <EstadoReceta receta={receta} />
        </div>
        <p className="mt-1 font-mono text-[13.5px] text-ink">
          {formato.numero(receta.dosis)} {receta.unidad}
          {receta.metodoAplicacion && <span className="font-sans text-ink-soft"> · {receta.metodoAplicacion}</span>}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" aria-hidden /> Aplicar el {formato.fecha(receta.fechaAplicacion)}
          </span>
          <span>{receta.cultivo.nombre}</span>
          {mostrarContexto && (
            <Link to={`/visitas/${receta.visitaId}`} className="font-semibold text-forest hover:underline">
              {receta.finca.nombre} · V-{String(receta.visitaId).padStart(4, '0')}
            </Link>
          )}
        </p>
        {receta.indicaciones && <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{receta.indicaciones}</p>}
        {(receta.insumo || receta.cantidadEntregada > 0) && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-lake-soft px-2.5 py-1 text-[12.5px] text-lake">
            <Package className="size-3.5" aria-hidden />
            {receta.cantidadEntregada > 0
              ? `Entregado por la organización: ${formato.numero(receta.cantidadEntregada)} ${receta.unidadEntregada ?? ''}`.trim()
              : 'Del inventario de la organización · sin entregar'}
          </p>
        )}
        {receta.estado !== 'Pendiente' && (
          <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-[13px] text-ink-soft">
            {receta.estado === 'Aplicada' ? `Aplicado el ${formato.fecha(receta.fechaAplicacionReal)}` : 'No se aplicó'}
            {receta.comentarioSeguimiento && ` · ${receta.comentarioSeguimiento}`}
            {receta.registradoPor && <span className="text-ink-faint"> — {receta.registradoPor}</span>}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
        {puedeSeguimiento && (
          <Button tamano="sm" variante={receta.estado === 'Pendiente' ? 'primario' : 'secundario'} onClick={() => alSeguimiento(receta)}>
            {receta.estado === 'Pendiente' ? '¿Se aplicó?' : 'Corregir'}
          </Button>
        )}
        {esAdmin && receta.estado !== 'NoAplicada' && (
          <Button tamano="sm" variante="secundario" icono={<Package className="size-3.5" />} onClick={() => setEntregando(true)}>
            Entregar insumo
          </Button>
        )}
        {puedeEliminar && receta.estado === 'Pendiente' && receta.cantidadEntregada === 0 && (
          <Button tamano="sm" variante="fantasma" aria-label={`Eliminar receta ${receta.producto}`} icono={<Trash2 className="size-3.5" />} cargando={eliminar.isPending} onClick={() => eliminar.mutate()}>
            Quitar
          </Button>
        )}
      </div>
      {entregando && <MovimientoForm receta={receta} alCerrar={() => setEntregando(false)} />}
    </li>
  )
}

export function RecetasCard({ visita }: { visita: VisitaDetalle }) {
  const usuario = useUsuario()
  const esTecnico = usuario.rol === 'Tecnico'
  const recetas = useQuery({ queryKey: visitasKeys.recetas(visita.id), queryFn: () => visitasApi.recetas(visita.id) })
  const [emitiendo, setEmitiendo] = useState(false)
  const [siguiendo, setSiguiendo] = useState<Receta | null>(null)
  const enCampo = visita.estado === 'EnProceso'

  return (
    <Card>
      <CardHeader
        titulo="Receta y plan de manejo"
        numero="05"
        descripcion="Qué aplicar, cuánto y cuándo. El productor confirma si lo aplicó."
        accion={
          esTecnico &&
          enCampo && (
            <Button tamano="sm" variante="acento" icono={<FlaskConical className="size-3.5" />} onClick={() => setEmitiendo(true)}>
              Emitir receta
            </Button>
          )
        }
      />
      <QueryView query={recetas} filas={1}>
        {(lista) =>
          lista.length === 0 ? (
            <div className="p-5 md:p-6">
              <EmptyState
                compacto
                icono={<Pill className="size-5" />}
                titulo="Sin receta"
                descripcion={esTecnico ? (enCampo ? 'Emite una receta por cada producto que el productor debe aplicar.' : 'Podrás emitirla cuando inicies la visita.') : 'El técnico la emite durante la visita.'}
                accion={
                  esTecnico &&
                  enCampo && (
                    <Button tamano="sm" icono={<FlaskConical className="size-3.5" />} onClick={() => setEmitiendo(true)}>
                      Emitir la primera receta
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <ul>
              {lista.map((receta) => (
                <RecetaItem
                  key={receta.id}
                  receta={receta}
                  puedeSeguimiento={visita.estado !== 'Cancelada'}
                  puedeEliminar={esTecnico && enCampo}
                  alSeguimiento={setSiguiendo}
                />
              ))}
            </ul>
          )
        }
      </QueryView>
      {emitiendo && <RecetaForm visita={visita} alCerrar={() => setEmitiendo(false)} />}
      {siguiendo && <SeguimientoRecetaForm receta={siguiendo} alCerrar={() => setSiguiendo(null)} />}
    </Card>
  )
}

export function RecetasLista({ filtro }: { filtro: 'pendientes' | 'vencidas' | 'todas' }) {
  const consultaFiltro = filtro === 'pendientes' ? { estado: 'Pendiente' as const } : filtro === 'vencidas' ? { vencidas: true } : {}
  const recetas = useQuery({ queryKey: recetasKeys.lista(consultaFiltro), queryFn: () => recetasApi.listar(consultaFiltro) })
  const [siguiendo, setSiguiendo] = useState<Receta | null>(null)

  return (
    <>
      <QueryView query={recetas} filas={3}>
        {(lista) =>
          lista.length === 0 ? (
            <div className="p-5 md:p-6">
              <EmptyState
                compacto
                icono={<Check className="size-5" />}
                titulo={filtro === 'todas' ? 'Todavía no hay recetas' : 'Nada pendiente'}
                descripcion={filtro === 'todas' ? 'Las recetas se emiten durante las visitas técnicas.' : 'Todas las recetas tienen su seguimiento al día.'}
              />
            </div>
          ) : (
            <ul>
              {lista.map((receta) => (
                <RecetaItem key={receta.id} receta={receta} mostrarContexto puedeSeguimiento alSeguimiento={setSiguiendo} />
              ))}
            </ul>
          )
        }
      </QueryView>
      {siguiendo && <SeguimientoRecetaForm receta={siguiendo} alCerrar={() => setSiguiendo(null)} />}
    </>
  )
}

export function RecetasPage() {
  const usuario = useUsuario()
  const [filtro, setFiltro] = useState<'pendientes' | 'vencidas' | 'todas'>('pendientes')

  return (
    <>
      <PageHeader
        seccion={`${usuario.rol === 'Productor' ? 'Productor' : 'Seguimiento'} · Recetas`}
        titulo={usuario.rol === 'Productor' ? 'Mis recetas' : 'Plan de manejo'}
        descripcion={
          usuario.rol === 'Productor'
            ? 'Lo que el técnico te indicó aplicar. Confirma cada producto cuando lo apliques.'
            : 'Productos recetados en las visitas y si el productor ya los aplicó.'
        }
      />
      <div className="mb-5">
        <Segmented
          etiqueta="Filtrar recetas"
          valor={filtro}
          alCambiar={setFiltro}
          opciones={[
            { valor: 'pendientes', etiqueta: 'Pendientes' },
            { valor: 'vencidas', etiqueta: 'Vencidas' },
            { valor: 'todas', etiqueta: 'Todas' },
          ]}
        />
      </div>
      <Card className="animate-rise overflow-hidden">
        <RecetasLista filtro={filtro} />
      </Card>
      {usuario.rol === 'Productor' && (
        <div className="mt-6">
          <MisEntregas />
        </div>
      )}
    </>
  )
}
