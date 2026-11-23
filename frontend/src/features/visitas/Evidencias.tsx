import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Camera, ImageOff, LoaderCircle, MapPin, MapPinOff, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useArchivoProtegido } from '@/shared/api/archivos'
import { useAccion } from '@/shared/forms/mutations'
import { formato } from '@/shared/lib/format'
import { enlaceMapa, formatoCoordenadas, obtenerUbicacion } from '@/shared/lib/geo'
import type { Ubicacion } from '@/shared/lib/geo'
import { Button } from '@/shared/ui/Button'
import { FormError, Select, Textarea } from '@/shared/ui/Field'
import { EmptyState, QueryView } from '@/shared/ui/feedback'
import { Card, CardHeader } from '@/shared/ui/layout'
import { Modal, ModalActions } from '@/shared/ui/Modal'
import { visitasApi, visitasKeys } from './api'
import type { Evidencia, VisitaDetalle } from './api'

const LADO_MAXIMO = 1920

async function comprimir(archivo: File): Promise<File> {
  if (!archivo.type.startsWith('image/') || archivo.type === 'image/gif') return archivo

  try {
    const imagen = await createImageBitmap(archivo)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))

    if (escala === 1 && archivo.size < 1.5 * 1024 * 1024 && archivo.type === 'image/jpeg') return archivo

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(imagen.width * escala)
    canvas.height = Math.round(imagen.height * escala)
    canvas.getContext('2d')!.drawImage(imagen, 0, 0, canvas.width, canvas.height)
    imagen.close()

    const blob = await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/jpeg', 0.82))
    if (!blob) return archivo

    return new File([blob], archivo.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: archivo.lastModified })
  } catch {
    return archivo
  }
}

function Miniatura({ evidencia, alAbrir }: { evidencia: Evidencia; alAbrir: () => void }) {
  const { url, cargando, error } = useArchivoProtegido(`/evidencias/${evidencia.id}/archivo`)

  return (
    <button
      type="button"
      onClick={alAbrir}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-line bg-paper-deep text-left"
      aria-label={`Ver evidencia: ${evidencia.descripcion ?? 'foto de campo'}`}
    >
      {url ? (
        <img src={url} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
      ) : (
        <span className="grid size-full place-items-center text-ink-faint">
          {cargando ? <LoaderCircle className="size-5 animate-spin" /> : error ? <ImageOff className="size-5" /> : null}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-[11px] font-medium text-white">
        {evidencia.latitud != null ? <MapPin className="size-3" aria-hidden /> : <MapPinOff className="size-3 opacity-70" aria-hidden />}
        <span className="truncate">{formato.hora(evidencia.fechaCaptura)}</span>
      </span>
    </button>
  )
}

function Visor({
  evidencia,
  puedeEliminar,
  visitaId,
  alCerrar,
}: {
  evidencia: Evidencia
  puedeEliminar: boolean
  visitaId: number
  alCerrar: () => void
}) {
  const { url } = useArchivoProtegido(`/evidencias/${evidencia.id}/archivo`)
  const eliminar = useAccion({
    mutationFn: () => visitasApi.eliminarEvidencia(evidencia.id),
    invalidar: [visitasKeys.evidencias(visitaId)],
    mensaje: 'Evidencia eliminada.',
    alExito: alCerrar,
  })

  return (
    <Modal abierto alCerrar={alCerrar} ancho="lg" titulo={evidencia.descripcion ?? 'Foto de campo'} descripcion={evidencia.cultivo?.nombre}>
      <div className="flex flex-col gap-4">
        <div className="grid min-h-48 place-items-center overflow-hidden rounded-xl bg-paper-deep">
          {url ? <img src={url} alt={evidencia.descripcion ?? 'Evidencia de campo'} className="max-h-[60dvh] w-auto" /> : <LoaderCircle className="size-6 animate-spin text-ink-faint" />}
        </div>
        <dl className="grid gap-3 text-[14px] sm:grid-cols-3">
          <div>
            <dt className="eyebrow mb-1">Capturada</dt>
            <dd className="font-mono text-[13px]">{formato.fechaHora(evidencia.fechaCaptura)}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1">Ubicación</dt>
            <dd className="font-mono text-[13px]">
              {evidencia.latitud != null && evidencia.longitud != null ? (
                <a href={enlaceMapa(evidencia.latitud, evidencia.longitud)} target="_blank" rel="noreferrer" className="text-forest underline decoration-ochre decoration-2 underline-offset-4">
                  {formatoCoordenadas(evidencia.latitud, evidencia.longitud)}
                </a>
              ) : (
                'Sin GPS'
              )}
              {evidencia.precisionMetros != null && <span className="block text-ink-faint">± {evidencia.precisionMetros} m</span>}
            </dd>
          </div>
          <div>
            <dt className="eyebrow mb-1">Registró</dt>
            <dd>{evidencia.subidoPor}</dd>
          </div>
        </dl>
        {puedeEliminar && (
          <ModalActions>
            <Button variante="peligro" icono={<Trash2 className="size-4" />} cargando={eliminar.isPending} onClick={() => eliminar.mutate()}>
              Eliminar evidencia
            </Button>
          </ModalActions>
        )}
      </div>
    </Modal>
  )
}

function NuevaEvidenciaForm({ visita, archivo, alCerrar }: { visita: VisitaDetalle; archivo: File; alCerrar: () => void }) {
  const [cultivoId, setCultivoId] = useState<number | undefined>(visita.cultivos.length === 1 ? visita.cultivos[0].id : undefined)
  const [descripcion, setDescripcion] = useState('')
  const [ubicacion, setUbicacion] = useState<Ubicacion | null | 'buscando'>('buscando')
  const [error, setError] = useState<string | null>(null)
  const vista = useMemo(() => URL.createObjectURL(archivo), [archivo])

  useEffect(() => () => URL.revokeObjectURL(vista), [vista])

  useEffect(() => {
    let vigente = true
    void obtenerUbicacion().then((resultado) => {
      if (vigente) setUbicacion(resultado)
    })
    return () => {
      vigente = false
    }
  }, [])

  const subir = useAccion({
    mutationFn: async () => {
      const comprimido = await comprimir(archivo)
      const gps = ubicacion && ubicacion !== 'buscando' ? ubicacion : null

      return visitasApi.subirEvidencia(visita.id, {
        archivo: comprimido,
        cultivoId,
        descripcion: descripcion.trim() || undefined,
        latitud: gps?.latitud,
        longitud: gps?.longitud,
        precisionMetros: gps?.precision,
        fechaCaptura: new Date(Math.min(archivo.lastModified || Date.now(), Date.now())).toISOString(),
      })
    },
    invalidar: [visitasKeys.evidencias(visita.id)],
    mensaje: 'Evidencia guardada.',
    alExito: alCerrar,
  })

  const guardar = () => {
    if (descripcion.length > 250) {
      setError('La descripción no puede superar los 250 caracteres.')
      return
    }
    setError(null)
    subir.mutate()
  }

  return (
    <Modal abierto alCerrar={alCerrar} titulo="Nueva evidencia" descripcion="La foto queda ligada a esta visita con fecha y ubicación.">
      <div className="flex flex-col gap-4">
        <FormError mensaje={error} />
        <img src={vista} alt="Vista previa" className="max-h-64 w-full rounded-xl bg-paper-deep object-contain" />
        <div
          className={clsx(
            'flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13.5px]',
            ubicacion && ubicacion !== 'buscando' ? 'border-moss/30 bg-moss-soft text-forest-light' : 'border-line bg-paper text-ink-soft',
          )}
          role="status"
        >
          {ubicacion === 'buscando' ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden /> Obteniendo ubicación GPS…
            </>
          ) : ubicacion ? (
            <>
              <MapPin className="size-4" aria-hidden /> {formatoCoordenadas(ubicacion.latitud, ubicacion.longitud)} · ± {ubicacion.precision} m
            </>
          ) : (
            <>
              <MapPinOff className="size-4" aria-hidden /> Sin ubicación. Activa el GPS y el permiso de ubicación del navegador.
            </>
          )}
        </div>
        <Select etiqueta="Cultivo o lote" opcional value={cultivoId ?? ''} onChange={(evento) => setCultivoId(evento.target.value ? Number(evento.target.value) : undefined)}>
          <option value="">General de la finca</option>
          {visita.cultivos.map((cultivo) => (
            <option key={cultivo.id} value={cultivo.id}>
              {cultivo.nombre}
            </option>
          ))}
        </Select>
        <Textarea
          etiqueta="Qué muestra la foto"
          opcional
          rows={2}
          maxLength={250}
          placeholder="Roya en hojas bajeras del lote 1…"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />
        <ModalActions>
          <Button variante="fantasma" onClick={alCerrar}>
            Descartar
          </Button>
          <Button cargando={subir.isPending} disabled={ubicacion === 'buscando' && !subir.isPending} onClick={guardar}>
            Guardar evidencia
          </Button>
        </ModalActions>
      </div>
    </Modal>
  )
}

export function EvidenciasCard({ visita, puedeRegistrar }: { visita: VisitaDetalle; puedeRegistrar: boolean }) {
  const evidencias = useQuery({ queryKey: visitasKeys.evidencias(visita.id), queryFn: () => visitasApi.evidencias(visita.id) })
  const entrada = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [viendo, setViendo] = useState<Evidencia | null>(null)

  return (
    <Card>
      <CardHeader
        titulo="Evidencias de campo"
        numero="04"
        descripcion="Fotos con fecha y ubicación GPS de la plaga, el lote o el trabajo realizado."
        accion={
          puedeRegistrar && (
            <Button tamano="sm" variante="acento" icono={<Camera className="size-3.5" />} onClick={() => entrada.current?.click()}>
              Tomar foto
            </Button>
          )
        }
      />
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(evento) => {
          const elegido = evento.target.files?.[0]
          if (elegido) setArchivo(elegido)
          evento.target.value = ''
        }}
      />
      <div className="p-5 md:p-6">
        <QueryView query={evidencias} filas={1}>
          {(lista) =>
            lista.length === 0 ? (
              <EmptyState
                compacto
                icono={<Camera className="size-5" />}
                titulo="Sin evidencias"
                descripcion={
                  puedeRegistrar
                    ? 'Toma fotos de lo que encuentres: quedan con fecha y GPS para el informe y las auditorías.'
                    : 'El técnico registra las fotos durante la visita.'
                }
                accion={
                  puedeRegistrar && (
                    <Button tamano="sm" icono={<Camera className="size-3.5" />} onClick={() => entrada.current?.click()}>
                      Tomar la primera foto
                    </Button>
                  )
                }
              />
            ) : (
              <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
                {lista.map((evidencia) => (
                  <li key={evidencia.id}>
                    <Miniatura evidencia={evidencia} alAbrir={() => setViendo(evidencia)} />
                  </li>
                ))}
              </ul>
            )
          }
        </QueryView>
      </div>
      {archivo && <NuevaEvidenciaForm visita={visita} archivo={archivo} alCerrar={() => setArchivo(null)} />}
      {viendo && <Visor evidencia={viendo} visitaId={visita.id} puedeEliminar={puedeRegistrar} alCerrar={() => setViendo(null)} />}
    </Card>
  )
}
