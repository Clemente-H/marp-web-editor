# CENIA Marp Web Editor

Un editor web compatible con Marp diseñado específicamente para el equipo de CENIA (Centro Nacional de Inteligencia Artificial).

## 🚀 Características

- ✅ **Editor Markdown** con sintaxis highlighting
- ✅ **Preview en tiempo real** de las diapositivas
- ✅ **Compatible con Marp** - misma sintaxis y directivas
- ✅ **Tema CENIA** personalizado con branding corporativo
- ✅ **Export HTML/PDF** para compartir presentaciones
- ✅ **Templates predefinidos** para diferentes tipos de presentación
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
<!-- backgroundColor: #f0f0f0 -->
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

- **Colores corporativos**: Azul CENIA (#4a90e2) y rosa (#e91e63)
- **Typography moderna** optimizada para presentaciones
- **Branding automático** con logo CENIA en cada slide
- **Layouts especiales** para slides de título y secciones

### Clases de Slide Especiales

```markdown
<!-- class: title-slide -->
# Slide de Título
Presentación especial con fondo azul

<!-- class: section-slide -->  
# Slide de Sección
Para dividir contenido

<!-- class: center -->
Contenido centrado vertical y horizontalmente
```

## 📂 Estructura del Proyecto

```
cenia-marp-editor/
├── index.html              # Aplicación principal
├── css/
│   ├── app.css             # Estilos de la aplicación
│   ├── cenia-theme.css     # Tema personalizado CENIA
│   └── marp-themes/
│       ├── default.css     # Tema default de Marp
│       ├── gaia.css        # Tema Gaia
│       └── uncover.css     # Tema Uncover
├── js/
│   ├── app.js              # Lógica principal
│   ├── parser.js           # Parser compatible con Marp
│   ├── export.js           # Funciones de exportación
│   ├── editor.js           # Lógica del editor
│   └── preview.js          # Lógica del preview
├── templates/
│   ├── cenia-basic.md      # Template básico
│   ├── cenia-report.md     # Template para reportes
│   └── cenia-executive.md  # Template ejecutivo
└── README.md
```

## 🚀 Deploy en GitHub Pages

### Opción 1: Fork del Repositorio

1. **Fork** este repositorio
2. Ve a **Settings** > **Pages**
3. Selecciona **Source: Deploy from branch**
4. Selecciona **Branch: main**
5. ¡Listo! Tu editor estará en `https://tu-usuario.github.io/cenia-marp-editor`

### Opción 2: Crear Nuevo Repositorio

1. Crea un nuevo repositorio público en GitHub
2. Clona o descarga estos archivos
3. Súbelos a tu repositorio
4. Activa GitHub Pages en Settings

```bash
git clone https://github.com/tu-usuario/cenia-marp-editor
cd cenia-marp-editor
# Edita los archivos según necesites
git add .
git commit -m "Initial setup"
git push origin main
```

## ⌨️ Shortcuts de Teclado

### En el Editor
- `Ctrl+N` - Nueva presentación
- `Ctrl+O` - Abrir archivo
- `Ctrl+S` - Guardar presentación
- `Ctrl+E` - Exportar HTML

### En el Preview
- `←/→` - Navegar slides
- `Home/End` - Primer/último slide
- `F11` - Pantalla completa
- `Esc` - Salir de pantalla completa

## 📋 Templates Incluidos

### Template Básico
Presentación estándar con branding CENIA

### Template Reporte Técnico
- Resumen ejecutivo
- Metodología
- Resultados con tablas
- Conclusiones y recomendaciones

### Template Ejecutivo
- Situación actual
- Propuesta de solución
- Roadmap
- Inversión y ROI

## 🔧 Personalización

### Agregar Nuevos Temas

1. Crea archivo CSS en `css/marp-themes/`
2. Define estilos con selector `.slide[data-theme="tu-tema"]`
3. Agrega opción en `index.html` en el select de temas

### Modificar Tema CENIA

Edita `css/cenia-theme.css` para cambiar:
- Colores corporativos
- Fonts
- Layouts
- Elementos gráficos

### Agregar Templates

1. Crea archivo `.md` en carpeta `templates/`
2. Agrega entrada en el modal de templates
3. Actualiza lógica en `js/app.js`

## 🐛 Troubleshooting

### El editor no carga
- Verifica que todos los archivos estén en las rutas correctas
- Revisa la consola del navegador para errores
- Asegúrate de que GitHub Pages esté activado

### Las imágenes no se ven
- Las imágenes deben ser accesibles vía HTTPS
- Usa URLs absolutas o rutas relativas correctas
- Para presentaciones offline, usa base64 encoding

### Export PDF no funciona
- Requiere conexión a internet para cargar librerías
- En algunos navegadores puede fallar por CORS
- Alternativa: exportar como HTML y luego imprimir como PDF

### Incompatibilidad con archivos de VSCode
- Verifica que uses las mismas directivas Marp
- Algunos plugins de Marp pueden tener sintaxis extendida no soportada
- Reporta incompatibilidades para mejorar el parser

## 🤝 Contribuir

### Reportar Bugs
1. Verifica que no exista ya un issue similar
2. Incluye pasos para reproducir el error
3. Menciona navegador y versión

### Solicitar Features
1. Describe el caso de uso
2. Explica cómo beneficiaría al equipo
3. Proporciona mockups si es posible

### Pull Requests
1. Fork del repositorio
2. Crea branch para tu feature
3. Testea tus cambios
4. Submit PR con descripción clara

## 📄 Licencia

MIT License - Libre para uso interno de CENIA y modificación según necesidades del equipo.

## 🔮 Roadmap Futuro

### Fase 2: Funcionalidades Avanzadas
- [ ] Export directo a PPTX
- [ ] Integración con GitHub API para save/load
- [ ] Plugin system para extensiones
- [ ] Collaboration en tiempo real

### Fase 3: Mejoras de Productividad
- [ ] Asset management (drag & drop imágenes)
- [ ] Version history
- [ ] Advanced theming system
- [ ] Mobile responsive editing

---

**Desarrollado para el equipo CENIA** 🤖  
*Centro Nacional de Inteligencia Artificial - Chile*