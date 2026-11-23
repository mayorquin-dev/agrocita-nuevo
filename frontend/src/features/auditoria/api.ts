import { http, limpiarParams } from '@/shared/api/http'
import type { Paginado } from '@/shared/api/http'

export type AccionAuditoria = 'Creado' | 'Modificado' | 'Eliminado'

export interface RegistroAuditoria {
  id: number
  fecha: string
  usuario: string
  rol: string | null
  entidad: string
  entidadId: string
  accion: AccionAuditoria
  cambios: { campo: string; antes: string | null; despues: string | null }[]
}

export interface FiltroAuditoria {
  entidad?: string
  entidadId?: string
  accion?: AccionAuditoria
  desde?: string
  hasta?: string
  pagina?: number
  tamano?: number
}

export const ENTIDADES: Record<string, string> = {
  Solicitud: 'Solicitud',
  Visita: 'Visita',
  ReprogramacionVisita: 'Reprogramación',
  Informe: 'Informe',
  Inspeccion: 'Inspección',
  ResultadoParametro: 'Resultado de inspección',
  RecetaManejo: 'Receta',
  EvidenciaVisita: 'Evidencia',
  Insumo: 'Insumo',
  MovimientoInsumo: 'Movimiento de insumo',
  Finca: 'Finca',
  Cultivo: 'Cultivo',
  Productor: 'Productor',
  Tecnico: 'Técnico',
  Usuario: 'Usuario',
  Empresa: 'Organización',
  TipoCultivo: 'Tipo de cultivo',
  ParametroEvaluacion: 'Parámetro de evaluación',
  CategoriaCalidad: 'Categoría de calidad',
  Fertilizante: 'Fertilizante',
  RecomendacionFertilizacion: 'Recomendación de fertilización',
  AplicacionFertilizante: 'Aplicación de fertilizante',
  SolicitudCultivo: 'Cultivo de la solicitud',
  Suscripcion: 'Suscripción',
}

export const RUTA_ENTIDAD: Record<string, (id: string) => string> = {
  Visita: (id) => `/visitas/${id}`,
  Solicitud: (id) => `/solicitudes/${id}`,
  Finca: (id) => `/fincas/${id}`,
  Productor: (id) => `/productores/${id}`,
}

export function nombreCampo(campo: string): string {
  const separado = campo
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
    .replace(/Id$/, '')
    .trim()
    .toLowerCase()

  return separado.charAt(0).toUpperCase() + separado.slice(1)
}

export const auditoriaKeys = {
  lista: (filtro: object) => ['auditoria', filtro] as const,
}

export const auditoriaApi = {
  listar: (filtro: FiltroAuditoria) =>
    http.get<Paginado<RegistroAuditoria>>('/auditoria', { params: limpiarParams(filtro) }).then((r) => r.data),
}
