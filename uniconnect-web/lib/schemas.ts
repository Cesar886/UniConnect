import { z } from 'zod'

export const matriculaSchema = z.string().regex(/^\d{7}$/, 'La matrícula debe ser de 7 dígitos')

export const loginSchema = z.object({
  identificador: z.string().min(1, 'Identificador requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z.object({
  matricula: matriculaSchema,
  email: z.string().email('Email inválido').endsWith('@alumno.um.edu.mx', 'Solo correos @alumno.um.edu.mx'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(1, 'Nombre requerido'),
  apellidos: z.string().min(1, 'Apellidos requeridos'),
  genero: z.enum(['M', 'F', 'O']).optional(),
  edad: z.number().min(16).max(99).optional(),
  carrera: z.string().optional(),
  semestre: z.number().min(1).max(15).optional(),
  genero_interes: z.enum(['M', 'F', 'B']).optional(),
  bio: z.string().max(500).optional(),
  intereses: z.string().optional(),
})

export const messageSchema = z.object({
  receiverId: z.number(),
  text: z.string().min(1).max(2000),
})
