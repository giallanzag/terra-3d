#!/usr/bin/env python3
"""
Converte una maschera terra/mare in bianco e nero (equirettangolare) nel formato letto da Terra 4,6.

Uso:
    python3 scripts/prepara_mappa.py ingresso.png src/mappe/nome_mappa.png [--invertita] [--soglia 128]

Ingresso: immagine equirettangolare (longitudine −180…+180° sull'asse x, latitudine +90…−90° sull'asse y) in cui la
          terra è chiara e il mare è scuro (usa --invertita se è il contrario). Se la mappa paleogeografica che hai
          scaricato è a colori (batimetria, altimetria), ricavane prima una maschera con il tuo software GIS o con
          una soglia sulla quota.
Uscita:   PNG 2048×1024 con
            R = maschera nitida (terra = 255)
            G = maschera sfocata, σ = 8 px (≈ 1,4°)   → piattaforme continentali e livello del mare
            B = maschera molto sfocata, σ = 40 px (≈ 7°) → "continentalità" (interno dei continenti)
Dipendenze: Pillow, NumPy.

ATTENZIONE alle licenze: questo script NON scarica nulla. Prima di aggiungere una mappa a src/mappe/ verifica la
licenza dell'autore (vedi README) e dichiarala in src/mappe/manifest.json con "licenzaVerificata": true.
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter


def sfoca_con_avvolgimento(img: Image.Image, sigma: float) -> np.ndarray:
    """Sfocatura gaussiana che tratta l'asse x come periodico (la longitudine si chiude su se stessa)."""
    a = np.asarray(img)
    pad = int(sigma * 4)
    esteso = np.concatenate([a[:, -pad:], a, a[:, :pad]], axis=1)
    sfocato = Image.fromarray(esteso).filter(ImageFilter.GaussianBlur(sigma))
    return np.asarray(sfocato)[:, pad:-pad]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('ingresso')
    ap.add_argument('uscita')
    ap.add_argument('--invertita', action='store_true', help='la terra è scura e il mare chiaro')
    ap.add_argument('--soglia', type=int, default=128, help='soglia 0–255 per binarizzare (default 128)')
    a = ap.parse_args()

    img = Image.open(a.ingresso).convert('L')
    if abs(img.width / img.height - 2) > 0.01:
        raise SystemExit(f'Attenzione: la mappa deve essere equirettangolare (rapporto 2:1), questa è {img.width}×{img.height}.')
    bn = img.point(lambda v: 255 if v >= a.soglia else 0)
    if a.invertita:
        bn = bn.point(lambda v: 255 - v)
    # Ridimensionamento con LANCZOS: i bordi diventano antialias
    m = bn.resize((2048, 1024), Image.LANCZOS)
    r = np.asarray(m)
    g = sfoca_con_avvolgimento(m, 8)
    b = sfoca_con_avvolgimento(m, 40)
    Image.fromarray(np.stack([r, g, b], axis=-1).astype(np.uint8), 'RGB').save(a.uscita, optimize=True)
    peso = np.cos(np.radians(np.linspace(90, -90, 1024)))[:, None]
    print(f'Scritto {a.uscita}. Copertura terre (pesata per area): {((r > 127) * peso).sum() / (peso.sum() * 2048):.3f}')


if __name__ == '__main__':
    main()
