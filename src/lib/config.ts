export interface RiddleConfig {
  riddle: string;
  answer: string;
  hints: string[];
  /** 'multiple' = elegir una opción; 'text' = escribir respuesta; 'fill' = completar blancos inline con {1} {2} en el texto. */
  type?: 'text' | 'multiple' | 'fill';
  /** Opciones para tipo múltiple (una debe coincidir con answer al normalizar). */
  options?: string[];
  /** Frase que aparece al responder correctamente, explicando el porqué. */
  confirmationMessage?: string;
}

export interface StopMediaConfig {
  type: 'video' | 'image' | 'call';
  /** src aplica para video/image */
  src?: string;
  /** etiqueta opcional para mostrar en UI */
  label?: string;
  /**
   * Imagen que se muestra SIN difuminar durante el acertijo (contexto/pista visual).
   * Al resolver, se reemplaza por el contenido normal (src).
   * Exclusivo de islas enigma.
   */
  keyImage?: string;
}

export interface StopChallengeConfig {
  id: string;
  title: string;
  riddle: RiddleConfig;
  media: StopMediaConfig;
}

export interface StopConfig {
  id: string;
  title: string;
  emoji: string;
  /** Si true, el nombre inicia oculto y se revela al % configurado. */
  hiddenName?: boolean;
  /** Porcentaje de acertijos resueltos para revelar nombre. default: 30 */
  revealNameAtPercent?: number;
  challenges: StopChallengeConfig[];
}

export interface BirthdayConfig {
  secretWord: string;
  intro: RiddleConfig;
  birthdayScene: {
    music: string;
    message: string;
    subMessage: string;
  };
  photoSession: {
    title: string;
    subtitle: string;
    totalPhotos: number;
  };
  stops: StopConfig[];
  final: {
    title: string;
    emoji: string;
    callEndpoint: string;
    finalMessage: string;
    finalSubMessage: string;
  };
}

export async function loadConfig(): Promise<BirthdayConfig> {
  const res = await fetch('/config.json', { cache: 'no-store' });
  return res.json();
}
