export interface Ubicacion {
  latitud: number
  longitud: number
  precision: number
}

export function obtenerUbicacion(tiempoMaximo = 12000): Promise<Ubicacion | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return Promise.resolve(null)

  return new Promise((resolver) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolver({
          latitud: Number(coords.latitude.toFixed(6)),
          longitud: Number(coords.longitude.toFixed(6)),
          precision: Math.round(coords.accuracy),
        }),
      () => resolver(null),
      { enableHighAccuracy: true, timeout: tiempoMaximo, maximumAge: 60_000 },
    )
  })
}

export function enlaceMapa(latitud: number, longitud: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=17/${latitud}/${longitud}`
}

export function formatoCoordenadas(latitud: number, longitud: number): string {
  return `${latitud.toFixed(5)}, ${longitud.toFixed(5)}`
}
