'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { registerUser } from '@/app/actions/auth'

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

export default function RegisterResponsivePage() {
  const router = useRouter()
  const { login, updateProfile } = useApp()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    matricula: '',
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

  const validateStepAndNext = () => {
    setError('')
    
    if (step === 1) {
      if (!/^\d{7}$/.test(formData.matricula)) {
        setError('Tu matrícula debe contener exactamente 7 números continuos.')
        return
      }
      if (!formData.email.endsWith('@alumno.um.edu.mx')) {
        setError('Acceso denegado. Debes usar obligatoriamente tu cuenta de @alumno.um.edu.mx.')
        return
      }
      if (formData.password.length < 6) {
        setError('Escribe una contraseña de al menos 6 caracteres.')
        return
      }
    }

    if (step === 2) {
      if (!formData.fecha_nac) {
        setError('Por favor ingresa tu fecha de nacimiento.')
        return
      }
      const year = new Date(formData.fecha_nac).getFullYear();
      if (year < 1920 || year > new Date().getFullYear() - 15) {
        setError('Fecha de nacimiento no válida (debes tener +15 años de edad).')
        return
      }
    }

    setStep(s => s + 1)
  }

  const prevStep = () => {
    setError('')
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    if (!/^\d{7}$/.test(formData.matricula) || !formData.email.endsWith('@alumno.um.edu.mx')) {
      setError('Se detectó información alterada.')
      setLoading(false)
      return
    }

    const data = new FormData()
    
    Object.entries(formData).forEach(([key, value]) => {
      if (!['intereses', 'carrera_custom', 'intereses_custom'].includes(key)) {
        data.append(key, value as string)
      }
    })

    if (formData.carrera === 'Otro' && formData.carrera_custom.trim() !== '') {
      data.set('carrera', formData.carrera_custom.trim())
    }

    const arrayIntereses = [...formData.intereses]
    if (showOtroInteres && formData.intereses_custom.trim() !== '') {
      arrayIntereses.push(formData.intereses_custom.trim())
    }
    data.append('intereses', arrayIntereses.join(', '))

    const res = await registerUser(data)

    if (res.success && res.matricula) {
      updateProfile({ name: formData.nombre })
      login(res.matricula)
      setLoading(false)
      router.push('/')
    } else {
      setError(res.error || 'Error al conectar con la base de datos.')
      setLoading(false)
    }
  }

  const progressPercent = (step / 4) * 100

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
          <span>© {new Date().getFullYear()} UniConnect</span>
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
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Paso {step} de 4</span>
            </div>
          </div>

          {error && (
            <div className="mx-8 mt-2 p-4 bg-red-50/80 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-semibold animate-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <div className="flex-1 px-8 pt-4 overflow-y-auto pb-40 scrollbar-hide">
            
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Regístrate</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">Ingresa las credenciales de tu universidad para verificar que eres alumno.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Matrícula Escolar (7 dígitos)</label>
                    <input type="text" maxLength={7} inputMode="numeric" name="matricula" value={formData.matricula} onChange={handleChange} placeholder="Ej. 1190000" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Correo Institucional Oficial</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="estudiante@alumno.um.edu.mx" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Contraseña</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Crea una contraseña segura" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Sobre ti</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">¿Cómo te llamas y cuándo naciste?</p>

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

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">La U</h1>
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
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Semestre Actual</label>
                      <input type="number" name="semestre" value={formData.semestre} onChange={handleChange} min="1" max="14" placeholder="1er semestre" className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium" />
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
                    <div>
                      <label className="block text-sm font-bold text-gray-600 ml-1 mb-2">Me interesa</label>
                      <select name="genero_interes" value={formData.genero_interes} onChange={handleChange} className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all font-medium appearance-none">
                        <option value="" disabled>Elegir</option>
                        <option value="Hombres">Hombres</option>
                        <option value="Mujeres">Mujeres</option>
                        <option value="Ambos">Ambos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Tus Gustos</h1>
                <p className="text-gray-500 text-lg lg:text-xl mb-10">¿Qué te apasiona hacer en tu tiempo libre?</p>

                <div className="space-y-8">
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

          </div>

          <div className="absolute lg:relative bottom-0 w-full p-8 lg:bg-white bg-gradient-to-t from-white via-white to-transparent pt-16 lg:pt-8 mt-auto rounded-b-3xl">
            {step < 4 ? (
              <button 
                onClick={validateStepAndNext}
                disabled={
                  (step === 1 && (!formData.matricula || !formData.email || formData.password.length < 6)) ||
                  (step === 2 && (!formData.nombre || !formData.apellidos || !formData.fecha_nac)) ||
                  (step === 3 && (!formData.carrera || (formData.carrera === 'Otro' && !formData.carrera_custom) || !formData.semestre || !formData.genero || !formData.genero_interes))
                }
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                Siguiente Paso
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading || !formData.bio || (formData.intereses.length === 0 && !formData.intereses_custom)}
                className="w-full py-5 text-xl font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(236,72,153,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Autenticando...
                  </>
                ) : "¡Terminar Registro! 🎉"}
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
