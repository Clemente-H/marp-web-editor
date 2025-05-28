// Exportador mejorado para CENIA Marp Editor
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

    async exportPDF(slides, theme, filename) {
        try {
            // Mostrar loading
            this.showLoadingMessage('Generando PDF...');
            
            // Cargar librerías
            await this.loadPDFLibraries();
            
            // Crear PDF usando jsPDF con html2canvas
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Configuración de slide
            const slideWidth = 297; // A4 landscape width
            const slideHeight = 210; // A4 landscape height
            
            for (let i = 0; i < slides.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Crear elemento temporal del slide
                const slideElement = this.createSlideForPDF(slides[i], theme);
                document.body.appendChild(slideElement);
                
                try {
                    // Capturar slide como imagen
                    const canvas = await html2canvas(slideElement, {
                        width: 1920,
                        height: 1080,
                        scale: 1,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        logging: false
                    });
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    // Agregar al PDF
                    pdf.addImage(imgData, 'JPEG', 0, 0, slideWidth, slideHeight);
                    
                } catch (e) {
                    console.error('Error capturing slide:', i, e);
                } finally {
                    // Limpiar elemento temporal
                    document.body.removeChild(slideElement);
                }
                
                // Mostrar progreso
                this.updateLoadingMessage(`Procesando slide ${i + 1}/${slides.length}...`);
            }
            
            // Guardar PDF
            pdf.save(`${filename}.pdf`);
            this.hideLoadingMessage();
            
        } catch (e) {
            console.error('PDF export failed:', e);
            this.hideLoadingMessage();
            alert('Error al exportar PDF. Verifica que tu navegador soporte html2canvas.');
        }
    }

    async exportPPTX(slides, theme, filename) {
        try {
            this.showLoadingMessage('Generando PowerPoint...');
            
            // Cargar librería PptxGenJS
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
            
            // Configurar tema CENIA
            pres.theme = {
                headFontFace: 'Quicksand',
                bodyFontFace: 'Quicksand'
            };
            
            // Agregar slides
            for (let i = 0; i < slides.length; i++) {
                const slide = pres.addSlide();
                await this.addSlideContentToPPTX(slide, slides[i], theme, i);
                this.updateLoadingMessage(`Procesando slide ${i + 1}/${slides.length}...`);
            }
            
            // Generar y descargar
            await pres.writeFile({ fileName: `${filename}.pptx` });
            this.hideLoadingMessage();
            
        } catch (e) {
            console.error('PPTX export failed:', e);
            this.hideLoadingMessage();
            alert(`Error al exportar PowerPoint: ${e.message}\n\nIntenta exportar como HTML o PDF.`);
        }
    }

    async loadPDFLibraries() {
        const promises = [];
        
        if (!window.html2canvas) {
            promises.push(this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'));
        }

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
            script.onload = () => {
                console.log(`Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    createSlideForPDF(slide, theme) {
        const slideElement = document.createElement('div');
        slideElement.className = `slide ${slide.classes.join(' ')}`;
        slideElement.dataset.theme = theme;
        slideElement.innerHTML = slide.html;
        
        // Aplicar estilos inline para PDF
        slideElement.style.cssText = `
            width: 1920px;
            height: 1080px;
            position: absolute;
            top: -10000px;
            left: -10000px;
            background: #f5f5f5;
            font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #333333;
            padding: 70px 90px 70px 70px;
            box-sizing: border-box;
            overflow: hidden;
            line-height: 1.6;
        `;
        
        // Aplicar estilos específicos de tema
        if (theme === 'cenia') {
            this.applyCeniaPDFStyles(slideElement, slide);
        }
        
        return slideElement;
    }

    applyCeniaPDFStyles(element, slide) {
        // Aplicar estilos del tema CENIA
        const isTitle = slide.classes.includes('title-slide');
        const isSection = slide.classes.includes('section-slide');
        
        if (isTitle) {
            element.style.background = 'linear-gradient(135deg, #e72887 0%, #eb77b1 100%)';
            element.style.color = 'white';
            element.style.display = 'flex';
            element.style.justifyContent = 'center';
            element.style.alignItems = 'center';
            element.style.textAlign = 'center';
        } else {
            // Slide de contenido normal
            element.style.background = '#f5f5f5';
            
            // Agregar línea superior
            const topLine = document.createElement('div');
            topLine.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 6px;
                background: linear-gradient(90deg, #e72887 0%, #002060 100%);
            `;
            element.appendChild(topLine);
            
            // Agregar logo CENIA
            const logo = document.createElement('div');
            logo.style.cssText = `
                position: absolute;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                background: #e72887;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
            `;
            logo.textContent = 'CENIA';
            element.appendChild(logo);
        }
        
        // Estilar elementos de texto
        const h1 = element.querySelector('h1');
        if (h1) {
            if (isTitle) {
                h1.style.cssText = 'color: white; font-size: 4.5rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.1;';
            } else if (isSection) {
                h1.style.cssText = 'color: white; font-size: 4.5rem; font-weight: 700; margin: 0;';
            } else {
                h1.style.cssText = 'color: #e72887; font-size: 3.2rem; font-weight: 600; margin-bottom: 2rem; line-height: 1.2;';
            }
        }
        
        const h2 = element.querySelector('h2');
        if (h2) {
            if (isTitle) {
                h2.style.cssText = 'color: #e72887; font-size: 2.8rem; font-weight: 500; margin-bottom: 2rem;';
            } else {
                h2.style.cssText = 'color: #002060; font-size: 2.4rem; font-weight: 600; margin-bottom: 1.5rem;';
            }
        }
        
        const h3 = element.querySelector('h3');
        if (h3) {
            h3.style.cssText = 'color: #e72887; font-size: 1.8rem; font-weight: 500; margin-bottom: 1rem;';
        }
        
        // Estilar párrafos
        const paragraphs = element.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.cssText = 'font-size: 1.2rem; margin-bottom: 1.5rem; line-height: 1.6;';
        });
        
        // Estilar listas
        const listItems = element.querySelectorAll('li');
        listItems.forEach(li => {
            li.style.cssText = 'margin-bottom: 1rem; font-size: 1.2rem; line-height: 1.5;';
        });
    }

    async addSlideContentToPPTX(slide, slideData, theme, index) {
        const content = slideData.markdown;
        const isTitle = slideData.classes.includes('title-slide');
        const isSection = slideData.classes.includes('section-slide');
        
        // Configurar fondo según tipo de slide
        if (theme === 'cenia') {
            if (isTitle) {
                slide.background = { fill: '002060' };
                this.addCeniaTitleToPPTX(slide, content, index);
            } else if (isSection) {
                slide.background = { fill: 'e72887' };
                this.addCeniaSectionToPPTX(slide, content, index);
            } else {
                slide.background = { fill: 'f5f5f5' };
                this.addCeniaContentToPPTX(slide, content, index);
            }
        }
    }

    addCeniaTitleToPPTX(slide, content, index) {
        const lines = content.split('\n').filter(line => line.trim());
        let yPos = 2;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('# ')) {
                slide.addText(trimmed.substring(2), {
                    x: 1, y: yPos, w: 11, h: 1.5,
                    fontSize: 48, bold: true, color: 'FFFFFF',
                    fontFace: 'Quicksand'
                });
                yPos += 2;
            } else if (trimmed.startsWith('## ') || (trimmed && !trimmed.startsWith('#'))) {
                const text = trimmed.startsWith('## ') ? trimmed.substring(3) : trimmed;
                slide.addText(text, {
                    x: 1, y: yPos, w: 11, h: 1,
                    fontSize: 28, color: 'e72887',
                    fontFace: 'Quicksand'
                });
                yPos += 1.2;
            }
        });
        
        // Agregar área para logo
        slide.addShape('rect', {
            x: 10, y: 0.5, w: 2.5, h: 1.2,
            fill: { transparency: 80, color: 'FFFFFF' },
            line: { color: 'FFFFFF', width: 1, transparency: 60 }
        });
        
        slide.addText('LOGO', {
            x: 10.2, y: 0.7, w: 2.1, h: 0.8,
            fontSize: 12, color: 'FFFFFF', align: 'center',
            fontFace: 'Quicksand'
        });
    }

    addCeniaSectionToPPTX(slide, content, index) {
        const lines = content.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('# ')) {
                slide.addText(trimmed.substring(2), {
                    x: 1, y: 3, w: 11.33, h: 2,
                    fontSize: 48, bold: true, color: 'FFFFFF',
                    align: 'center', valign: 'middle',
                    fontFace: 'Quicksand'
                });
            }
        });
    }

    addCeniaContentToPPTX(slide, content, index) {
        const lines = content.split('\n').filter(line => line.trim());
        let yPos = 1;
        
        // Agregar línea superior decorativa
        slide.addShape('rect', {
            x: 0, y: 0, w: 13.33, h: 0.08,
            fill: { type: 'gradient', colors: [
                { position: 0, color: 'e72887' },
                { position: 100, color: '002060' }
            ]}
        });
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('# ')) {
                slide.addText(trimmed.substring(2), {
                    x: 0.5, y: yPos, w: 12, h: 1,
                    fontSize: 32, bold: true, color: 'e72887',
                    fontFace: 'Quicksand'
                });
                yPos += 1.2;
                
            } else if (trimmed.startsWith('## ')) {
                slide.addText(trimmed.substring(3), {
                    x: 0.5, y: yPos, w: 12, h: 0.8,
                    fontSize: 24, bold: true, color: '002060',
                    fontFace: 'Quicksand'
                });
                yPos += 1;
                
            } else if (trimmed.startsWith('### ')) {
                slide.addText(trimmed.substring(4), {
                    x: 0.5, y: yPos, w: 12, h: 0.6,
                    fontSize: 18, bold: true, color: 'e72887',
                    fontFace: 'Quicksand'
                });
                yPos += 0.8;
                
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                slide.addText('• ' + trimmed.substring(2), {
                    x: 1, y: yPos, w: 11, h: 0.5,
                    fontSize: 16, color: '333333',
                    fontFace: 'Quicksand'
                });
                yPos += 0.6;
                
            } else if (trimmed.match(/^\d+\. /)) {
                slide.addText(trimmed, {
                    x: 1, y: yPos, w: 11, h: 0.5,
                    fontSize: 16, color: '333333',
                    fontFace: 'Quicksand'
                });
                yPos += 0.6;
                
            } else if (trimmed.length > 0 && !trimmed.startsWith('<!--')) {
                slide.addText(trimmed, {
                    x: 0.5, y: yPos, w: 12, h: 0.5,
                    fontSize: 16, color: '333333',
                    fontFace: 'Quicksand'
                });
                yPos += 0.7;
            }
            
            if (yPos > 6) break;
        });
        
        // Agregar logo CENIA en esquina
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
        
        // Agregar numeración si está habilitada
        if (slideData.directives.paginate) {
            slide.addText((index + 1).toString(), {
                x: 0.5, y: 6.8, w: 1, h: 0.5,
                fontSize: 12, color: '757070',
                fontFace: 'Quicksand'
            });
        }
    }

    // UI helpers para mostrar progreso
    showLoadingMessage(message) {
        this.hideLoadingMessage(); // Limpiar mensaje anterior
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'export-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem 3rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            font-family: 'Quicksand', sans-serif;
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
            if (messageDiv) {
                messageDiv.textContent = message;
            }
        }
    }

    hideLoadingMessage() {
        const loadingDiv = document.getElementById('export-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    generateHTMLDocument(slides, theme, title) {
        const css = this.getEmbeddedCSS(theme);
        const slidesHTML = slides.map((slide, index) => {
            const classes = ['slide', ...slide.classes].join(' ');
            return `
                <div class="${classes}" data-theme="${theme}" style="display: ${index === 0 ? 'block' : 'none'};">
                    ${slide.html}
                </div>
            `;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${css}
        
        /* Presentation Container */
        .presentation-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #f8f9fa;
            font-family: 'Quicksand', sans-serif;
        }
        
        .presentation-header {
            background: white;
            padding: 1rem 2rem;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .presentation-header h1 {
            color: #002060;
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .presentation-info {
            color: #757070;
            font-size: 0.9rem;
        }
        
        .presentation-content {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            overflow: hidden;
        }
        
        .slides-container {
            position: relative;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        
        .slide {
            width: 960px;
            height: 540px;
            padding: 60px;
            overflow: hidden;
            position: relative;
        }
        
        .presentation-controls {
            background: white;
            padding: 1rem 2rem;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
        }
        
        .control-btn {
            padding: 0.75rem 1.5rem;
            border: 2px solid #e72887;
            background: white;
            color: #e72887;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            font-family: 'Quicksand', sans-serif;
            transition: all 0.3s ease;
        }
        
        .control-btn:hover:not(:disabled) {
            background: #e72887;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(231,40,135,0.3);
        }
        
        .control-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .slide-counter {
            display: flex;
            align-items: center;
            font-size: 1rem;
            color: #002060;
            font-weight: 600;
            background: #f5f5f5;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
        }
        
        /* Fullscreen */
        .fullscreen-slide {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .fullscreen-slide .slide {
            max-width: 95vw;
            max-height: 95vh;
            transform: scale(1);
        }
        
        /* Print styles */
        @media print {
            .presentation-header,
            .presentation-controls {
                display: none !important;
            }
            
            .presentation-content {
                padding: 0;
                height: auto;
            }
            
            .slide {
                width: 100%;
                height: 100vh;
                page-break-after: always;
                display: block !important;
                box-shadow: none;
            }
            
            .slide:last-child {
                page-break-after: avoid;
            }
        }
        
        /* Responsive */
        @media (max-width: 1200px) {
            .slide {
                width: 80vw;
                height: 45vw;
                padding: 40px;
            }
        }
        
        @media (max-width: 768px) {
            .presentation-header {
                flex-direction: column;
                gap: 0.5rem;
                text-align: center;
            }
            
            .presentation-controls {
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .slide {
                width: 95vw;
                height: 53vw;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        <header class="presentation-header">
            <h1>${title}</h1>
            <div class="presentation-info">
                <span>CENIA Marp Editor</span>
            </div>
        </header>
        
        <main class="presentation-content">
            <div class="slides-container">
                ${slidesHTML}
            </div>
        </main>
        
        <footer class="presentation-controls">
            <button class="control-btn" onclick="previousSlide()">◀ Anterior</button>
            <button class="control-btn" onclick="toggleFullscreen()">⛶ Pantalla Completa</button>
            <div class="slide-counter">
                <span id="current-slide">1</span> / <span id="total-slides">${slides.length}</span>
            </div>
            <button class="control-btn" onclick="nextSlide()">Siguiente ▶</button>
            <button class="control-btn" onclick="window.print()">🖨️ Imprimir</button>
        </footer>
    </div>
    
    <script>
        let currentSlide = 0;
        const totalSlides = ${slides.length};
        
        function showSlide(index) {
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => slide.style.display = 'none');
            
            if (slides[index]) {
                slides[index].style.display = 'block';
                currentSlide = index;
                document.getElementById('current-slide').textContent = index + 1;
            }
            
            updateButtonStates();
        }
        
        function updateButtonStates() {
            const buttons = document.querySelectorAll('.control-btn');
            buttons[0].disabled = currentSlide === 0; // Previous
            buttons[3].disabled = currentSlide === totalSlides - 1; // Next
        }
        
        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                showSlide(currentSlide + 1);
            }
        }
        
        function previousSlide() {
            if (currentSlide > 0) {
                showSlide(currentSlide - 1);
            }
        }
        
        function toggleFullscreen() {
            const container = document.querySelector('.slides-container');
            
            if (!document.fullscreenElement) {
                container.requestFullscreen();
                container.classList.add('fullscreen-slide');
            } else {
                document.exitFullscreen();
                container.classList.remove('fullscreen-slide');
            }
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'PageUp':
                    previousSlide();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case 'PageDown':
                case ' ':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'Home':
                    showSlide(0);
                    break;
                case 'End':
                    showSlide(totalSlides - 1);
                    break;
                case 'f':
                case 'F11':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'Escape':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    break;
            }
        });
        
        // Touch support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide(); // Swipe left = next
                } else {
                    previousSlide(); // Swipe right = previous
                }
            }
        }
        
        // Initialize
        document.getElementById('total-slides').textContent = totalSlides;
        showSlide(0);
    </script>
</body>
</html>`;
    }

    getEmbeddedCSS(theme) {
        return `
        /* Base styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #333; 
        }
        
        /* CENIA Theme Embedded */
        .slide[data-theme="cenia"] {
            --cenia-primary: #e72887;
            --cenia-secondary: #002060;
            --cenia-light-bg: #f5f5f5;
            --cenia-text: #333333;
            --cenia-gray: #757070;
            
            background: var(--cenia-light-bg);
            color: var(--cenia-text);
            position: relative;
            font-family: 'Quicksand', sans-serif;
        }
        
        .slide[data-theme="cenia"]:not(.title-slide):not(.section-slide)::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 6px;
            background: linear-gradient(90deg, var(--cenia-primary) 0%, var(--cenia-secondary) 100%);
        }
        
        .slide[data-theme="cenia"]:not(.title-slide):not(.section-slide)::after {
            content: "";
            position: absolute;
            bottom: 30px; right: 30px;
            width: 60px; height: 60px;
            background: var(--cenia-primary);
            border-radius: 12px;
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><g fill="white"><circle cx="12" cy="15" r="3"/><circle cx="30" cy="10" r="3"/><circle cx="48" cy="18" r="3"/><circle cx="15" cy="35" r="3"/><circle cx="35" cy="40" r="3"/><circle cx="45" cy="50" r="3"/><line x1="12" y1="15" x2="30" y2="10" stroke="white" stroke-width="1.5"/><line x1="30" y1="10" x2="48" y2="18" stroke="white" stroke-width="1.5"/><line x1="12" y1="15" x2="15" y2="35" stroke="white" stroke-width="1.5"/><line x1="15" y1="35" x2="35" y2="40" stroke="white" stroke-width="1.5"/><line x1="35" y1="40" x2="45" y2="50" stroke="white" stroke-width="1.5"/><line x1="48" y1="18" x2="35" y2="40" stroke="white" stroke-width="1.5"/></g></svg>');
            background-size: 36px 36px;
            background-repeat: no-repeat;
            background-position: center;
        }
        
        .slide[data-theme="cenia"].title-slide {
            background: linear-gradient(135deg, var(--cenia-secondary) 0%, #0a0e50 100%);
            color: white;
            display: flex; flex-direction: column;
            justify-content: center; align-items: flex-start;
            text-align: left;
        }
        
        .slide[data-theme="cenia"].section-slide {
            background: linear-gradient(135deg, var(--cenia-primary) 0%, #eb77b1 100%);
            color: white;
            display: flex; justify-content: center; align-items: center;
            text-align: center;
        }
        
        .slide[data-theme="cenia"] h1 {
            color: var(--cenia-primary);
            font-size: 3.2rem; font-weight: 600;
            margin-bottom: 2rem; line-height: 1.2;
        }
        
        .slide[data-theme="cenia"].title-slide h1,
        .slide[data-theme="cenia"].section-slide h1 {
            color: white;
            font-size: 4.5rem; font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slide[data-theme="cenia"].title-slide h2 {
            color: var(--cenia-primary);
            font-size: 2.8rem; font-weight: 500;
        }
        
        .slide[data-theme="cenia"] h2 {
            color: var(--cenia-secondary);
            font-size: 2.4rem; font-weight: 600;
            margin-bottom: 1.5rem;
        }
        
        .slide[data-theme="cenia"] h3 {
            color: var(--cenia-primary);
            font-size: 1.8rem; font-weight: 500;
            margin-bottom: 1rem;
        }
        
        .slide[data-theme="cenia"] p {
            font-size: 1.2rem; margin-bottom: 1.5rem;
            line-height: 1.6;
        }
        
        .slide[data-theme="cenia"] li {
            font-size: 1.2rem; margin-bottom: 1rem;
            position: relative; padding-left: 2rem;
            line-height: 1.5;
        }
        
        .slide[data-theme="cenia"] ul > li::before {
            content: ""; position: absolute;
            left: 0; top: 0.6rem;
            width: 8px; height: 8px;
            background: var(--cenia-primary);
            border-radius: 50%;
            transform: translateY(-50%);
        }
        
        .slide[data-theme="cenia"] strong {
            color: var(--cenia-secondary);
            font-weight: 700;
        }
        
        .slide[data-theme="cenia"] em {
            color: var(--cenia-primary);
        }
        
        .slide[data-theme="cenia"] .pagination {
            position: absolute;
            bottom: 40px; left: 70px;
            font-size: 1rem; color: var(--cenia-gray);
            background: rgba(255,255,255,0.9);
            padding: 0.5rem 1rem;
            border-radius: 20px;
        }
        `;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}