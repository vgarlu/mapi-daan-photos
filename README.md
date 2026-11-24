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
photos  CNAME  vgarlu.github.io   (Cloudflare, proxy activo)
```

Cloudflare delante de Pages: SSL **Full (strict)**, Always Use HTTPS, TLS mín. 1.2, Brotli y HTTP/3.
Cache Rules de la zona (`mapi-daan-2026.com`):

| Ruta | Edge | Navegador |
|---|---|---|
| `/` y `*.html` | **sin caché** (cambios al instante) | — |
| `/images/*`, `/thumbs/*` | 1 año | 30 días |
| `/assets/*` | 1 mes | 7 días |

Para publicar (commit + push + espera a Pages + purga del edge):

```bash
./deploy.sh "mensaje del commit"
```

La purga es necesaria porque las fotos se cachean un año: si se regeneran con el mismo
nombre de fichero, hay que invalidar. Token en `~/.config/cloudflare/token` (chmod 600),
zona `8ec8c270316aa81ddcf12ae2ecb0a498`.

## No incluido

La sección TIENDA del original (impresiones, álbumes, carrito) era el e-commerce de Pic-Time.
