import { Download, Share2 } from 'lucide-react'
import { useState } from 'react'
import { http } from '@/shared/api/http'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import type { VisitaDetalle } from './api'

async function obtenerPdf(visitaId: number): Promise<File> {
  const { data } = await http.get<Blob>(`/visitas/${visitaId}/informe/pdf`, { responseType: 'blob', timeout: 60000 })
  return new File([data], `informe-visita-V${String(visitaId).padStart(4, '0')}.pdf`, { type: 'application/pdf' })
}

function descargar(archivo: File) {
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = archivo.name
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function InformePdfAcciones({ visita }: { visita: VisitaDetalle }) {
  const toast = useToast()
  const [cargando, setCargando] = useState<'descargar' | 'compartir' | null>(null)
  const puedeCompartir = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

  const ejecutar = async (accion: 'descargar' | 'compartir') => {
    setCargando(accion)
    try {
      const archivo = await obtenerPdf(visita.id)

      if (accion === 'compartir' && navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({
          files: [archivo],
          title: `Informe de visita · ${visita.finca.nombre}`,
          text: `Informe de la visita técnica a ${visita.finca.nombre}.`,
        })
      } else {
        descargar(archivo)
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) toast.error(error)
    } finally {
      setCargando(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button tamano="sm" variante="secundario" icono={<Download className="size-3.5" />} cargando={cargando === 'descargar'} onClick={() => void ejecutar('descargar')}>
        PDF
      </Button>
      {puedeCompartir && (
        <Button tamano="sm" icono={<Share2 className="size-3.5" />} cargando={cargando === 'compartir'} onClick={() => void ejecutar('compartir')}>
          Enviar
        </Button>
      )}
    </div>
  )
}
