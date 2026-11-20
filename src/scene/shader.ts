import rumore from '../shaders/rumore.glsl?raw';

/** Prepone la libreria di rumore GLSL (hash, rumore 3D, fbm) al codice dello shader. */
export const conRumore = (sorgente: string): string => rumore + '\n' + sorgente;
