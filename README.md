# Camino Plateado — Sitio corporativo (estático)

Este proyecto es un sitio **one‑page** corporativo con sección **Recursos** (Informes PDF / Mapas web / Tableros Power BI).

## Estructura
- `index.html` — página principal (one‑page).
- `assets/recursos.json` — **catálogo** de recursos (editar acá para sumar/quitar).
- `assets/` — imágenes, miniaturas, PDFs (si querés servirlos desde el sitio).
- `sitemap.xml`, `robots.txt`, `site.webmanifest` — básicos SEO/PWA.

## Cómo agregar un recurso
1. Subí el archivo (si aplica):
   - PDF → `assets/pdfs/mi-informe.pdf`
   - Miniatura → `assets/thumbs/mi-informe.jpg`
2. Editá `assets/recursos.json` y agregá un objeto:
```json
{
  "id": 4,
  "slug": "economia-plateada-servicios-financieros",
  "tipo": "pdf",
  "titulo": "Economía Plateada: servicios financieros",
  "descripcion": "Oportunidades y propuestas para el mercado 60+.",
  "miniatura": "assets/thumbs/economia-plateada.jpg",
  "url": "assets/pdfs/economia-plateada.pdf",
  "size": "xl"
}
```

## Deep links (abrir recurso directo)
Podés compartir links que abren el modal automáticamente:
- `https://caminoplateado.com/?r=economia-plateada-servicios-financieros` (por `slug`)
- `https://caminoplateado.com/?r=4` (por `id`)

## Modal fullscreen para mapas
Para `tipo: "mapa"`, el modal usa tamaño `screen` (casi 100% del viewport).

## Botón "Abrir en pestaña nueva"
En el modal hay un botón para abrir el recurso en una pestaña nueva (útil para mapas y tableros).

## Deploy (Cloudflare Pages)
- Build command: `exit 0`
- Output directory: `.`
- Conectar dominio en Pages → Custom domains (`caminoplateado.com` y `www`).

