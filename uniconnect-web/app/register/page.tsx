'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { checkMatricula, registerUser, registerExistingUser, registerFromPadron } from '@/app/actions/auth'
import { uploadProfilePhoto } from '@/app/actions/upload'
import { useGoogleLogin } from '@react-oauth/google'

const CARRERAS = [
  'Licenciatura en Arquitectura',
  'Licenciatura en Artes Visuales',
  'Licenciatura en Comunicación y Medios',
  'Licenciatura en Diseño de Comunicación Visual',
  'Maestría en Dirección de Comunicación',
  'Licenciatura en Cirujano Dentista',
  'Licenciatura en Enfermería',
  'Licenciatura en Médico Cirujano',
  'Licenciatura en Nutrición',
  'Licenciatura en Químico Clínico Biólogo',
  'Licenciatura en Terapia Física y Rehabilitación',
  'Técnico en Tecnología Dental',
  'Especialidad en Odontología',
  'Especialidad en Oftalmología',
  'Maestría en Salud Pública',
  'Licenciaturas del Área Educativa',
  'Posgrados en Educación',
  'Licenciatura en Administración y Negocios Internacionales',
  'Licenciatura en Contaduría Pública',
  'Licenciatura en Derecho',
  'Posgrados en Administración',
  'Ingeniería en Electrónica y Telecomunicaciones',
  'Ingeniería en Gestión de Tecnologías de la Información',
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Industrial y de Sistemas',
  'Maestría en Redes y Seguridad',
  'Licenciatura en Música',
  'Escuela Preparatoria',
  'Licenciaturas en Psicología',
  'Posgrados en Psicología',
  'Licenciatura en Teología',
  'Otro'
]

const INTERESES_CATEGORIAS = [
  {
    nombre: 'Deportes',
    colorOff: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
    colorOn: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30',
    hobbies: ['Fútbol', 'Pádel', 'Básquetbol', 'Tenis', 'Voleibol', 'Gimnasio', 'Natación', 'Correr']
  },
  {
    nombre: 'Arte & Entretenimiento',
    colorOff: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
    colorOn: 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/30',
    hobbies: ['Cine', 'Netflix / Series', 'Videojuegos', 'Música', 'Tocar Instrumentos', 'Fotografía', 'Dibujo', 'Teatro']
  },
  {
    nombre: 'Estilo de Vida Social',
    colorOff: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100',
    colorOn: 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/30',
    hobbies: ['Ir por Café', 'Viajar', 'Conciertos', 'Mascotas', 'Fiestas', 'Lectura', 'Juegos de Mesa', 'Cocinar']
  },
  {
    nombre: 'Académico / Emprendedor',
    colorOff: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
    colorOn: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30',
    hobbies: ['Tecnología', 'Programar', 'Emprendimiento', 'Debate', 'Voluntariado', 'Aprender Idiomas', 'Proyectos']
  }
]

type ExistingAlumno = {
  matricula: number
  nombre: string
  apellidos: string
  carrera?: string | null
  genero?: string | null
  edad?: number | null
}

export default function RegisterResponsivePage() {
  const router = useRouter()
  const { login, updateProfile } = useApp()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Datos del alumno encontrado y de dónde viene
  const [existingAlumno, setExistingAlumno] = useState<ExistingAlumno | null>(null)
  const [alumnoSource, setAlumnoSource] = useState<'alumnos' | 'alumnos_db' | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellidos: '',
    fecha_nac: '',
    carrera: '',
    carrera_custom: '',
    semestre: '',
    genero: '',
    genero_interes: '',
    bio: '',
    intereses: [] as string[],
    intereses_custom: '',
  })

  const [showOtroInteres, setShowOtroInteres] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setError('')
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const userInfo = await userInfoRes.json()
        const email: string = userInfo.email || ''
        const emailLocal = email.split('@')[0]
        if (!email.endsWith('@alumno.um.edu.mx') || !/\d/.test(emailLocal)) {
          setError('Solo puedes registrarte con un correo institucional (@alumno.um.edu.mx).')
          return
        }
        const [nombre, ...rest] = (userInfo.name || '').split(' ')
        setFormData(prev => ({
          ...prev,
          email,
          nombre: nombre || prev.nombre,
          apellidos: rest.join(' ') || prev.apellidos,
        }))
      } catch {
        setError('Error al obtener información de Google.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => {
      setError('No se pudo conectar con Google.')
    },
  })

  // Fotos: array de 3 slots, el usuario elige cuál es la principal
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null])
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([null, null, null])
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)

  const handlePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const newPhotos = [...photos]
    newPhotos[index] = file
    setPhotos(newPhotos)

    const reader = new FileReader()
    reader.onload = () => {
      const newPreviews = [...photoPreviews]
      newPreviews[index] = reader.result as string
      setPhotoPreviews(newPreviews)
    }
    reader.readAsDataURL(file)

    // Si es la primera foto que se sube, hacerla principal
    if (!photos.some(p => p !== null)) {
      setMainPhotoIndex(index)
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...photos]
    const newPreviews = [...photoPreviews]
    newPhotos[index] = null
    newPreviews[index] = null
    setPhotos(newPhotos)
    setPhotoPreviews(newPreviews)
    // Si se borró la principal, mover a la siguiente disponible
    if (mainPhotoIndex === index) {
      const nextAvailable = newPhotos.findIndex(p => p !== null)
      setMainPhotoIndex(nextAvailable >= 0 ? nextAvailable : 0)
    }
  }

  // Matrícula extraída del correo
  const extractedMatricula = formData.email.match(/^(\d{7})@alumno\.um\.edu\.mx$/)?.[1] || ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const toggleInteres = (hobby: string) => {
    setFormData(prev => {
      const isSelected = prev.intereses.includes(hobby)
      return {
        ...prev,
        intereses: isSelected
          ? prev.intereses.filter(i => i !== hobby)
          : [...prev.intereses, hobby]
      }
    })
  }

  // PASO 1: Validar correo → extraer matrícula → buscar en DB
  const validateStep1 = async () => {
    setError('')

    if (!formData.email.endsWith('@alumno.um.edu.mx')) {
      setError('Debes usar tu correo institucional @alumno.um.edu.mx.')
      return
    }

    if (!extractedMatricula) {
      setError('Tu correo debe empezar con tu matrícula de 7 dígitos (ej: 1190000@alumno.um.edu.mx).')
      return
    }

    if (formData.password.length < 6) {
      setError('Escribe una contraseña de al menos 6 caracteres.')
      return
    }

    // Buscar matrícula en la DB
    setLoading(true)
    const result = await checkMatricula(parseInt(extractedMatricula, 10))
    setLoading(false)

    if (result.exists) {
      if (result.hasPassword) {
        // Ya tiene cuenta completa → mándalo al login
        setError('Esta matrícula ya tiene una cuenta. Ve a iniciar sesión.')
        return
      }

      setExistingAlumno(result.alumno)
      setAlumnoSource(result.source)

      if (result.source === 'alumnos') {
        // Auto-asignar genero_interes según género
        const genero = result.alumno?.genero
        if (genero === 'Mujer') {
          setFormData(prev => ({ ...prev, genero_interes: 'Hombres' }))
        } else if (genero === 'Hombre') {
          setFormData(prev => ({ ...prev, genero_interes: 'Mujeres' }))
        }
        setStep(5)
      } else if (result.source === 'alumnos_db') {
        // Existe en padrón UM → ya tenemos nombre/apellidos/genero/edad
        // Auto-asignar genero_interes según género
        const genero = result.alumno?.genero
        if (genero === 'Mujer') {
          setFormData(prev => ({ ...prev, genero_interes: 'Hombres' }))
        } else if (genero === 'Hombre') {
          setFormData(prev => ({ ...prev, genero_interes: 'Mujeres' }))
        }
        setStep(6)
      }
    } else {
      // No existe en ninguna tabla → registro completo
      setExistingAlumno(null)
      setAlumnoSource(null)
      setStep(2)
    }
  }

  const validateStepAndNext = () => {
    setError('')

    if (step === 2) {
      if (!formData.nombre || !formData.apellidos) {
        setError('Ingresa tu nombre y apellidos.')
        return
      }
      if (!formData.fecha_nac) {
        setError('Por favor ingresa tu fecha de nacimiento.')
        return
      }
      const year = new Date(formData.fecha_nac).getFullYear()
      if (year < 1920 || year > new Date().getFullYear() - 15) {
        setError('Fecha de nacimiento no válida (debes tener +15 años).')
        return
      }
    }

    setStep(s => s + 1)
  }

  const prevStep = () => {
    setError('')
    if (step === 5 || step === 6) {
      setExistingAlumno(null)
      setAlumnoSource(null)
      setStep(1)
    } else if (step === 7) {
      // Paso 7 (gustos del padrón) → volver al paso 6 (uni del padrón)
      setStep(6)
    } else {
      setStep(s => s - 1)
    }
  }

  // Subir fotos después del registro
  const uploadPhotosAfterRegister = async (matricula: number) => {
    // Reordenar: la foto principal va al slot 1
    const slots: { file: File; slot: 1 | 2 | 3 }[] = []
    const mainPhoto = photos[mainPhotoIndex]
    if (mainPhoto) slots.push({ file: mainPhoto, slot: 1 })

    let nextSlot: (1 | 2 | 3) = 2
    photos.forEach((photo, i) => {
      if (photo && i !== mainPhotoIndex && nextSlot <= 3) {
        slots.push({ file: photo, slot: nextSlot as 1 | 2 | 3 })
        nextSlot++
      }
    })

    for (const { file, slot } of slots) {
      const fd = new FormData()
      fd.append('file', file)
      await uploadProfilePhoto(matricula, slot, fd)
    }
  }

  // Submit para alumno NUEVO (flujo completo)
  const handleSubmitNew = async () => {
    setError('')
    setLoading(true)

    const data = new FormData()
    data.append('matricula', extractedMatricula)
    data.append('email', formData.email)
    data.append('password', formData.password)
    data.append('nombre', formData.nombre)
    data.append('apellidos', formData.apellidos)
    data.append('fecha_nac', formData.fecha_nac)
    data.append('carrera', formData.carrera === 'Otro' && formData.carrera_custom.trim() ? formData.carrera_custom.trim() : formData.carrera)
    data.append('semestre', formData.semestre)
    data.append('genero', formData.genero)
    data.append('genero_interes', formData.genero_interes)
    data.append('bio', formData.bio)

    const arrayIntereses = [...formData.intereses]
    if (showOtroInteres && formData.intereses_custom.trim()) {
      arrayIntereses.push(formData.intereses_custom.trim())
    }
    data.append('intereses', arrayIntereses.join(', '))

    const res = await registerUser(data)

    if (res.success && res.matricula) {
      if (photos.some(p => p !== null)) {
        await uploadPhotosAfterRegister(res.matricula)
      }
      updateProfile({ name: formData.nombre })
      await login(res.matricula)
      router.push('/')
    } else {
      setError(res.error || 'Error al conectar con la base de datos.')
      setLoading(false)
    }
  }

  // Submit para alumno EXISTENTE (solo poner password + preferencia)
  const handleSubmitExisting = async () => {
    setError('')
    setLoading(true)

    const data = new FormData()
    data.append('matricula', extractedMatricula)
    data.append('email', formData.email)
    data.append('password', formData.password)
    data.append('genero_interes', formData.genero_interes)

    const res = await registerExistingUser(data)

    if (res.success && res.matricula) {
      updateProfile({ name: existingAlumno?.nombre || 'Usuario' })
      await login(res.matricula)
      router.push('/')
    } else {
      setError(res.error || 'Error al conectar con la base de datos.')
      setLoading(false)
    }
  }

  // Submit para alumno del PADRÓN UM (alumnos_db) → nombre/apellidos/genero/edad ya existen
  const handleSubmitPadron = async () => {
    setError('')
    setLoading(true)

    if (!existingAlumno) {
      setError('No se encontró información del alumno. Intenta verificar tu correo nuevamente.')
      setLoading(false)
      return
    }

    const data = new FormData()
    data.append('matricula', extractedMatricula)
    data.append('email', formData.email)
    data.append('password', formData.password)
    data.append('nombre', existingAlumno.nombre)
    data.append('apellidos', existingAlumno.apellidos)
    data.append('genero', existingAlumno.genero || formData.genero)
    data.append('edad', String(existingAlumno.edad || ''))
    data.append('carrera', formData.carrera === 'Otro' && formData.carrera_custom.trim() ? formData.carrera_custom.trim() : formData.carrera)
    data.append('semestre', formData.semestre)
    data.append('genero_interes', formData.genero_interes)
    data.append('bio', formData.bio)

    const arrayIntereses = [...formData.intereses]
    if (showOtroInteres && formData.intereses_custom.trim()) {
      arrayIntereses.push(formData.intereses_custom.trim())
    }
    data.append('intereses', arrayIntereses.join(', '))

    const res = await registerFromPadron(data)

    if (res.success && res.matricula) {
      if (photos.some(p => p !== null)) {
        await uploadPhotosAfterRegister(res.matricula)
      }
      updateProfile({ name: existingAlumno.nombre })
      await login(res.matricula)
      router.push('/')
    } else {
      setError(res.error || 'Error al conectar con la base de datos.')
      setLoading(false)
    }
  }

  // Calcular progreso
  const getProgress = () => {
    if (alumnoSource === 'alumnos') return { total: 2, current: step === 1 ? 1 : 2 }
    if (alumnoSource === 'alumnos_db') return { total: 3, current: step === 1 ? 1 : step === 6 ? 2 : step === 7 ? 3 : 1 }
    return { total: 4, current: step }
  }
  const { total: totalSteps, current: currentProgress } = getProgress()
  const progressPercent = (currentProgress / totalSteps) * 100

  return (
    <div className="min-h-screen flex w-full font-sans text-gray-900 bg-gray-50">

      {/* PANEL ESCRITORIO */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-violet-600 via-pink-500 to-rose-500 p-12 flex-col justify-between overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">UniConnect</h1>
        </div>

        <div className="relative z-10 translate-y-[-10%]">
          <h2 className="text-6xl font-bold text-white mb-6 leading-[1.15]">No estudies<br/>solo nunca más.</h2>
          <p className="text-2xl text-white/90 max-w-lg font-light leading-relaxed">Únete a la exclusiva red de alumnos de la UM. Conoce amigos, encuentra pareja para proyectos y haz el match perfecto.</p>
        </div>

        <div className="relative z-10 text-white/60 font-medium tracking-wide text-sm flex gap-6">
          <span>&copy; {new Date().getFullYear()} UniConnect</span>
        </div>

        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-white/10 mix-blend-overlay rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* FORMULARIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-0 lg:p-8">
        <div className="w-full h-full lg:h-[800px] max-w-xl bg-white lg:rounded-3xl lg:shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col relative overflow-hidden ring-1 ring-gray-100/50">

          <div className="px-8 pt-12 pb-2">
            <div className="flex items-center mb-8">
              {step > 1 ? (
                <button onClick={prevStep} className="p-3 -ml-3 text-gray-400 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
              ) : (
                <Link href="/login" className="p-3 -ml-3 text-gray-400 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </Link>
              )}
              <div className="flex-1 flex justify-center lg:hidden">
                <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">Uniconnect</span>
              </div>
              <div className="flex-1 lg:hidden"></div>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-2 text-right">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Paso {currentProgress} de {totalSteps}</span>
            </div>
          </div>

          {error && (
            <div className="mx-8 mt-2 p-4 bg-red-50/80 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-semibold animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div className="flex-1 px-8 pt-4 overflow-y-auto pb-40 scrollbar-hide">

            {/* ======================== PASO 1: CORREO + PASSWORD ======================== */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Regístrate</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-6">Ingresa tu correo institucional. Tu matrícula se detectará automáticamente.</p>

                <button
                  type="button"
                  onClick={() => handleGoogleRegister()}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mb-6"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? 'Conectando...' : 'Continuar con Google'}
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">o</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Correo Institucional</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="1190000@alumno.um.edu.mx" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
                    {extractedMatricula && (
                      <p className="mt-2 ml-1 text-sm text-emerald-600 font-semibold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                        Matrícula: {extractedMatricula}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Crea tu Contraseña</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
                  </div>
                </div>
              </div>
            )}

            {/* ======================== PASO 2: INFO PERSONAL (SOLO NUEVOS) ======================== */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Sobre ti</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">No te encontramos en el sistema. Cuéntanos de ti.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Nombre(s)</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Tu nombre" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Apellidos</label>
                    <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Tus apellidos" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Fecha de Nacimiento</label>
                    <input type="date" name="fecha_nac" value={formData.fecha_nac} onChange={handleChange} className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all font-medium" />
                  </div>
                </div>
              </div>
            )}

            {/* ======================== PASO 3: UNI (SOLO NUEVOS) ======================== */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Hola, {formData.nombre.split(' ')[0] || 'futuro match'}</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">Detalles de tu vida como universitario.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Escuela / Carrera</label>
                    <select name="carrera" value={formData.carrera} onChange={handleChange} className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all font-medium appearance-none">
                      <option value="" disabled>Selecciona tu carrera</option>
                      {CARRERAS.map((c, index) => (
                        <option key={index} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {formData.carrera === 'Otro' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">¿Cuál carrera?</label>
                      <input type="text" name="carrera_custom" value={formData.carrera_custom} onChange={handleChange} placeholder="Escribe tu carrera" className="text-gray-900 w-full px-5 py-4 text-lg bg-pink-50/50 border-2 border-pink-100 focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-pink-300 font-medium" />
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Semestre Actual</label>
                      <select name="semestre" value={formData.semestre} onChange={handleChange} className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all font-medium appearance-none">
                        <option value="" disabled>Selecciona semestre</option>
                        {Array.from({ length: 14 }, (_, i) => i + 1).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Yo soy</label>
                      <select name="genero" value={formData.genero} onChange={handleChange} className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all font-medium appearance-none">
                        <option value="" disabled>Elegir</option>
                        <option value="Mujer">Mujer</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== PASO 4: GUSTOS (SOLO NUEVOS) ======================== */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Tus Gustos</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">Sube fotos, escribe tu bio y elige tus hobbies.</p>

                <div className="space-y-8">
                  {/* FOTOS */}
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-3">Tus Fotos <span className="text-gray-400 font-normal">(toca una para hacerla principal)</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="relative">
                          <label className={`flex items-center justify-center aspect-[3/4] rounded-2xl cursor-pointer overflow-hidden transition-all border-2 ${
                            photoPreviews[i]
                              ? mainPhotoIndex === i ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-gray-200'
                              : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                          }`}>
                            {photoPreviews[i] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photoPreviews[i]!}
                                alt={`Foto ${i + 1}`}
                                className="w-full h-full object-cover"
                                onClick={(e) => { e.preventDefault(); setMainPhotoIndex(i) }}
                              />
                            ) : (
                              <div className="text-center p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mx-auto mb-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                </svg>
                                <span className="text-xs text-gray-400 font-medium">Foto {i + 1}</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(i, e)} />
                          </label>
                          {photoPreviews[i] && (
                            <>
                              <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70 transition">
                                ✕
                              </button>
                              {mainPhotoIndex === i && (
                                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                  Principal
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Biografía (Lo que los demás leerán)</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Ej: Me encanta ir por un café después de clases y jugar videojuegos..." className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium resize-none shadow-sm" />
                  </div>

                  <div className="space-y-6 pb-6 border-t border-gray-100 pt-6">
                    <label className="block text-sm font-bold text-gray-600 ml-1">Selecciona tus hobbies <span className="text-pink-500 font-normal ml-2">{formData.intereses.length > 0 && `(${formData.intereses.length})`}</span></label>

                    {INTERESES_CATEGORIAS.map((cat, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{cat.nombre}</h3>
                        <div className="flex flex-wrap gap-2">
                          {cat.hobbies.map((hobby) => {
                            const isSelected = formData.intereses.includes(hobby)
                            return (
                              <button
                                key={hobby}
                                type="button"
                                onClick={() => toggleInteres(hobby)}
                                className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border cursor-pointer active:scale-95 ${isSelected ? cat.colorOn : cat.colorOff}`}
                              >
                                {hobby}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowOtroInteres(!showOtroInteres)}
                        className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border cursor-pointer active:scale-95 ${showOtroInteres ? 'bg-gray-800 text-white shadow-lg border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        + Añadir Otro Diferente
                      </button>
                    </div>

                    {showOtroInteres && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                        <input type="text" name="intereses_custom" value={formData.intereses_custom} onChange={handleChange} placeholder="Ej: Ajedrez, Robótica, Surf..." className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-gray-800 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm" />
                        <p className="text-xs text-gray-400 mt-2 ml-1">Si tienes varios, sepáralos con comas.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================== PASO 5: ALUMNO YA EN "alumnos" SIN PASSWORD ======================== */}
            {step === 5 && existingAlumno && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">¡Te encontramos!</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-8">Ya tienes perfil en UniConnect. Solo activa tu cuenta.</p>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900 text-lg">{existingAlumno.nombre} {existingAlumno.apellidos}</h3>
                      <p className="text-emerald-700 text-sm">Matrícula: {existingAlumno.matricula}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {existingAlumno.carrera && (
                      <div className="bg-white/60 rounded-xl px-4 py-3">
                        <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">Carrera</p>
                        <p className="text-gray-800 font-medium">{existingAlumno.carrera}</p>
                      </div>
                    )}
                    {existingAlumno.genero && (
                      <div className="bg-white/60 rounded-xl px-4 py-3">
                        <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">Género</p>
                        <p className="text-gray-800 font-medium">{existingAlumno.genero}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ======================== PASO 6: ALUMNO DEL PADRÓN (alumnos_db) → UNI INFO ======================== */}
            {step === 6 && existingAlumno && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Hola, {existingAlumno.nombre.split(' ')[0]}</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">Detalles de tu vida como universitario.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Escuela / Carrera</label>
                    <select name="carrera" value={formData.carrera} onChange={handleChange} className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all font-medium appearance-none">
                      <option value="" disabled>Selecciona tu carrera</option>
                      {CARRERAS.map((c, index) => (
                        <option key={index} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {formData.carrera === 'Otro' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">¿Cuál carrera?</label>
                      <input type="text" name="carrera_custom" value={formData.carrera_custom} onChange={handleChange} placeholder="Escribe tu carrera" className="text-gray-900 w-full px-5 py-4 text-lg bg-pink-50/50 border-2 border-pink-100 focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-pink-300 font-medium" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Semestre Actual</label>
                    <select name="semestre" value={formData.semestre} onChange={handleChange} className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all font-medium appearance-none">
                      <option value="" disabled>Selecciona semestre</option>
                      {Array.from({ length: 14 }, (_, i) => i + 1).map(s => (
                        <option key={s} value={s}>{s}° semestre</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== PASO 7: GUSTOS (PADRÓN UM) ======================== */}
            {step === 7 && existingAlumno && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Tus Gustos</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">Último paso. Sube fotos, bio y hobbies.</p>

                <div className="space-y-8">
                  {/* FOTOS */}
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-3">Tus Fotos <span className="text-gray-400 font-normal">(toca una para hacerla principal)</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="relative">
                          <label className={`flex items-center justify-center aspect-[3/4] rounded-2xl cursor-pointer overflow-hidden transition-all border-2 ${
                            photoPreviews[i]
                              ? mainPhotoIndex === i ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-gray-200'
                              : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                          }`}>
                            {photoPreviews[i] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photoPreviews[i]!}
                                alt={`Foto ${i + 1}`}
                                className="w-full h-full object-cover"
                                onClick={(e) => { e.preventDefault(); setMainPhotoIndex(i) }}
                              />
                            ) : (
                              <div className="text-center p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mx-auto mb-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                </svg>
                                <span className="text-xs text-gray-400 font-medium">Foto {i + 1}</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(i, e)} />
                          </label>
                          {photoPreviews[i] && (
                            <>
                              <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70 transition">
                                ✕
                              </button>
                              {mainPhotoIndex === i && (
                                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                  Principal
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Biografía</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Ej: Me encanta ir por un café después de clases y jugar videojuegos..." className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium resize-none shadow-sm" />
                  </div>

                  <div className="space-y-6 pb-6 border-t border-gray-100 pt-6">
                    <label className="block text-sm font-bold text-gray-600 ml-1">Selecciona tus hobbies <span className="text-pink-500 font-normal ml-2">{formData.intereses.length > 0 && `(${formData.intereses.length})`}</span></label>

                    {INTERESES_CATEGORIAS.map((cat, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{cat.nombre}</h3>
                        <div className="flex flex-wrap gap-2">
                          {cat.hobbies.map((hobby) => {
                            const isSelected = formData.intereses.includes(hobby)
                            return (
                              <button key={hobby} type="button" onClick={() => toggleInteres(hobby)} className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border cursor-pointer active:scale-95 ${isSelected ? cat.colorOn : cat.colorOff}`}>
                                {hobby}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <button type="button" onClick={() => setShowOtroInteres(!showOtroInteres)} className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border cursor-pointer active:scale-95 ${showOtroInteres ? 'bg-gray-800 text-white shadow-lg border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        + Añadir Otro Diferente
                      </button>
                    </div>

                    {showOtroInteres && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                        <input type="text" name="intereses_custom" value={formData.intereses_custom} onChange={handleChange} placeholder="Ej: Ajedrez, Robótica, Surf..." className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-gray-800 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm" />
                        <p className="text-xs text-gray-400 mt-2 ml-1">Si tienes varios, sepáralos con comas.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ======================== BOTÓN INFERIOR ======================== */}
          <div className="absolute lg:relative bottom-0 w-full p-8 lg:bg-white bg-gradient-to-t from-white via-white to-transparent pt-16 lg:pt-8 mt-auto rounded-b-3xl">
            {step === 1 && (
              <button
                onClick={validateStep1}
                disabled={loading || !formData.email || formData.password.length < 6}
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando...
                  </>
                ) : 'Verificar Correo'}
              </button>
            )}

            {step >= 2 && step <= 3 && (
              <button
                onClick={validateStepAndNext}
                disabled={
                  (step === 2 && (!formData.nombre || !formData.apellidos || !formData.fecha_nac)) ||
                  (step === 3 && (!formData.carrera || (formData.carrera === 'Otro' && !formData.carrera_custom) || !formData.semestre || !formData.genero))
                }
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                Siguiente Paso
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleSubmitNew}
                disabled={loading || !formData.bio || (formData.intereses.length === 0 && !formData.intereses_custom)}
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(236,72,153,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Autenticando...
                  </>
                ) : "¡Terminar Registro!"}
              </button>
            )}

            {step === 5 && (
              <button
                onClick={handleSubmitExisting}
                disabled={loading}
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Activando cuenta...
                  </>
                ) : "¡Activar mi Cuenta!"}
              </button>
            )}

            {step === 6 && (
              <button
                onClick={() => { setError(''); setStep(7) }}
                disabled={!formData.carrera || (formData.carrera === 'Otro' && !formData.carrera_custom) || !formData.semestre}
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                Siguiente Paso
              </button>
            )}

            {step === 7 && (
              <button
                onClick={handleSubmitPadron}
                disabled={loading || !formData.bio || (formData.intereses.length === 0 && !formData.intereses_custom)}
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(236,72,153,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando cuenta...
                  </>
                ) : "¡Terminar Registro!"}
              </button>
            )}

            <div className="hidden lg:block text-center mt-6">
              <p className="text-gray-400 text-sm font-medium">¿Ya tienes cuenta? <Link href="/login" className="text-pink-500 hover:text-pink-600 transition-colors">Inicia sesión</Link></p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
