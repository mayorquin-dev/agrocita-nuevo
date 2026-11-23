import { http, limpiarParams } from '@/shared/api/http'
import type { Referencia } from '@/shared/api/http'

export const ESTADOS_VISITA = ['Pendiente', 'Confirmada', 'EnProceso', 'Completada', 'Cancelada'] as const
export type EstadoVisita = (typeof ESTADOS_VISITA)[number]

export interface Visita {
  id: number
  solicitudId: number
  finca: Referencia
  productor: Referencia
  tecnico: Referencia
  fechaProgramada: string
  estado: EstadoVisita
  motivoCancelacion: string | null
}

export interface VisitaDetalle extends Visita {
  ubicacion: { departamento: string; municipio: string; direccion: string }
  cultivos: Referencia[]
  motivo: string
  tieneInforme: boolean
  firma: { firmadoPor: string; fecha: string; latitud: number | null; longitud: number | null } | null
  fechaSeguimiento: string | null
}

export interface Evidencia {
  id: number
  visitaId: number
  cultivo: Referencia | null
  descripcion: string | null
  contentType: string
  tamanoBytes: number
  latitud: number | null
  longitud: number | null
  precisionMetros: number | null
  fechaCaptura: string
  fechaRegistro: string
  subidoPor: string
}

export const TIPOS_PRODUCTO = ['Fertilizante', 'Fungicida', 'Insecticida', 'Herbicida', 'Nematicida', 'Bioinsumo', 'Otro'] as const
export type TipoProducto = (typeof TIPOS_PRODUCTO)[number]
export type EstadoReceta = 'Pendiente' | 'Aplicada' | 'NoAplicada'

export interface Receta {
  id: number
  visitaId: number
  cultivo: Referencia
  finca: Referencia
  productor: Referencia
  tecnico: Referencia
  producto: string
  tipoProducto: TipoProducto
  dosis: number
  unidad: string
  metodoAplicacion: string | null
  fechaAplicacion: string
  indicaciones: string | null
  estado: EstadoReceta
  fechaAplicacionReal: string | null
  comentarioSeguimiento: string | null
  fechaRegistroSeguimiento: string | null
  registradoPor: string | null
  vencida: boolean
  fechaCreacion: string
}

export interface NuevaReceta {
  cultivoId: number
  producto: string
  tipoProducto: TipoProducto
  dosis: number
  unidad: string
  metodoAplicacion?: string
  fechaAplicacion: string
  indicaciones?: string
}

export interface SeguimientoVisita {
  visitaId: number
  solicitudId: number
  finca: Referencia
  productor: Referencia
  tecnico: Referencia
  fechaVisita: string
  fechaSeguimiento: string
  vencido: boolean
}

export interface NuevaEvidencia {
  archivo: File
  cultivoId?: number
  descripcion?: string
  latitud?: number
  longitud?: number
  precisionMetros?: number
  fechaCaptura?: string
}

export interface VisitaAgenda {
  id: number
  fechaProgramada: string
  tecnico: Referencia
  finca: Referencia
  estado: EstadoVisita
}

export interface Reprogramacion {
  fechaAnterior: string
  fechaNueva: string
  motivo: string
  fechaCambio: string
  realizadoPor: string
}

interface FiltroFechas {
  desde?: string
  hasta?: string
}

export const visitasKeys = {
  todas: ['visitas'] as const,
  detalle: (id: number) => ['visitas', 'detalle', id] as const,
  reprogramaciones: (id: number) => ['visitas', 'reprogramaciones', id] as const,
  mias: (filtro: object) => ['visitas', 'mias', filtro] as const,
  agenda: (filtro: object) => ['visitas', 'agenda', filtro] as const,
  productor: (id: number) => ['visitas', 'productor', id] as const,
  evidencias: (id: number) => ['visitas', 'evidencias', id] as const,
  recetas: (id: number) => ['visitas', 'recetas', id] as const,
  seguimientos: ['visitas', 'seguimientos'] as const,
}

export const recetasKeys = {
  todas: ['recetas'] as const,
  lista: (filtro: object) => ['recetas', 'lista', filtro] as const,
}

export const visitasApi = {
  crear: (datos: { solicitudId: number; tecnicoId: number; fechaProgramada: string }) =>
    http.post<Visita>('/visitas', datos).then((r) => r.data),
  obtener: (id: number) => http.get<VisitaDetalle>(`/visitas/${id}`).then((r) => r.data),
  cambiarEstado: (id: number, datos: { estado: EstadoVisita; motivo?: string }) =>
    http.patch<Visita>(`/visitas/${id}/estado`, datos).then((r) => r.data),
  reprogramar: (id: number, datos: { nuevaFecha: string; motivo: string }) =>
    http.put<Visita>(`/visitas/${id}/reprogramar`, datos).then((r) => r.data),
  reprogramaciones: (id: number) =>
    http.get<Reprogramacion[]>(`/visitas/${id}/reprogramaciones`).then((r) => r.data),
  mias: (filtro: FiltroFechas & { estado?: EstadoVisita }) =>
    http.get<Visita[]>('/visitas/mias', { params: limpiarParams(filtro) }).then((r) => r.data),
  agenda: (filtro: FiltroFechas & { tecnicoId?: number }) =>
    http.get<VisitaAgenda[]>('/visitas/agenda', { params: limpiarParams(filtro) }).then((r) => r.data),
  porProductor: (productorId: number) =>
    http.get<Visita[]>(`/productores/${productorId}/visitas`).then((r) => r.data),
  cerrar: (id: number, datos: { firmaPng: string; firmadoPor: string; latitud?: number; longitud?: number; diasSeguimiento?: number }) =>
    http.post<VisitaDetalle>(`/visitas/${id}/cerrar`, datos).then((r) => r.data),
  seguimientos: (dias = 14) =>
    http.get<SeguimientoVisita[]>('/visitas/seguimientos', { params: { dias } }).then((r) => r.data),
  evidencias: (id: number) => http.get<Evidencia[]>(`/visitas/${id}/evidencias`).then((r) => r.data),
  subirEvidencia: (id: number, datos: NuevaEvidencia) => {
    const form = new FormData()
    form.append('archivo', datos.archivo)
    for (const [clave, valor] of Object.entries(datos)) {
      if (clave !== 'archivo' && valor !== undefined && valor !== null && valor !== '') form.append(clave, String(valor))
    }
    return http.post<Evidencia>(`/visitas/${id}/evidencias`, form, { timeout: 90000 }).then((r) => r.data)
  },
  eliminarEvidencia: (id: number) => http.delete(`/evidencias/${id}`).then(() => undefined),
  recetas: (id: number) => http.get<Receta[]>(`/visitas/${id}/recetas`).then((r) => r.data),
  crearReceta: (id: number, datos: NuevaReceta) => http.post<Receta>(`/visitas/${id}/recetas`, datos).then((r) => r.data),
}

export const recetasApi = {
  listar: (filtro: { estado?: EstadoReceta; vencidas?: boolean }) =>
    http.get<Receta[]>('/recetas', { params: limpiarParams(filtro) }).then((r) => r.data),
  seguimiento: (id: number, datos: { estado: 'Aplicada' | 'NoAplicada'; fechaAplicacionReal?: string; comentario?: string }) =>
    http.patch<Receta>(`/recetas/${id}/seguimiento`, datos).then((r) => r.data),
  eliminar: (id: number) => http.delete(`/recetas/${id}`).then(() => undefined),
}
