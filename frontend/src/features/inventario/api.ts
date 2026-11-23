import { z } from 'zod'
import { TIPOS_PRODUCTO } from '@/features/visitas/api'
import type { TipoProducto } from '@/features/visitas/api'
import { http, limpiarParams } from '@/shared/api/http'
import type { Paginado, Referencia } from '@/shared/api/http'
import { reglas } from '@/shared/forms/zod'

export type TipoMovimiento = 'Entrada' | 'Entrega' | 'Ajuste'

export interface Insumo {
  id: number
  nombre: string
  tipo: TipoProducto
  unidad: string
  presentacion: string | null
  stock: number
  stockMinimo: number | null
  activo: boolean
  stockBajo: boolean
}

export interface Movimiento {
  id: number
  insumo: Referencia
  unidad: string
  tipo: TipoMovimiento
  cantidad: number
  stockResultante: number
  productor: Referencia | null
  recetaId: number | null
  visitaId: number | null
  fecha: string
  nota: string | null
  registradoPor: string
  fechaRegistro: string
}

export const insumoSchema = z.object({
  nombre: reglas.texto('El nombre es obligatorio.', 120, 'El nombre no puede superar los 120 caracteres.'),
  tipo: z.enum(TIPOS_PRODUCTO, { error: 'El tipo es obligatorio.' }),
  unidad: reglas.texto('La unidad es obligatoria.', 30, 'La unidad no puede superar los 30 caracteres.'),
  presentacion: reglas.opcional(80, 'La presentación no puede superar los 80 caracteres.'),
  stockMinimo: z.number({ error: 'El stock mínimo debe ser un número.' }).min(0, 'El stock mínimo no puede ser negativo.').optional(),
  activo: z.boolean(),
})

export type InsumoValues = z.infer<typeof insumoSchema>

export interface NuevoMovimiento {
  tipo: TipoMovimiento
  cantidad: number
  productorId?: number
  recetaId?: number
  fecha?: string
  nota?: string
}

export const inventarioKeys = {
  insumos: ['insumos'] as const,
  movimientos: (filtro: object) => ['insumos', 'movimientos', filtro] as const,
}

export const inventarioApi = {
  listar: (soloActivos = false) => http.get<Insumo[]>('/insumos', { params: { soloActivos } }).then((r) => r.data),
  crear: (datos: InsumoValues) => http.post<Insumo>('/insumos', datos).then((r) => r.data),
  actualizar: (id: number, datos: InsumoValues) => http.put<Insumo>(`/insumos/${id}`, datos).then((r) => r.data),
  movimiento: (id: number, datos: NuevoMovimiento) => http.post<Movimiento>(`/insumos/${id}/movimientos`, datos).then((r) => r.data),
  movimientos: (filtro: { insumoId?: number; productorId?: number; tipo?: TipoMovimiento; pagina?: number; tamano?: number }) =>
    http.get<Paginado<Movimiento>>('/insumos/movimientos', { params: limpiarParams(filtro) }).then((r) => r.data),
}
