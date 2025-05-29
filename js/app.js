// CENIA Marp Editor - Main Application Logic
class CeniaMarpEditor {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.zoomLevel = 100;
        this.currentTheme = 'cenia';
        this.isUnsaved = false;
        this.filename = 'Presentación Sin Título';
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.loadFromStorage();
        this.updatePreview();
    }

    setupElements() {
        // Editor elements
        this.editor = document.getElementById('markdown-editor');
        this.slidesContainer = document.getElementById('slides-container');
        this.slideCounter = document.getElementById('slide-counter');
        this.saveStatus = document.getElementById('save-status');
        this.filenameSpan = document.getElementById('filename');
        this.themeSelect = document.getElementById('theme-select');
        this.zoomLevelSpan = document.getElementById('zoom-level');

        // Buttons
        this.newBtn = document.getElementById('new-btn');
        this.openBtn = document.getElementById('open-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.exportHtmlBtn = document.getElementById('export-html-btn');
        this.exportPdfBtn = document.getElementById('export-pdf-btn');
        this.exportPptxBtn = document.getElementById('export-pptx-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.templateBtn = document.getElementById('template-btn');
        this.helpBtn = document.getElementById('help-btn');

        // Navigation
        this.prevSlideBtn = document.getElementById('prev-slide-btn');
        this.nextSlideBtn = document.getElementById('next-slide-btn');
        this.zoomInBtn = document.getElementById('zoom-in-btn');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.fitBtn = document.getElementById('fit-btn');

        // Modals
        this.templateModal = document.getElementById('template-modal');
        this.helpModal = document.getElementById('help-modal');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.closeHelpBtn = document.getElementById('close-help-btn');

        // File input
        this.fileInput = document.getElementById('file-input');

        // Splitter
        this.splitter = document.getElementById('splitter');
        this.editorPanel = document.querySelector('.editor-panel');
        this.previewPanel = document.querySelector('.preview-panel');
    }

    setupEventListeners() {
        // Editor events
        this.editor.addEventListener('input', () => {
            this.markUnsaved();
            this.debounceUpdatePreview();
        });

        // Theme selection
        this.themeSelect.addEventListener('change', (e) => {
            this.currentTheme = e.target.value;
            this.updatePreview();
            this.markUnsaved();
        });

        // Toolbar buttons
        this.newBtn.addEventListener('click', () => this.newPresentation());
        this.openBtn.addEventListener('click', () => this.openFile());
        this.saveBtn.addEventListener('click', () => this.savePresentation());
        this.exportHtmlBtn.addEventListener('click', () => this.exportHTML());
        this.exportPdfBtn.addEventListener('click', () => this.exportPDF());
        this.exportPptxBtn.addEventListener('click', () => this.exportPPTX());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.templateBtn.addEventListener('click', () => this.showTemplateModal());
        this.helpBtn.addEventListener('click', () => this.showHelpModal());

        // Navigation
        this.prevSlideBtn.addEventListener('click', () => this.previousSlide());
        this.nextSlideBtn.addEventListener('click', () => this.nextSlide());
        this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.fitBtn.addEventListener('click', () => this.fitToWindow());

        // Modals
        this.closeModalBtn.addEventListener('click', () => this.hideTemplateModal());
        this.closeHelpBtn.addEventListener('click', () => this.hideHelpModal());
        
        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateType = card.dataset.template;
                this.insertTemplate(templateType);
                this.hideTemplateModal();
            });
        });

        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileOpen(e));

        // Splitter for resizing
        this.setupSplitter();

        // Click outside modals to close
        this.templateModal.addEventListener('click', (e) => {
            if (e.target === this.templateModal) this.hideTemplateModal();
        });
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.hideHelpModal();
        });

        // Fullscreen change detection
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('msfullscreenchange', () => this.handleFullscreenChange());

        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.isUnsaved) {
                this.saveToStorage();
            }
        }, 30000);

        // Save before page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.isUnsaved) {
                e.preventDefault();
                e.returnValue = '';
                this.saveToStorage();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.newPresentation();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openFile();
                        break;
                    case 's':
                        e.preventDefault();
                        this.savePresentation();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportHTML();
                        break;
                }
            }

            // Navigation shortcuts
            if (e.target !== this.editor) {
                switch (e.key) {
                    case 'ArrowLeft':
                        this.previousSlide();
                        break;
                    case 'ArrowRight':
                        this.nextSlide();
                        break;
                    case 'Home':
                        this.goToSlide(0);
                        break;
                    case 'End':
                        this.goToSlide(this.slides.length - 1);
                        break;
                }
            }

            // Fullscreen
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                this.hideTemplateModal();
                this.hideHelpModal();
            }
        });
    }

    setupSplitter() {
        let isResizing = false;

        this.splitter.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const containerWidth = document.querySelector('.main-content').offsetWidth;
            const newEditorWidth = (e.clientX / containerWidth) * 100;
            
            if (newEditorWidth > 20 && newEditorWidth < 80) {
                this.editorPanel.style.width = `${newEditorWidth}%`;
            }
        };

        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }

    // Debounced update preview to avoid too many updates
    debounceUpdatePreview() {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this.updatePreview();
        }, 300);
    }

    updatePreview() {
        const markdown = this.editor.value;
        const parser = new MarpParser();
        this.slides = parser.parse(markdown, this.currentTheme);
        
        this.renderSlides();
        this.updateNavigation();
        this.saveToStorage();
    }

    renderSlides() {
        this.slidesContainer.innerHTML = '';
        
        this.slides.forEach((slide, index) => {
            const slideElement = document.createElement('div');
            slideElement.className = 'slide';
            slideElement.dataset.theme = this.currentTheme;
            slideElement.innerHTML = slide.html;
            
            if (index === this.currentSlide) {
                slideElement.classList.add('active');
            }
            
            this.slidesContainer.appendChild(slideElement);
        });

        this.updateZoom();
    }

    updateNavigation() {
        const total = this.slides.length || 1;
        this.slideCounter.textContent = `${this.currentSlide + 1} / ${total}`;
        
        this.prevSlideBtn.disabled = this.currentSlide === 0;
        this.nextSlideBtn.disabled = this.currentSlide >= this.slides.length - 1;
    }

    updateZoom() {
        const slideElements = this.slidesContainer.querySelectorAll('.slide');
        slideElements.forEach(slide => {
            slide.style.transform = `scale(${this.zoomLevel / 100})`;
            slide.style.transformOrigin = 'top left';
        });
        this.zoomLevelSpan.textContent = `${this.zoomLevel}%`;
    }

    // Navigation methods
    previousSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            // Hide current slide
            const currentSlideEl = this.slidesContainer.querySelector('.slide.active');
            if (currentSlideEl) {
                currentSlideEl.classList.remove('active');
            }

            // Show new slide
            this.currentSlide = index;
            const newSlideEl = this.slidesContainer.children[index];
            if (newSlideEl) {
                newSlideEl.classList.add('active');
            }

            this.updateNavigation();
        }
    }

    // Zoom methods
    zoomIn() {
        if (this.zoomLevel < 200) {
            this.zoomLevel += 10;
            this.updateZoom();
        }
    }

    zoomOut() {
        if (this.zoomLevel > 50) {
            this.zoomLevel -= 10;
            this.updateZoom();
        }
    }

    fitToWindow() {
        this.zoomLevel = 100;
        this.updateZoom();
    }

    // ============================================
    // FULLSCREEN FUNCTIONALITY - LUGAR CORRECTO
    // ============================================
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Entrar en fullscreen
            const previewContainer = document.querySelector('.preview-container');
            if (previewContainer.requestFullscreen) {
                previewContainer.requestFullscreen();
            } else if (previewContainer.webkitRequestFullscreen) {
                previewContainer.webkitRequestFullscreen();
            } else if (previewContainer.msRequestFullscreen) {
                previewContainer.msRequestFullscreen();
            }
            
            // Ajustar estilos para fullscreen
            setTimeout(() => {
                this.adjustFullscreenStyles(true);
            }, 100);
            
        } else {
            // Salir de fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.msFullscreenElement);
        
        console.log('Fullscreen changed:', isFullscreen);
        this.adjustFullscreenStyles(isFullscreen);
    }

    adjustFullscreenStyles(isFullscreen) {
        const slidesContainer = document.getElementById('slides-container');
        const slides = slidesContainer.querySelectorAll('.slide');
        
        if (isFullscreen) {
            // Calcular el zoom apropiado para fullscreen
            const containerWidth = window.innerWidth * 0.9; // 90% del ancho de pantalla
            const containerHeight = window.innerHeight * 0.9; // 90% del alto de pantalla
            const slideWidth = 960; // Ancho original del slide
            const slideHeight = 540; // Alto original del slide
            
            // Calcular escalas para mantener aspecto y que quepa en pantalla
            const scaleX = containerWidth / slideWidth;
            const scaleY = containerHeight / slideHeight;
            const fullscreenScale = Math.min(scaleX, scaleY, 2.0); // Máximo 200%
            
            console.log(`Fullscreen scale calculated: ${fullscreenScale}`);
            
            // Aplicar estilos para fullscreen
            slidesContainer.style.position = 'fixed';
            slidesContainer.style.top = '50%';
            slidesContainer.style.left = '50%';
            slidesContainer.style.transform = 'translate(-50%, -50%)';
            slidesContainer.style.zIndex = '9999';
            slidesContainer.style.background = '#f8f9fa';
            slidesContainer.style.padding = '20px';
            slidesContainer.style.borderRadius = '8px';
            
            slides.forEach(slide => {
                slide.style.transform = `scale(${fullscreenScale})`;
                slide.style.transformOrigin = 'center center';
                slide.style.width = '960px';
                slide.style.height = '540px';
                slide.style.margin = 'auto';
                slide.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
            });
            
        } else {
            // Restaurar estilos normales
            slidesContainer.style.position = '';
            slidesContainer.style.top = '';
            slidesContainer.style.left = '';
            slidesContainer.style.transform = '';
            slidesContainer.style.zIndex = '';
            slidesContainer.style.background = '';
            slidesContainer.style.padding = '';
            slidesContainer.style.borderRadius = '';
            
            slides.forEach(slide => {
                // Restaurar el zoom que tenía antes del fullscreen
                slide.style.transform = `scale(${this.zoomLevel / 100})`;
                slide.style.transformOrigin = 'top left';
                slide.style.width = '960px';
                slide.style.height = '540px';
                slide.style.margin = '';
                slide.style.boxShadow = '';
            });
        }
    }

    // File operations
    newPresentation() {
        if (this.isUnsaved) {
            if (!confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
                return;
            }
        }

        this.editor.value = `---
theme: cenia
paginate: true
---

# Mi Presentación CENIA

Subtitle aquí

---

## Slide 2

- Punto 1
- Punto 2
- Punto 3

---

## Gracias

¿Preguntas?

---`;
        
        this.filename = 'Presentación Sin Título';
        this.filenameSpan.textContent = this.filename;
        this.currentSlide = 0;
        this.markSaved();
        this.updatePreview();
    }

    openFile() {
        this.fileInput.click();
    }

    handleFileOpen(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.editor.value = e.target.result;
            this.filename = file.name.replace(/\.[^/.]+$/, "");
            this.filenameSpan.textContent = this.filename;
            this.currentSlide = 0;
            this.markSaved();
            this.updatePreview();
        };
        reader.readAsText(file);
    }

    savePresentation() {
        const content = this.editor.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.filename}.md`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.markSaved();
    }

    // Export methods
    exportHTML() {
        const exporter = new MarpExporter();
        exporter.exportHTML(this.slides, this.currentTheme, this.filename);
    }

    exportPDF() {
        const exporter = new MarpExporter();
        exporter.exportPDF(this.slides, this.currentTheme, this.filename);
    }

    exportPPTX() {
        const exporter = new MarpExporter();
        exporter.exportPPTX(this.slides, this.currentTheme, this.filename);
    }

    // Template and help modals
    showTemplateModal() {
        this.templateModal.classList.remove('hidden');
    }

    hideTemplateModal() {
        this.templateModal.classList.add('hidden');
    }

    showHelpModal() {
        this.helpModal.classList.remove('hidden');
    }

    hideHelpModal() {
        this.helpModal.classList.add('hidden');
    }

    insertTemplate(templateType) {
        const templates = {
            basic: `---
theme: cenia
paginate: true
---

# Presentación CENIA

Subtítulo de la presentación

**Centro Nacional de Inteligencia Artificial**

---

## Agenda

- Punto 1
- Punto 2  
- Punto 3
- Conclusiones

---

## Contenido Principal

### Subtitle

Contenido de la presentación aquí.

- Item importante
- Otro item
- Conclusión

---

## Gracias

**¿Preguntas?**

*Centro Nacional de Inteligencia Artificial*

---`,
            
            report: `---
theme: cenia
paginate: true
---

# Reporte Técnico

**Centro Nacional de Inteligencia Artificial**
*${new Date().toLocaleDateString()}*

---

## Resumen Ejecutivo

### Objetivos
- Objetivo 1
- Objetivo 2

### Resultados Clave
- Resultado 1
- Resultado 2

---

## Metodología

### Approach
Descripción de la metodología utilizada.

### Herramientas
- Tool 1
- Tool 2
- Tool 3

---

## Resultados

### Findings

Descripción de los hallazgos principales.

### Métricas

| Métrica | Valor | Status |
|---------|-------|--------|
| KPI 1   | 85%   | ✅      |
| KPI 2   | 92%   | ✅      |

---

## Conclusiones y Recomendaciones

### Conclusiones
- Conclusión 1
- Conclusión 2

### Próximos Pasos
- Acción 1
- Acción 2

---`,

            executive: `---
theme: cenia
paginate: true
---

# Presentación Ejecutiva

**Centro Nacional de Inteligencia Artificial**

---

## Situación Actual

### Context
Descripción del contexto actual.

### Challenge
- Desafío principal
- Impacto esperado

---

## Propuesta de Solución

### Approach
Estrategia propuesta para abordar el desafío.

### Benefits
- Beneficio 1
- Beneficio 2
- Beneficio 3

---

## Roadmap

### Fase 1: Preparación
- Milestone 1
- Milestone 2

### Fase 2: Implementación  
- Milestone 3
- Milestone 4

---

## Inversión y ROI

### Recursos Necesarios
- Budget overview
- Team requirements

### Return on Investment
- Expected benefits
- Timeline to value

---

## Próximos Pasos

### Immediate Actions
- Acción inmediata 1
- Acción inmediata 2

### Timeline
**Next 30 days:** Preparación
**Next 90 days:** Launch

---`
        };

        this.editor.value = templates[templateType] || templates.basic;
        this.markUnsaved();
        this.updatePreview();
    }

    // Save state management
    markSaved() {
        this.isUnsaved = false;
        this.saveStatus.textContent = '●';
        this.saveStatus.classList.remove('unsaved');
    }

    markUnsaved() {
        this.isUnsaved = true;
        this.saveStatus.textContent = '●';
        this.saveStatus.classList.add('unsaved');
    }

    // Local storage
    saveToStorage() {
        const state = {
            content: this.editor.value,
            filename: this.filename,
            theme: this.currentTheme,
            currentSlide: this.currentSlide,
            zoomLevel: this.zoomLevel
        };
        localStorage.setItem('cenia-marp-editor', JSON.stringify(state));
        this.markSaved();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('cenia-marp-editor');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.editor.value = state.content || this.editor.value;
                this.filename = state.filename || this.filename;
                this.currentTheme = state.theme || this.currentTheme;
                this.currentSlide = state.currentSlide || 0;
                this.zoomLevel = state.zoomLevel || 100;
                
                this.filenameSpan.textContent = this.filename;
                this.themeSelect.value = this.currentTheme;
                this.markSaved();
            } catch (e) {
                console.warn('Could not load saved state:', e);
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ceniaMarpEditor = new CeniaMarpEditor();
});