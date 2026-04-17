// LocalStorage utilities

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage error:', e)
    }
  },
  remove: (key) => {
    localStorage.removeItem(key)
  },
}

// Keys
export const KEYS = {
  HITOS: 'ella_hitos',
  DIARIO: 'ella_diario',
  CHAT: 'ella_chat',
  HABITOS: 'ella_habitos',
  HIDRATACION: 'ella_hidratacion',
  INBODY: 'ella_inbody',
  NUTRICION: 'ella_nutricion',
  CARRERAS: 'ella_carreras',
  USER: 'ella_user',
}

// Initial data
export const INITIAL_DATA = {
  user: {
    nombre: 'Ella',
    ciudad: 'Dubai, UAE',
    deporte_principal: 'Running',
    proxima_carrera: '10K oficial',
    fecha_carrera: '2026-04-19',
    altura: '',
    fecha_nacimiento: '',
    peso_actual: null,
  },
  hito_activo: {
    id: 'h1',
    nombre: 'Primera carrera 10K oficial',
    descripcion: 'Completar mi primera carrera oficial de 10K en Dubai',
    fecha: '2026-04-19',
    categoria: 'Running',
    progreso: 80,
    completado: false,
    creado: '2026-01-01',
  },
}
