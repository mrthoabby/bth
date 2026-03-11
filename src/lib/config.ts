export interface RiddleConfig {
  riddle: string;
  answer: string;
  hints: string[];
  /** 'multiple' = elegir una opción; 'text' = escribir respuesta. */
  type?: 'text' | 'multiple';
  /** Opciones para tipo múltiple (una debe coincidir con answer al normalizar). */
  options?: string[];
}

export interface StopMediaConfig {
  type: 'video' | 'image' | 'call';
  /** src aplica para video/image */
  src?: string;
  /** etiqueta opcional para mostrar en UI */
  label?: string;
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
