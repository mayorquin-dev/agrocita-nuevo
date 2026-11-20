import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  Home,
  Layers,
  Sprout,
  Tractor,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Rol } from '@/shared/auth/session'

export interface Enlace {
  a: string
  texto: string
  icono: LucideIcon
  descripcion: string
  exacto?: boolean
}

export const NAVEGACION: Record<Rol, Enlace[]> = {
  Productor: [
    { a: '/', texto: 'Inicio', icono: Home, exacto: true, descripcion: 'Resumen de tus fincas y visitas' },
    { a: '/fincas', texto: 'Mis fincas', icono: Tractor, descripcion: 'Fincas, lotes y cultivos' },
    { a: '/solicitudes', texto: 'Solicitudes', icono: ClipboardList, descripcion: 'Pide y sigue la asistencia técnica' },
    { a: '/informes', texto: 'Informes', icono: FileText, descripcion: 'Historial técnico por cultivo' },
    { a: '/perfil', texto: 'Mi perfil', icono: UserRound, descripcion: 'Tus datos de contacto' },
  ],
  AdminEmpresa: [
    { a: '/', texto: 'Inicio', icono: Home, exacto: true, descripcion: 'Panorama de la organización' },
    { a: '/solicitudes', texto: 'Solicitudes', icono: ClipboardList, descripcion: 'Lo que piden los productores' },
    { a: '/agenda', texto: 'Agenda', icono: CalendarDays, descripcion: 'Visitas programadas por técnico' },
    { a: '/productores', texto: 'Productores', icono: Users, descripcion: 'Productores vinculados' },
    { a: '/tecnicos', texto: 'Técnicos', icono: Sprout, descripcion: 'Equipo técnico de campo' },
    { a: '/catalogos', texto: 'Catálogos', icono: FlaskConical, descripcion: 'Cultivos, calidad y fertilizantes' },
    { a: '/organizacion', texto: 'Organización', icono: Building2, descripcion: 'Datos, plan e invitaciones' },
  ],
  Tecnico: [
    { a: '/', texto: 'Inicio', icono: Home, exacto: true, descripcion: 'Tu jornada de hoy' },
    { a: '/visitas', texto: 'Mis visitas', icono: CalendarDays, descripcion: 'Ruta y visitas asignadas' },
  ],
  SuperAdmin: [
    { a: '/empresas', texto: 'Organizaciones', icono: Building2, descripcion: 'Organizaciones en la plataforma' },
    { a: '/planes', texto: 'Planes', icono: Layers, descripcion: 'Planes de suscripción' },
  ],
}

export const NOMBRE_ROL: Record<Rol, string> = {
  Productor: 'Productor',
  AdminEmpresa: 'Administrador',
  Tecnico: 'Técnico',
  SuperAdmin: 'AgroCita',
}
