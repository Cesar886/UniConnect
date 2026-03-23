export interface Profile {
  id: string
  name: string
  age: number
  career: string
  semester: number
  bio: string
  interests: string[]
  photos: string[]
}

export interface Match {
  id: string
  profile: Profile
  messages: Message[]
  timestamp: string
  unread: number
}

export interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
}

export const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'Valentina García',
    age: 21,
    career: 'Psicología',
    semester: 5,
    bio: 'Amante de los libros y el café ☕ Buscando alguien para estudiar juntos 📚',
    interests: ['Lectura', 'Café', 'Yoga', 'Música'],
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop'],
  },
  {
    id: '2',
    name: 'Santiago Rodríguez',
    age: 22,
    career: 'Ingeniería Civil',
    semester: 7,
    bio: 'Guitarrista de medio tiempo 🎸 Futbolero de tiempo completo ⚽',
    interests: ['Fútbol', 'Guitarra', 'Gym', 'Videojuegos'],
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'],
  },
  {
    id: '3',
    name: 'Camila Hernández',
    age: 20,
    career: 'Diseño Gráfico',
    semester: 4,
    bio: 'Creativa por naturaleza 🎨 Netflix & sushi = plan perfecto 🍣',
    interests: ['Arte', 'Netflix', 'Fotografía', 'Viajes'],
    photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop'],
  },
  {
    id: '4',
    name: 'Diego Martínez',
    age: 23,
    career: 'Medicina',
    semester: 9,
    bio: 'Futuro doctor 🩺 Pero primero, un café contigo ☕',
    interests: ['Ciencia', 'Running', 'Cocinar', 'Podcasts'],
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop'],
  },
  {
    id: '5',
    name: 'Isabella López',
    age: 21,
    career: 'Comunicación',
    semester: 6,
    bio: 'Adicta a los memes y al true crime 🔍 Dog mom 🐶',
    interests: ['Memes', 'True Crime', 'Perros', 'TikTok'],
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop'],
  },
  {
    id: '6',
    name: 'Andrés Morales',
    age: 22,
    career: 'Arquitectura',
    semester: 8,
    bio: 'Diseñando mi futuro un plano a la vez 📐 Amante del buen café',
    interests: ['Diseño', 'Café', 'Fotografía', 'Viajes'],
    photos: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop'],
  },
  {
    id: '7',
    name: 'Sofía Ramírez',
    age: 20,
    career: 'Derecho',
    semester: 3,
    bio: 'Futura abogada 👩‍⚖️ Debatir es mi cardio. Pizza > todo',
    interests: ['Debate', 'Política', 'Pizza', 'Cine'],
    photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop'],
  },
  {
    id: '8',
    name: 'Mateo Ruiz',
    age: 24,
    career: 'Administración',
    semester: 10,
    bio: 'Emprendedor en progreso 🚀 Si me invitas un café te cuento mi startup',
    interests: ['Negocios', 'Gym', 'Podcast', 'Networking'],
    photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop'],
  },
]
