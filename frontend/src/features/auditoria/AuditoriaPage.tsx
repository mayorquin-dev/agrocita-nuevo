import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { FileSpreadsheet, History } from 'lucide-react'
import { useState } from 'react'
import { descargarArchivo } from '@/shared/api/archivos'
import { Button } from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import { EmptyState, QueryView } from '@/shared/ui/feedback'
import { Card, PageHeader } from '@/shared/ui/layout'
import { Pagination } from '@/shared/ui/Table'
import { useToast } from '@/shared/ui/Toast'
import { auditoriaApi, auditoriaKeys, ENTIDADES } from './api'
import type { AccionAuditoria, FiltroAuditoria } from './api'
import { RegistroAuditoriaItem } from './HistorialCambios'

const TAMANO = 25

export function AuditoriaPage() {
  const toast = useToast()
  const [filtro, setFiltro] = useState<FiltroAuditoria>({ pagina: 1, tamano: TAMANO })
  const [descargando, setDescargando] = useState(false)
  const rangoValido = !filtro.desde || !filtro.hasta || filtro.desde <= filtro.hasta

  const registros = useQuery({
    queryKey: auditoriaKeys.lista(filtro),
    queryFn: () => auditoriaApi.listar(filtro),
    enabled: rangoValido,
    placeholderData: keepPreviousData,
  })

  const cambiar = (cambios: Partial<FiltroAuditoria>) => setFiltro((actual) => ({ ...actual, ...cambios, pagina: 1 }))

  const exportar = async () => {
    setDescargando(true)
    try {
      const { pagina: _p, tamano: _t, ...resto } = filtro
      await descargarArchivo('/auditoria/excel', 'historial-de-cambios.xlsx', resto)
    } catch (error) {
      toast.error(error)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <>
      <PageHeader
        seccion="Administración · Auditoría"
        titulo={
          <>
            Historial de <span className="italic">cambios</span>
          </>
        }
        descripcion="Cada alta, modificación y eliminación queda registrada con su autor, la fecha y el valor anterior y nuevo de cada campo. Las contraseñas nunca se guardan."
        acciones={
          <Button variante="secundario" icono={<FileSpreadsheet className="size-4" />} cargando={descargando} disabled={!rangoValido} onClick={() => void exportar()}>
            Exportar a Excel
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select etiqueta="Registro" value={filtro.entidad ?? ''} onChange={(e) => cambiar({ entidad: e.target.value || undefined })}>
          <option value="">Todos</option>
          {Object.entries(ENTIDADES)
            .sort(([, a], [, b]) => a.localeCompare(b))
            .map(([clave, nombre]) => (
              <option key={clave} value={clave}>
                {nombre}
              </option>
            ))}
        </Select>
        <Input etiqueta="Número" inputMode="numeric" placeholder="Ej. 12" className="font-mono" value={filtro.entidadId ?? ''} onChange={(e) => cambiar({ entidadId: e.target.value.replace(/\D/g, '') || undefined })} />
        <Select etiqueta="Acción" value={filtro.accion ?? ''} onChange={(e) => cambiar({ accion: (e.target.value || undefined) as AccionAuditoria | undefined })}>
          <option value="">Todas</option>
          <option value="Creado">Creado</option>
          <option value="Modificado">Modificado</option>
          <option value="Eliminado">Eliminado</option>
        </Select>
        <Input etiqueta="Desde" type="date" className="font-mono" value={filtro.desde ?? ''} max={filtro.hasta} onChange={(e) => cambiar({ desde: e.target.value || undefined })} />
        <Input etiqueta="Hasta" type="date" className="font-mono" value={filtro.hasta ?? ''} min={filtro.desde} onChange={(e) => cambiar({ hasta: e.target.value || undefined })} />
      </div>

      <Card className={clsx('animate-rise overflow-hidden transition-opacity', registros.isFetching && 'opacity-70')}>
        <QueryView query={registros} filas={6}>
          {(datos) =>
            datos.items.length === 0 ? (
              <div className="p-6">
                <EmptyState compacto icono={<History className="size-5" />} titulo="Sin cambios con esos filtros" />
              </div>
            ) : (
              <>
                <ul>
                  {datos.items.map((registro) => (
                    <RegistroAuditoriaItem key={registro.id} registro={registro} />
                  ))}
                </ul>
                <Pagination pagina={datos.pagina} tamano={datos.tamano} total={datos.total} alCambiar={(pagina) => setFiltro((actual) => ({ ...actual, pagina }))} />
              </>
            )
          }
        </QueryView>
      </Card>
    </>
  )
}
