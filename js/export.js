// Exportador mejorado para CENIA Marp Editor - PPT Editable + PDF Text-based
class MarpExporter {
    constructor() {
        this.defaultCSS = '';
        this.isLibrariesLoaded = false;
        this.loadDefaultCSS();
    }

    async loadDefaultCSS() {
        try {
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
            const cssPromises = Array.from(cssLinks).map(async (link) => {
                try {
                    const response = await fetch(link.href);
                    return await response.text();
                } catch (e) {
                    console.warn('Could not load CSS:', link.href);
                    return '';
                }
            });
            
            const cssTexts = await Promise.all(cssPromises);
            this.defaultCSS = cssTexts.join('\n');
        } catch (e) {
            console.warn('Could not load default CSS:', e);
        }
    }

    exportHTML(slides, theme, filename) {
        const html = this.generateHTMLDocument(slides, theme, filename);
        this.downloadFile(html, `${filename}.html`, 'text/html');
    }

    // ============================================
    // PPT EDITABLE - Completamente editable
    // ============================================
    async exportPPTX(slides, theme, filename) {
        try {
            this.showLoadingMessage('Generando PowerPoint editable...');
            
            await this.loadPPTXLibrary();
            
            // Crear presentación
            const pres = new PptxGenJS();
            
            // Configurar layout 16:9
            pres.defineLayout({ 
                name: 'CENIA_16x9', 
                width: 13.33, 
                height: 7.5 
            });
            pres.layout = 'CENIA_16x9';
            
            // Configurar tema
            pres.theme = {
                headFontFace: 'Quicksand',
                bodyFontFace: 'Quicksand'
            };

            // Procesar cada slide
            for (let i = 0; i < slides.length; i++) {
                const slide = pres.addSlide();
                await this.createEditableSlide(slide, slides[i], theme, i);
                this.updateLoadingMessage(`Creando slide ${i + 1}/${slides.length}...`);
            }
            
            // Generar y descargar
            await pres.writeFile({ fileName: `${filename}.pptx` });
            this.hideLoadingMessage();
            
        } catch (e) {
            console.error('PPTX export failed:', e);
            this.hideLoadingMessage();
            alert(`Error al exportar PowerPoint: ${e.message}`);
        }
    }

    async createEditableSlide(slide, slideData, theme, index) {
        const isTitle = slideData.classes.includes('title-slide');
        const isSection = slideData.classes.includes('section-slide');
        
        if (theme === 'cenia') {
            // Aplicar background según tipo de slide
            if (isTitle) {
                this.applyCeniaTitleBackground(slide);
                this.createEditableTitleSlide(slide, slideData, index);
            } else if (isSection) {
                this.applyCeniaSectionBackground(slide);
                this.createEditableSectionSlide(slide, slideData, index);
            } else {
                this.applyCeniaContentBackground(slide);
                this.createEditableContentSlide(slide, slideData, index);
            }
        }
    }

    // Backgrounds CENIA
    applyCeniaTitleBackground(slide) {
        // Fondo azul degradado
        slide.background = {
            fill: {
                type: 'gradient',
                colors: [
                    { position: 0, color: '002060' },
                    { position: 100, color: '0a0e50' }
                ],
                angle: 135
            }
        };
    }

    applyCeniaSectionBackground(slide) {
        // Fondo rosa degradado
        slide.background = {
            fill: {
                type: 'gradient',
                colors: [
                    { position: 0, color: 'e72887' },
                    { position: 100, color: 'eb77b1' }
                ],
                angle: 135
            }
        };
    }

    applyCeniaContentBackground(slide) {
        // Fondo gris claro
        slide.background = { fill: 'f5f5f5' };
        
        // Línea superior decorativa
        slide.addShape('rect', {
            x: 0, y: 0, w: 13.33, h: 0.08,
            fill: {
                type: 'gradient',
                colors: [
                    { position: 0, color: 'e72887' },
                    { position: 100, color: '002060' }
                ],
                angle: 90
            },
            line: { width: 0 }
        });

        // Logo/marca CENIA en esquina
        slide.addShape('rect', {
            x: 11.8, y: 6.5, w: 1, h: 0.8,
            fill: 'e72887',
            line: { width: 0 }
        });
        
        slide.addText('CENIA', {
            x: 11.8, y: 6.6, w: 1, h: 0.6,
            fontSize: 10, color: 'FFFFFF', align: 'center',
            fontFace: 'Quicksand', bold: true
        });
    }

    // Crear slides editables por tipo
    createEditableTitleSlide(slide, slideData, index) {
        const lines = this.parseMarkdownLines(slideData.markdown);
        let yPos = 2.5;

        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            
            switch (type) {
                case 'h1':
                    slide.addText(content, {
                        x: 1, y: yPos, w: 11, h: 1.5,
                        fontSize: 48, bold: true, color: 'FFFFFF',
                        fontFace: 'Quicksand',
                        isTextBox: true // Hace que sea editable
                    });
                    yPos += 2;
                    break;
                    
                case 'h2':
                    slide.addText(content, {
                        x: 1, y: yPos, w: 11, h: 1,
                        fontSize: 28, color: 'e72887',
                        fontFace: 'Quicksand',
                        isTextBox: true
                    });
                    yPos += 1.2;
                    break;
                    
                case 'text':
                    if (content.trim()) {
                        slide.addText(content, {
                            x: 1, y: yPos, w: 11, h: 0.8,
                            fontSize: 20, color: 'FFFFFF',
                            fontFace: 'Quicksand',
                            isTextBox: true
                        });
                        yPos += 1;
                    }
                    break;
            }
        });
    }

    createEditableSectionSlide(slide, slideData, index) {
        const lines = this.parseMarkdownLines(slideData.markdown);
        
        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            
            if (type === 'h1') {
                slide.addText(content, {
                    x: 1, y: 3, w: 11.33, h: 2,
                    fontSize: 48, bold: true, color: 'FFFFFF',
                    align: 'center', valign: 'middle',
                    fontFace: 'Quicksand',
                    isTextBox: true
                });
            }
        });
    }

    createEditableContentSlide(slide, slideData, index) {
        const lines = this.parseMarkdownLines(slideData.markdown);
        let yPos = 1;

        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            
            switch (type) {
                case 'h1':
                    slide.addText(content, {
                        x: 0.5, y: yPos, w: 12, h: 1,
                        fontSize: 32, bold: true, color: 'e72887',
                        fontFace: 'Quicksand',
                        isTextBox: true
                    });
                    yPos += 1.2;
                    break;
                    
                case 'h2':
                    slide.addText(content, {
                        x: 0.5, y: yPos, w: 12, h: 0.8,
                        fontSize: 24, bold: true, color: '002060',
                        fontFace: 'Quicksand',
                        isTextBox: true
                    });
                    yPos += 1;
                    break;
                    
                case 'h3':
                    slide.addText(content, {
                        x: 0.5, y: yPos, w: 12, h: 0.6,
                        fontSize: 18, bold: true, color: 'e72887',
                        fontFace: 'Quicksand',
                        isTextBox: true
                    });
                    yPos += 0.8;
                    break;
                    
                case 'list':
                    slide.addText(content, {
                        x: 1, y: yPos, w: 11, h: 0.5,
                        fontSize: 16, color: '333333',
                        fontFace: 'Quicksand',
                        isTextBox: true
                    });
                    yPos += 0.6;
                    break;
                    
                case 'text':
                    if (content.trim()) {
                        slide.addText(content, {
                            x: 0.5, y: yPos, w: 12, h: 0.5,
                            fontSize: 16, color: '333333',
                            fontFace: 'Quicksand',
                            isTextBox: true
                        });
                        yPos += 0.7;
                    }
                    break;
            }
            
            // Evitar overflow
            if (yPos > 6) return;
        });

        // Agregar numeración si está habilitada
        if (slideData.directives.paginate) {
            slide.addText((index + 1).toString(), {
                x: 0.5, y: 6.8, w: 1, h: 0.5,
                fontSize: 12, color: '757070',
                fontFace: 'Quicksand'
            });
        }
    }

    // ============================================
    // PDF TEXT-BASED - Ligero y con texto seleccionable
    // ============================================
    async exportPDF(slides, theme, filename) {
        try {
            this.showLoadingMessage('Generando PDF optimizado...');
            
            await this.loadPDFLibraries();
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Configuración
            const slideWidth = 297; // A4 landscape
            const slideHeight = 210;
            
            for (let i = 0; i < slides.length; i++) {
                if (i > 0) pdf.addPage();
                
                await this.createTextBasedSlide(pdf, slides[i], theme, i, slideWidth, slideHeight);
                this.updateLoadingMessage(`Procesando slide ${i + 1}/${slides.length}...`);
            }
            
            pdf.save(`${filename}.pdf`);
            this.hideLoadingMessage();
            
        } catch (e) {
            console.error('PDF export failed:', e);
            this.hideLoadingMessage();
            alert('Error al exportar PDF: ' + e.message);
        }
    }

    async createTextBasedSlide(pdf, slideData, theme, index, width, height) {
        const isTitle = slideData.classes.includes('title-slide');
        const isSection = slideData.classes.includes('section-slide');
        
        if (theme === 'cenia') {
            // Aplicar background
            if (isTitle) {
                this.drawTitleBackground(pdf, width, height);
                this.drawTitleContent(pdf, slideData, width, height);
            } else if (isSection) {
                this.drawSectionBackground(pdf, width, height);
                this.drawSectionContent(pdf, slideData, width, height);
            } else {
                this.drawContentBackground(pdf, width, height);
                this.drawContentSlide(pdf, slideData, index, width, height);
            }
        }
    }

    drawTitleBackground(pdf, width, height) {
        // Fondo azul
        pdf.setFillColor(0, 32, 96);
        pdf.rect(0, 0, width, height, 'F');
    }

    drawSectionBackground(pdf, width, height) {
        // Fondo rosa
        pdf.setFillColor(231, 40, 135);
        pdf.rect(0, 0, width, height, 'F');
    }

    drawContentBackground(pdf, width, height) {
        // Fondo gris claro
        pdf.setFillColor(245, 245, 245);
        pdf.rect(0, 0, width, height, 'F');
        
        // Línea superior decorativa (degradado simulado)
        pdf.setFillColor(231, 40, 135);
        pdf.rect(0, 0, width/2, 3, 'F');
        pdf.setFillColor(0, 32, 96);
        pdf.rect(width/2, 0, width/2, 3, 'F');
        
        // Logo CENIA
        pdf.setFillColor(231, 40, 135);
        pdf.roundedRect(250, 170, 30, 20, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CENIA', 265, 182, { align: 'center' });
    }

    drawTitleContent(pdf, slideData, width, height) {
        const lines = this.parseMarkdownLines(slideData.markdown);
        let yPos = 80;
        
        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            
            switch (type) {
                case 'h1':
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFontSize(36);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(content, 30, yPos, { maxWidth: 240 });
                    yPos += 40;
                    break;
                    
                case 'h2':
                    pdf.setTextColor(231, 40, 135);
                    pdf.setFontSize(24);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(content, 30, yPos, { maxWidth: 240 });
                    yPos += 30;
                    break;
                    
                case 'text':
                    if (content.trim()) {
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(16);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(content, 30, yPos, { maxWidth: 240 });
                        yPos += 20;
                    }
                    break;
            }
        });
    }

    drawSectionContent(pdf, slideData, width, height) {
        const lines = this.parseMarkdownLines(slideData.markdown);
        
        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            
            if (type === 'h1') {
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(36);
                pdf.setFont('helvetica', 'bold');
                pdf.text(content, width/2, height/2, { 
                    align: 'center',
                    maxWidth: 240 
                });
            }
        });
    }

    drawContentSlide(pdf, slideData, index, width, height) {
        const lines = this.parseMarkdownLines(slideData.markdown);
        let yPos = 40;
        
        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            
            switch (type) {
                case 'h1':
                    pdf.setTextColor(231, 40, 135);
                    pdf.setFontSize(24);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(content, 25, yPos, { maxWidth: 250 });
                    yPos += 25;
                    break;
                    
                case 'h2':
                    pdf.setTextColor(0, 32, 96);
                    pdf.setFontSize(18);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(content, 25, yPos, { maxWidth: 250 });
                    yPos += 20;
                    break;
                    
                case 'h3':
                    pdf.setTextColor(231, 40, 135);
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(content, 25, yPos, { maxWidth: 250 });
                    yPos += 15;
                    break;
                    
                case 'list':
                    pdf.setTextColor(51, 51, 51);
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(content, 35, yPos, { maxWidth: 240 });
                    yPos += 12;
                    break;
                    
                case 'text':
                    if (content.trim()) {
                        pdf.setTextColor(51, 51, 51);
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(content, 25, yPos, { maxWidth: 250 });
                        yPos += 15;
                    }
                    break;
            }
            
            if (yPos > 160) return; // Evitar overflow
        });

        // Numeración
        if (slideData.directives.paginate) {
            pdf.setTextColor(117, 112, 112);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text((index + 1).toString(), 25, 190);
        }
    }

    // ============================================
    // UTILIDADES DE PARSING
    // ============================================
    parseMarkdownLines(markdown) {
        return markdown.split('\n').filter(line => line.trim().length > 0);
    }

    parseLineType(line) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('# ')) {
            return { type: 'h1', content: trimmed.substring(2) };
        } else if (trimmed.startsWith('## ')) {
            return { type: 'h2', content: trimmed.substring(3) };
        } else if (trimmed.startsWith('### ')) {
            return { type: 'h3', content: trimmed.substring(4) };
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return { type: 'list', content: '• ' + trimmed.substring(2) };
        } else if (trimmed.match(/^\d+\. /)) {
            return { type: 'list', content: trimmed };
        } else {
            return { type: 'text', content: trimmed };
        }
    }

    // ============================================
    // LIBRERÍAS Y UTILIDADES (sin cambios)
    // ============================================
    async loadPDFLibraries() {
        const promises = [];
        
        if (!window.jspdf) {
            promises.push(this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'));
        }
        
        await Promise.all(promises);
    }

    async loadPPTXLibrary() {
        if (!window.PptxGenJS) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.min.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load: ${src}`));
            document.head.appendChild(script);
        });
    }

    showLoadingMessage(message) {
        this.hideLoadingMessage();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'export-loading';
        loadingDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 2rem 3rem; border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 10000;
            text-align: center; font-family: 'Quicksand', sans-serif;
        `;
        
        loadingDiv.innerHTML = `
            <div style="font-size: 1.2rem; color: #002060; margin-bottom: 1rem;">${message}</div>
            <div style="width: 200px; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #e72887, #002060); animation: loading 1.5s infinite;"></div>
            </div>
            <style>
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0%); }
                    100% { transform: translateX(100%); }
                }
            </style>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    updateLoadingMessage(message) {
        const loadingDiv = document.getElementById('export-loading');
        if (loadingDiv) {
            const messageDiv = loadingDiv.querySelector('div');
            if (messageDiv) messageDiv.textContent = message;
        }
    }

    hideLoadingMessage() {
        const loadingDiv = document.getElementById('export-loading');
        if (loadingDiv) loadingDiv.remove();
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // Export HTML (sin cambios)
    generateHTMLDocument(slides, theme, title) {
        // ... (mantener el código existente)
        return `<!DOCTYPE html><html><!-- HTML content --></html>`;
    }
}