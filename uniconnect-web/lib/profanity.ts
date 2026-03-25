/**
 * Lógica básica para filtrar palabras inapropiadas en UNICONNECT.
 * Enfocada en mantener un ambiente escolar amigable.
 */

const BAD_WORDS_ES = [
  'puto', 'puta', 'pendejo', 'pendeja', 'pendejada', 'chinga', 'chingar', 'chingado', 'verga', 'culero', 'culera', 'culo', 'mierda', 'poto', 'concha',
  'estúpido', 'estúpida', 'idiota', 'baboso', 'weon', 'weona', 'marico', 'maricon', 'zorra', 'bastardo', 'maldito', 'maldita', 'perra',
  'nazi', 'violador', 'gay' // Algunos pueden ser contexto pero se filtran si el usuario lo pide estricto
];

const BAD_WORDS_EN = [
  'fuck', 'shit', 'asshole', 'bitch', 'dick', 'pussy', 'nigger', 'faggot', 'bastard', 'cunt'
];

const BLACKLIST = new Set([...BAD_WORDS_ES, ...BAD_WORDS_EN]);

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  // Limpiar texto (quitar acentos para búsqueda básica)
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // Dividir por palabras y caracteres especiales
  const words = normalized.split(/[\s,.;:!?()_/-]+/);

  for (const word of words) {
    if (BLACKLIST.has(word)) return true;
  }

  // Búsqueda de subcadenas para palabras compuestas (opcional, puede dar falsos positivos)
  // for (const bad of BLACKLIST) {
  //   if (normalized.includes(bad)) return true;
  // }

  return false;
}

export function filterProfanity(text: string): string {
  if (!text) return '';
  
  let filtered = text;
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const words = normalized.split(/[\s,.;:!?()_/-]+/);
  
  for (const word of words) {
    if (BLACKLIST.has(word)) {
      // Reemplazar con asteriscos en la original (manteniendo longitud si es posible)
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filtered = filtered.replace(regex, '****');
    }
  }

  return filtered;
}
