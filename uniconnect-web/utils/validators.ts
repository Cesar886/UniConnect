export const isUniversityEmail = (email: string) => {
  return email.endsWith('@um.edu.mx') || email.endsWith('@alumno.um.edu.mx')
}