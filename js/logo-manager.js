// Sistema de integración de logos para CENIA Marp Editor
class CeniaLogoManager {
    constructor() {
        this.logos = {
            cenia: null,      // Logo principal CENIA
            mascot: null,     // Mascota CENIA (personaje rosa)
            network: null     // Ícono de red/conexiones
        };
        this.initialized = false;
    }

    // Inicializar el sistema de logos
    async init() {
        // Crear área de carga de logos en la interfaz
        this.createLogoUploadInterface();
        
        // Cargar logos desde localStorage si existen
        this.loadLogosFromStorage();
        
        this.initialized = true;
    }

    createLogoUploadInterface() {
        // Crear modal para gestión de logos
        const logoModal = document.createElement('div');
        logoModal.id = 'logo-manager-modal';
        logoModal.className = 'modal hidden';
        logoModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Gestión de Logos CENIA</h3>
                    <button id="close-logo-modal">✕</button>
                </div>
                <div class="modal-body">
                    <div class="logo-upload-grid">
                        <div class="logo-upload-item">
                            <h4>Logo Principal CENIA</h4>
                            <div class="logo-preview" id="cenia-logo-preview">
                                <span>Arrastra imagen aquí o haz clic</span>
                            </div>
                            <input type="file" id="cenia-logo-input" accept="image/*" style="display: none;">
                            <button onclick="document.getElementById('cenia-logo-input').click()">
                                Subir Logo Principal
                            </button>
                        </div>
                        
                        <div class="logo-upload-item">
                            <h4>Mascota CENIA</h4>
                            <div class="logo-preview" id="mascot-logo-preview">
                                <span>Arrastra imagen aquí o haz clic</span>
                            </div>
                            <input type="file" id="mascot-logo-input" accept="image/*" style="display: none;">
                            <button onclick="document.getElementById('mascot-logo-input').click()">
                                Subir Mascota
                            </button>
                        </div>
                        
                        <div class="logo-upload-item">
                            <h4>Ícono de Red/AI</h4>
                            <div class="logo-preview" id="network-logo-preview">
                                <span>Arrastra imagen aquí o haz clic</span>
                            </div>
                            <input type="file" id="network-logo-input" accept="image/*" style="display: none;">
                            <button onclick="document.getElementById('network-logo-input').click()">
                                Subir Ícono Red
                            </button>
                        </div>
                    </div>
                    
                    <div class="logo-actions">
                        <button id="reset-logos" class="btn-secondary">Resetear Logos</button>
                        <button id="save-logos" class="btn-primary">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(logoModal);

        // Agregar estilos CSS para el modal de logos
        this.addLogoModalStyles();

        // Configurar event listeners
        this.setupLogoEventListeners();

        // Agregar botón de gestión de logos a la toolbar
        this.addLogoManagerButton();
    }

    addLogoModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .logo-upload-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .logo-upload-item {
                text-align: center;
            }
            
            .logo-upload-item h4 {
                margin-bottom: 1rem;
                color: #002060;
                font-size: 1.1rem;
            }
            
            .logo-preview {
                width: 150px;
                height: 150px;
                border: 2px dashed #e72887;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #f8f9fa;
            }
            
            .logo-preview:hover {
                border-color: #002060;
                background: #f0f7ff;
            }
            
            .logo-preview img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: 8px;
            }
            
            .logo-preview span {
                color: #757070;
                font-size: 0.9rem;
                text-align: center;
                padding: 1rem;
            }
            
            .logo-upload-item button {
                padding: 0.5rem 1rem;
                border: 1px solid #e72887;
                background: white;
                color: #e72887;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s;
            }
            
            .logo-upload-item button:hover {
                background: #e72887;
                color: white;
            }
            
            .logo-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 1rem;
                border-top: 1px solid #e0e0e0;
            }
            
            .btn-primary {
                background: #e72887;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            }
            
            .btn-secondary {
                background: transparent;
                color: #757070;
                border: 1px solid #e0e0e0;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    setupLogoEventListeners() {
        // Close modal
        document.getElementById('close-logo-modal').addEventListener('click', () => {
            this.hideLogoModal();
        });

        // File inputs
        ['cenia', 'mascot', 'network'].forEach(type => {
            const input = document.getElementById(`${type}-logo-input`);
            const preview = document.getElementById(`${type}-logo-preview`);
            
            input.addEventListener('change', (e) => {
                this.handleLogoUpload(e, type);
            });
            
            // Drag and drop
            preview.addEventListener('dragover', (e) => {
                e.preventDefault();
                preview.style.borderColor = '#002060';
            });
            
            preview.addEventListener('dragleave', (e) => {
                e.preventDefault();
                preview.style.borderColor = '#e72887';
            });
            
            preview.addEventListener('drop', (e) => {
                e.preventDefault();
                preview.style.borderColor = '#e72887';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.processLogoFile(files[0], type);
                }
            });
            
            preview.addEventListener('click', () => {
                input.click();
            });
        });

        // Action buttons
        document.getElementById('reset-logos').addEventListener('click', () => {
            this.resetLogos();
        });

        document.getElementById('save-logos').addEventListener('click', () => {
            this.saveLogos();
        });
    }

    addLogoManagerButton() {
        const toolbar = document.querySelector('.header-right .toolbar');
        if (toolbar) {
            const logoBtn = document.createElement('button');
            logoBtn.id = 'logo-manager-btn';
            logoBtn.title = 'Gestionar Logos CENIA';
            logoBtn.innerHTML = `
                <span class="btn-icon">🎨</span>
                <span class="btn-text">Logos</span>
            `;
            
            logoBtn.addEventListener('click', () => {
                this.showLogoModal();
            });
            
            // Insertar antes del botón de ayuda
            const helpBtn = document.getElementById('help-btn');
            toolbar.insertBefore(logoBtn, helpBtn);
        }
    }

    showLogoModal() {
        const modal = document.getElementById('logo-manager-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateLogoPreviews();
        }
    }

    hideLogoModal() {
        const modal = document.getElementById('logo-manager-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    handleLogoUpload(event, type) {
        const file = event.target.files[0];
        if (file) {
            this.processLogoFile(file, type);
        }
    }

    processLogoFile(file, type) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            this.logos[type] = base64;
            this.updateLogoPreview(type, base64);
        };
        reader.readAsDataURL(file);
    }

    updateLogoPreview(type, base64) {
        const preview = document.getElementById(`${type}-logo-preview`);
        if (preview && base64) {
            preview.innerHTML = `<img src="${base64}" alt="${type} logo">`;
        }
    }

    updateLogoPreviews() {
        Object.keys(this.logos).forEach(type => {
            if (this.logos[type]) {
                this.updateLogoPreview(type, this.logos[type]);
            }
        });
    }

    resetLogos() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los logos?')) {
            this.logos = {
                cenia: null,
                mascot: null,
                network: null
            };
            
            // Limpiar previews
            ['cenia', 'mascot', 'network'].forEach(type => {
                const preview = document.getElementById(`${type}-logo-preview`);
                if (preview) {
                    preview.innerHTML = '<span>Arrastra imagen aquí o haz clic</span>';
                }
            });
            
            this.saveLogosToStorage();
            this.updateSlidesWithLogos();
        }
    }

    saveLogos() {
        this.saveLogosToStorage();
        this.updateSlidesWithLogos();
        this.hideLogoModal();
        
        // Mostrar confirmación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            z-index: 10000;
            font-family: 'Quicksand', sans-serif;
        `;
        notification.textContent = 'Logos guardados exitosamente';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveLogosToStorage() {
        localStorage.setItem('cenia-logos', JSON.stringify(this.logos));
    }

    loadLogosFromStorage() {
        const saved = localStorage.getItem('cenia-logos');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.logos = { ...this.logos, ...parsed };
            } catch (e) {
                console.warn('Could not load saved logos:', e);
            }
        }
    }

    // Aplicar logos a los slides
    updateSlidesWithLogos() {
        const slides = document.querySelectorAll('.slide[data-theme="cenia"]');
        
        slides.forEach((slide, index) => {
            this.applyLogosToSlide(slide, index);
        });
    }

    applyLogosToSlide(slide, index) {
        const isTitle = slide.classList.contains('title-slide');
        const isSection = slide.classList.contains('section-slide');
        
        // Limpiar logos anteriores
        const existingLogos = slide.querySelectorAll('.cenia-logo, .cenia-mascot, .cenia-network');
        existingLogos.forEach(logo => logo.remove());
        
        if (isTitle) {
            this.addTitleSlideLogos(slide);
        } else if (isSection) {
            this.addSectionSlideLogos(slide);
        } else {
            this.addContentSlideLogos(slide);
        }
    }

    addTitleSlideLogos(slide) {
        // Logo principal en esquina superior derecha
        if (this.logos.cenia) {
            const logoElement = document.createElement('div');
            logoElement.className = 'cenia-logo';
            logoElement.style.cssText = `
                position: absolute;
                top: 60px;
                right: 60px;
                width: 200px;
                height: 100px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;
            
            const img = document.createElement('img');
            img.src = this.logos.cenia;
            img.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            `;
            
            logoElement.appendChild(img);
            slide.appendChild(logoElement);
        }
    }

    addSectionSlideLogos(slide) {
        // Mascota en esquina para slides de sección
        if (this.logos.mascot) {
            const mascotElement = document.createElement('div');
            mascotElement.className = 'cenia-mascot';
            mascotElement.style.cssText = `
                position: absolute;
                bottom: 60px;
                right: 60px;
                width: 120px;
                height: 120px;
                z-index: 10;
            `;
            
            const img = document.createElement('img');
            img.src = this.logos.mascot;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
            `;
            
            mascotElement.appendChild(img);
            slide.appendChild(mascotElement);
        }
    }

    addContentSlideLogos(slide) {
        // Reemplazar el ícono CSS con la imagen de red si está disponible
        if (this.logos.network) {
            const networkElement = document.createElement('div');
            networkElement.className = 'cenia-network';
            networkElement.style.cssText = `
                position: absolute;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                background: #e72887;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(231,40,135,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 12px;
            `;
            
            const img = document.createElement('img');
            img.src = this.logos.network;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: brightness(0) invert(1); /* Hacer la imagen blanca */
            `;
            
            networkElement.appendChild(img);
            slide.appendChild(networkElement);
        }
        
        // Mascota en slides de contenido (opcional, más pequeña)
        if (this.logos.mascot && !slide.querySelector('.cenia-network')) {
            const mascotElement = document.createElement('div');
            mascotElement.className = 'cenia-mascot';
            mascotElement.style.cssText = `
                position: absolute;
                bottom: 100px;
                right: 70px;
                width: 100px;
                height: 100px;
                z-index: 10;
                opacity: 0.8;
            `;
            
            const img = document.createElement('img');
            img.src = this.logos.mascot;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            `;
            
            mascotElement.appendChild(img);
            slide.appendChild(mascotElement);
        }
    }

    // Método para exportar logos en HTML
    getLogosForExport() {
        return this.logos;
    }

    // Método para aplicar logos en exportación
    applyLogosToExportHTML(html, logos) {
        if (!logos) return html;
        
        // Reemplazar placeholders de logos en el HTML exportado
        let processedHTML = html;
        
        if (logos.cenia) {
            processedHTML = processedHTML.replace(
                /<!-- CENIA_LOGO_PLACEHOLDER -->/g,
                `<img src="${logos.cenia}" alt="Logo CENIA" class="cenia-logo-export">`
            );
        }
        
        if (logos.mascot) {
            processedHTML = processedHTML.replace(
                /<!-- MASCOT_PLACEHOLDER -->/g,
                `<img src="${logos.mascot}" alt="Mascota CENIA" class="cenia-mascot-export">`
            );
        }
        
        if (logos.network) {
            processedHTML = processedHTML.replace(
                /<!-- NETWORK_ICON_PLACEHOLDER -->/g,
                `<img src="${logos.network}" alt="Red CENIA" class="cenia-network-export">`
            );
        }
        
        return processedHTML;
    }

    // Integración con el parser de Marp
    integrateWithParser(parser) {
        const originalConvertToHTML = parser.convertToHTML.bind(parser);
        
        parser.convertToHTML = (slide) => {
            let html = originalConvertToHTML(slide);
            
            // Agregar placeholders para logos durante el parsing
            const isTitle = slide.classes.includes('title-slide');
            const isSection = slide.classes.includes('section-slide');
            
            if (isTitle) {
                html += '<!-- CENIA_LOGO_PLACEHOLDER -->';
            } else if (isSection) {
                html += '<!-- MASCOT_PLACEHOLDER -->';
            } else {
                html += '<!-- NETWORK_ICON_PLACEHOLDER -->';
                html += '<!-- MASCOT_PLACEHOLDER -->';
            }
            
            return html;
        };
    }
}

// Inicializar el gestor de logos cuando se carga la aplicación
document.addEventListener('DOMContentLoaded', () => {
    if (!window.ceniaLogoManager) {
        window.ceniaLogoManager = new CeniaLogoManager();
        
        // Inicializar cuando la app esté lista
        setTimeout(() => {
            window.ceniaLogoManager.init();
            
            // Integrar con el editor existente
            if (window.ceniaMarpEditor) {
                // Actualizar slides cuando cambien
                const originalUpdatePreview = window.ceniaMarpEditor.updatePreview.bind(window.ceniaMarpEditor);
                window.ceniaMarpEditor.updatePreview = function() {
                    originalUpdatePreview();
                    setTimeout(() => {
                        window.ceniaLogoManager.updateSlidesWithLogos();
                    }, 100);
                };
            }
        }, 1000);
    }
});