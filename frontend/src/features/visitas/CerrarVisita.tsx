import { useQuery } from '@tanstack/react-query'
import { CircleCheckBig, LoaderCircle, MapPin, MapPinOff, PenLine } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useArchivoProtegido } from '@/shared/api/archivos'
import { useAccion } from '@/shared/forms/mutations'
import { formato, hoyISO, sumarDias } from '@/shared/lib/format'
import { enlaceMapa, formatoCoordenadas, obtenerUbicacion } from '@/shared/lib/geo'
import type { Ubicacion } from '@/shared/lib/geo'
import { Button } from '@/shared/ui/Button'
import { FormError, Input, Select } from '@/shared/ui/Field'
import { FirmaPad } from '@/shared/ui/FirmaPad'
import type { FirmaPadRef } from '@/shared/ui/FirmaPad'
import { Card, CardHeader, Dato } from '@/shared/ui/layout'
import { Modal, ModalActions } from '@/shared/ui/Modal'
import { recetasKeys, visitasApi, visitasKeys } from './api'
import type { VisitaDetalle } from './api'

const SEGUIMIENTOS = [
  { dias: '', texto: 'Sin visita de seguimiento' },
  { dias: '7', texto: 'Volver en 7 días' },
  { dias: '15', texto: 'Volver en 15 días' },
  { dias: '30', texto: 'Volver en 30 días' },
  { dias: '60', texto: 'Volver en 60 días' },
]

export function CerrarVisitaForm({ visita, alCerrar }: { visita: VisitaDetalle; alCerrar: () => void }) {
  const firma = useRef<FirmaPadRef>(null)
  const [firmaVacia, setFirmaVacia] = useState(true)
  const [firmadoPor, setFirmadoPor] = useState(visita.productor.nombre)
  const [dias, setDias] = useState('15')
  const [ubicacion, setUbicacion] = useState<Ubicacion | null | 'buscando'>('buscando')
  const [error, setError] = useState<string | null>(null)

  const recetas = useQuery({ queryKey: visitasKeys.recetas(visita.id), queryFn: () => visitasApi.recetas(visita.id) })

  useEffect(() => {
    let vigente = true
    void obtenerUbicacion().then((resultado) => {
      if (vigente) setUbicacion(resultado)
    })
    return () => {
      vigente = false
    }
  }, [])

  const cerrar = useAccion({
    mutationFn: (datos: Parameters<typeof visitasApi.cerrar>[1]) => visitasApi.cerrar(visita.id, datos),
    invalidar: [visitasKeys.todas, ['solicitudes'], recetasKeys.todas],
    mensaje: 'Visita cerrada con la firma del productor.',
    alExito: alCerrar,
  })

  const enviar = () => {
    const png = firma.current?.aPng()
    const nombre = firmadoPor.trim()

    if (!png) return setError('Pide al productor que firme en el recuadro.')
    if (!nombre) return setError('Escribe el nombre de quien firma.')
    if (nombre.length > 150) return setError('El nombre no puede superar los 150 caracteres.')

    setError(null)
    const gps = ubicacion && ubicacion !== 'buscando' ? ubicacion : null

    cerrar.mutate({
      firmaPng: png,
      firmadoPor: nombre,
      latitud: gps?.latitud,
      longitud: gps?.longitud,
      diasSeguimiento: dias ? Number(dias) : undefined,
    })
  }

  return (
    <Modal abierto alCerrar={alCerrar} titulo="Cerrar visita" descripcion="El productor firma en pantalla para dar fe de la visita y de la receta.">
      <div className="flex flex-col gap-4">
        <FormError mensaje={error} />

        <div className="rounded-xl border border-line bg-paper px-4 py-3 text-[13.5px] text-ink-soft">
          <p className="font-semibold text-ink">Resumen</p>
          <p className="mt-1">
            {visita.finca.nombre} · {visita.cultivos.map((cultivo) => cultivo.nombre).join(', ')}
          </p>
          <p className="mt-1">
            {recetas.data
              ? recetas.data.length === 0
                ? 'Sin receta emitida.'
                : `${recetas.data.length} producto(s) recetado(s): ${recetas.data.map((receta) => receta.producto).join(', ')}.`
              : 'Cargando receta…'}
          </p>
        </div>

        <FirmaPad ref={firma} alCambiar={setFirmaVacia} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input etiqueta="Nombre de quien firma" maxLength={150} value={firmadoPor} onChange={(evento) => setFirmadoPor(evento.target.value)} />
          <Select etiqueta="Seguimiento" value={dias} onChange={(evento) => setDias(evento.target.value)} ayuda={dias ? `Quedará para el ${formato.fecha(sumarDias(hoyISO(), Number(dias)))}.` : undefined}>
            {SEGUIMIENTOS.map((opcion) => (
              <option key={opcion.dias} value={opcion.dias}>
                {opcion.texto}
              </option>
            ))}
          </Select>
        </div>

        <p className="flex items-center gap-2 text-[13px] text-ink-soft" role="status">
          {ubicacion === 'buscando' ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden /> Registrando ubicación…
            </>
          ) : ubicacion ? (
            <>
              <MapPin className="size-4 text-forest" aria-hidden /> Firma con GPS {formatoCoordenadas(ubicacion.latitud, ubicacion.longitud)}
            </>
          ) : (
            <>
              <MapPinOff className="size-4" aria-hidden /> Sin ubicación: la firma se guardará sin GPS.
            </>
          )}
        </p>

        <ModalActions>
          <Button variante="fantasma" onClick={alCerrar}>
            Volver
          </Button>
          <Button icono={<CircleCheckBig className="size-4" />} cargando={cerrar.isPending} disabled={firmaVacia} onClick={enviar}>
            Firmar y cerrar visita
          </Button>
        </ModalActions>
      </div>
    </Modal>
  )
}

export function FirmaCard({ visita }: { visita: VisitaDetalle }) {
  const { url } = useArchivoProtegido(visita.firma ? `/visitas/${visita.id}/firma` : null)

  if (!visita.firma) return null

  const { firmadoPor, fecha, latitud, longitud } = visita.firma

  return (
    <Card>
      <CardHeader titulo="Conformidad del productor" numero="06" descripcion="Firma capturada en campo al cerrar la visita." />
      <div className="grid gap-6 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:px-6">
        <div className="grid h-40 place-items-center overflow-hidden rounded-xl border border-line bg-white">
          {url ? <img src={url} alt={`Firma de ${firmadoPor}`} className="max-h-full w-auto" /> : <PenLine className="size-6 text-[#7a847d]" aria-hidden />}
        </div>
        <dl className="grid content-start gap-4 sm:grid-cols-2">
          <Dato etiqueta="Firmó">{firmadoPor}</Dato>
          <Dato etiqueta="Fecha" mono>
            {formato.fechaHora(fecha)}
          </Dato>
          <Dato etiqueta="Ubicación" mono>
            {latitud != null && longitud != null ? (
              <a href={enlaceMapa(latitud, longitud)} target="_blank" rel="noreferrer" className="text-forest underline decoration-ochre decoration-2 underline-offset-4">
                {formatoCoordenadas(latitud, longitud)}
              </a>
            ) : (
              'Sin GPS'
            )}
          </Dato>
          <Dato etiqueta="Seguimiento" mono>
            {visita.fechaSeguimiento ? formato.fecha(visita.fechaSeguimiento) : 'No programado'}
          </Dato>
        </dl>
      </div>
    </Card>
  )
}
