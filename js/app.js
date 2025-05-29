// CENIA Marp Editor - Main Application Logic
class CeniaMarpEditor {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.zoomLevel = 100;
        this.currentTheme = 'cenia';
        this.isUnsaved = false;
        this.filename = 'Presentación Sin Título';
        this.isFullscreen = false; // Track fullscreen state
        
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
            // Handle fullscreen shortcuts globally
            if (e.key === 'Escape' && this.isFullscreen) {
                e.preventDefault();
                this.exitFullscreen();
                return;
            }

            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
                return;
            }

            // Handle navigation in fullscreen
            if (this.isFullscreen) {
                this.handleFullscreenNavigation(e);
                return;
            }

            // Ctrl/Cmd + shortcuts (only when not in fullscreen)
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

            // Navigation shortcuts (only when not focused on editor)
            if (e.target !== this.editor && !this.isFullscreen) {
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

            // Escape to close modals (only when not in fullscreen)
            if (e.key === 'Escape') {
                this.hideTemplateModal();
                this.hideHelpModal();
            }
        });
    }

    handleFullscreenNavigation(e) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSlide();
                this.updateFullscreenSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                this.updateFullscreenSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                this.updateFullscreenSlide();
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.slides.length - 1);
                this.updateFullscreenSlide();
                break;
        }
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
        
        // Update fullscreen if active
        if (this.isFullscreen) {
            this.updateFullscreenSlide();
        }
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
    // FULLSCREEN FUNCTIONALITY - COMPLETAMENTE REDISEÑADO
    // ============================================
    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    enterFullscreen() {
        console.log('🎯 Entrando en fullscreen...');
        
        // First, request fullscreen
        const docElement = document.documentElement;
        if (docElement.requestFullscreen) {
            docElement.requestFullscreen();
        } else if (docElement.webkitRequestFullscreen) {
            docElement.webkitRequestFullscreen();
        } else if (docElement.msRequestFullscreen) {
            docElement.msRequestFullscreen();
        }

        // Create fullscreen overlay immediately
        this.createFullscreenOverlay();
        this.isFullscreen = true;
        
        console.log('✅ Fullscreen activado');
    }

    exitFullscreen() {
        console.log('🎯 Saliendo de fullscreen...');
        
        this.isFullscreen = false;
        this.removeFullscreenOverlay();
        
        // Exit browser fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        console.log('✅ Fullscreen desactivado');
    }

    handleFullscreenChange() {
        const isInBrowserFullscreen = !!(document.fullscreenElement || 
                                        document.webkitFullscreenElement || 
                                        document.msFullscreenElement);
        
        console.log('📱 Fullscreen change detected:', isInBrowserFullscreen);
        
        // If browser exited fullscreen but we think we're still in fullscreen
        if (!isInBrowserFullscreen && this.isFullscreen) {
            console.log('🔄 Browser salió de fullscreen, limpiando...');
            this.isFullscreen = false;
            this.removeFullscreenOverlay();
        }
    }

    createFullscreenOverlay() {
        console.log('🎨 Creando overlay fullscreen...');
        
        // Remove existing overlay if any
        this.removeFullscreenOverlay();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'fullscreen-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        `;

        // Create slide container
        const slideContainer = document.createElement('div');
        slideContainer.id = 'fullscreen-slide';
        slideContainer.style.cssText = `
            width: 960px;
            height: 540px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(255,255,255,0.2);
            transform-origin: center center;
        `;

        // Calculate scale to fit screen
        const scale = Math.min(
            (window.innerWidth * 0.9) / 960,
            (window.innerHeight * 0.85) / 540
        );
        slideContainer.style.transform = `scale(${Math.min(scale, 2)})`;

        // Add current slide content
        this.updateFullscreenSlideContent(slideContainer);

        // Create controls
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 20px;
            background: rgba(0,0,0,0.7);
            padding: 15px 25px;
            border-radius: 25px;
            color: white;
            font-family: Arial, sans-serif;
        `;

        controls.innerHTML = `
            <button id="fs-prev" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 5px 10px;">◀</button>
            <span id="fs-counter" style="font-size: 16px; min-width: 80px; text-align: center;">${this.currentSlide + 1} / ${this.slides.length}</span>
            <button id="fs-next" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 5px 10px;">▶</button>
            <span style="font-size: 14px; opacity: 0.7; margin-left: 20px;">ESC para salir | ← → para navegar</span>
        `;

        // Add controls event listeners
        controls.querySelector('#fs-prev').addEventListener('click', () => {
            this.previousSlide();
            this.updateFullscreenSlide();
        });
        
        controls.querySelector('#fs-next').addEventListener('click', () => {
            this.nextSlide();
            this.updateFullscreenSlide();
        });

        // Assemble overlay
        overlay.appendChild(slideContainer);
        overlay.appendChild(controls);

        // Add click to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.exitFullscreen();
            }
        });

        document.body.appendChild(overlay);
        console.log('✅ Overlay creado y añadido');
    }

    removeFullscreenOverlay() {
        const overlay = document.getElementById('fullscreen-overlay');
        if (overlay) {
            overlay.remove();
            console.log('🗑️ Overlay removido');
        }
    }

    updateFullscreenSlideContent(container) {
        if (!container) {
            container = document.querySelector('#fullscreen-slide');
        }
        
        if (!container) return;

        const activeSlide = this.slidesContainer.querySelector('.slide.active');
        if (activeSlide) {
            container.innerHTML = activeSlide.innerHTML;
            container.className = activeSlide.className;
            container.dataset.theme = activeSlide.dataset.theme;
            
            // Apply theme styles
            if (this.currentTheme) {
                container.setAttribute('data-theme', this.currentTheme);
            }
            
            console.log(`📄 Slide ${this.currentSlide + 1} actualizado en fullscreen`);
        }
    }

    updateFullscreenSlide() {
        if (!this.isFullscreen) return;
        
        this.updateFullscreenSlideContent();
        
        // Update counter
        const counter = document.querySelector('#fs-counter');
        if (counter) {
            counter.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
        }
        
        // Update button states
        const prevBtn = document.querySelector('#fs-prev');
        const nextBtn = document.querySelector('#fs-next');
        if (prevBtn) prevBtn.disabled = this.currentSlide === 0;
        if (nextBtn) nextBtn.disabled = this.currentSlide >= this.slides.length - 1;
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