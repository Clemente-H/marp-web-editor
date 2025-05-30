# CENIA Marp Web Editor

Un editor web compatible con Marp diseñado específicamente para el equipo de CENIA (Centro Nacional de Inteligencia Artificial).

## 🚀 Características

- ✅ **Editor Markdown** con sintaxis highlighting
- ✅ **Preview en tiempo real** de las diapositivas
- ✅ **Compatible con Marp** - misma sintaxis y directivas
- ✅ **Tema CENIA** personalizado con branding corporativo
- ✅ **Export HTML/PDF/PPTX** para compartir presentaciones
- ✅ **Backgrounds automáticos** según tipo de slide
- ✅ **Auto-save** en localStorage
- ✅ **Navegación con teclado** y shortcuts
- ✅ **Deploy en GitHub Pages** - sin servidor requerido

## 🎯 Uso

### Acceso Rápido
Visita: `https://tu-usuario.github.io/cenia-marp-editor`

### Sintaxis Marp Soportada

#### Separar Slides
```markdown
---
```

#### Directivas Globales (al inicio)
```markdown
---
theme: cenia
paginate: true
size: 16:9
---
```

#### Directivas por Slide
```markdown
<!-- class: title-slide -->
<!-- class: section-slide -->
```

#### Formato de Texto
```markdown
# Título Principal
## Subtítulo
### Sección

**Texto en negrita**
*Texto en cursiva*

- Lista item 1
- Lista item 2

1. Lista numerada
2. Segundo item
```

#### Imágenes Especiales
```markdown
![w:300](imagen.jpg)  # Ancho específico
![h:200](imagen.jpg)  # Alto específico
![fit](imagen.jpg)    # Ajustar a slide
![bg](imagen.jpg)     # Imagen de fondo
```

#### Columnas
```markdown
Contenido izquierdo

<!-- split -->

Contenido derecho
```

#### Cajas Especiales
```markdown
> **Info:** Información importante
> **Warning:** Advertencia
> **Success:** Mensaje de éxito
```

## 🎨 Tema CENIA

El tema personalizado incluye:

- **Colores corporativos**: Rosa CENIA (#e72887) y azul (#002060)
- **Typography moderna** optimizada para presentaciones
- **Backgrounds automáticos** con imágenes CENIA
- **Layouts especiales** para slides de título y secciones

### Clases de Slide Especiales

```markdown
<!-- class: title-slide -->
# Slide de Título
Presentación especial con fondo azul

<!-- class: section-slide -->  
# Slide de Sección
Para dividir contenido con fondo rosa
```

### Backgrounds Automáticos

El tema CENIA aplica automáticamente diferentes backgrounds:

- **Slides normales**: `cenia-pattern.png` - Patrón sutil
- **Title slides**: `cenia-title.png` - Fondo azul corporativo
- **Section slides**: `cenia-section.png` - Fondo rosa corporativo

## 📂 Estructura del Proyecto (Limpia)

```
cenia-marp-editor/
├── index.html              # Aplicación principal
├── css/
│   ├── app.css             # Estilos de la aplicación
│   ├── cenia-theme.css     # Tema personalizado CENIA
│   └── marp-themes/
│       └── default.css     # Tema default de Marp
├── js/
│   ├── app.js              # Lógica principal (limpia)
│   ├── parser.js           # Parser compatible con Marp
│   └── export.js           # Exportación con backgrounds
├── assets/
│   └── backgrounds/        # Imágenes de fondo CENIA
│       ├── cenia-pattern.png
│       ├── cenia-title.png
│       └── cenia-section.png
└── README.md
```

## 🧹 Cambios en la Limpieza

### Archivos Eliminados
- `js/editor.js` - Archivo vacío
- `js/preview.js` - Archivo vacío
- `js/logo-manager.js` - Sistema de logos no usado
- `css/marp-themes/gaia.css` - Tema no usado
- `css/marp-themes/uncover.css` - Tema no usado
- `templates/` - Carpeta completa (archivos vacíos)

### Funcionalidades Removidas
- Sistema de templates (archivos vacíos)
- Logo management (solo backgrounds)
- Temas gaia/uncover del selector
- Referencias a archivos JS vacíos

### Funcionalidades Mantenidas ✅
- **Todos los backgrounds** y su aplicación automática
- **Export PDF/PPTX** con imágenes de fondo
- **Colores de texto** según tipo de slide
- **Fullscreen** con navegación
- **Auto-save** y file operations
- **Splitter** para redimensionar paneles
- **Shortcuts** de teclado
