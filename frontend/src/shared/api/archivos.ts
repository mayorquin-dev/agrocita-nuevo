import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { http, limpiarParams } from './http'

export async function descargarArchivo(ruta: string, nombre: string, params: object = {}): Promise<void> {
  const { data } = await http.get<Blob>(ruta, { params: limpiarParams(params), responseType: 'blob', timeout: 60000 })
  const url = URL.createObjectURL(data)
  const enlace = document.createElement('a')

  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useArchivoProtegido(ruta: string | null) {
  const consulta = useQuery({
    queryKey: ['archivo', ruta],
    queryFn: () => http.get<Blob>(ruta!, { responseType: 'blob' }).then((r) => r.data),
    enabled: Boolean(ruta),
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  })

  const url = useMemo(() => (consulta.data ? URL.createObjectURL(consulta.data) : null), [consulta.data])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return { url, cargando: consulta.isPending && Boolean(ruta), error: consulta.isError }
}
