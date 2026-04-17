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
    nombre: '',
    ciudad: '',
    deporte_principal: 'Running',
    proxima_carrera: '',
    fecha_carrera: '',
    altura: '',
    fecha_nacimiento: '',
    peso_actual: null,
  },
  hito_activo: null,
}
