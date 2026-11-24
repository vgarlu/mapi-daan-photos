# Mapi - Daan · Galería de fotos

Copia de la galería de Pic-Time (`pixelart.pic-time.com/-mapi-daan/gallery`) servida en
**https://photos.mapi-daan-2026.com**

## Qué contiene

- **2.006 fotos** de las 8 escenas originales (Mapi, Ceremonia, Familia, Retratos, Aperitivo,
  Comida, Baile - Fiesta, Blanco & Negro), descargadas a la máxima resolución que Pic-Time
  sirve públicamente: `lowres` = **1067 × 1600 px** (~430 KB por foto). No existe `midres`,
  `highres` ni original accesibles sin cuenta de compra.
- `thumbs/*.webp` — miniaturas de 480 px generadas a partir de las anteriores para el grid.
- `data/photos.json` — orden, escena, dimensiones y orientación de cada foto.
- Portada, mosaico de 3 columnas (celdas 2:3, paisajes a 2 columnas, gap 3 px, márgenes 61 px,
  medidos sobre el original), lightbox con teclado/swipe/descarga y favoritas en `localStorage`.
- Logo `Daan & Mapi` compuesto con los PNG originales de `mapi-daan-2026.com`
  (`assets/_src/` contiene las piezas).

## Regenerar

```bash
python3 build.py    # recalcula data/photos.json y las miniaturas desde images/
```

## Despliegue

GitHub Pages sirve la rama `main` en la raíz. El dominio vive en `CNAME` y el registro DNS es:

```
photos  CNAME  vgarlu.github.io   (Cloudflare, DNS only)
```

Para publicar cambios: `git add -A && git commit -m "..." && git push`.

## No incluido

La sección TIENDA del original (impresiones, álbumes, carrito) era el e-commerce de Pic-Time.
