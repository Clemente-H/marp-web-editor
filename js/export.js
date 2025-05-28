// Export functionality for CENIA Marp Editor
class MarpExporter {
    constructor() {
        this.defaultCSS = '';
        this.loadDefaultCSS();
    }

    async loadDefaultCSS() {
        try {
            // Load CSS from the current page
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
        // For PDF export, we'll use html2canvas and jsPDF
        try {
            // Load libraries if not already loaded
            await this.loadPDFLibraries();
            
            const pdf = new window.jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1920, 1080]
            });

            for (let i = 0; i < slides.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }

                // Create temporary slide element
                const slideElement = this.createSlideElement(slides[i], theme);
                document.body.appendChild(slideElement);

                try {
                    const canvas = await html2canvas(slideElement, {
                        width: 1920,
                        height: 1080,
                        scale: 1,
                        useCORS: true,
                        allowTaint: true
                    });

                    const imgData = canvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
                } catch (e) {
                    console.error('Error capturing slide:', e);
                } finally {
                    document.body.removeChild(slideElement);
                }
            }

            pdf.save(`${filename}.pdf`);
        } catch (e) {
            console.error('PDF export failed:', e);
            alert('Error al exportar PDF. Intenta exportar como HTML.');
        }
    }

    async loadPDFLibraries() {
        // Load html2canvas
        if (!window.html2canvas) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }

        // Load jsPDF
        if (!window.jsPDF) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createSlideElement(slide, theme) {
        const slideElement = document.createElement('div');
        slideElement.className = 'slide';
        slideElement.dataset.theme = theme;
        slideElement.innerHTML = slide.html;
        
        // Apply inline styles for PDF export
        slideElement.style.width = '1920px';
        slideElement.style.height = '1080px';
        slideElement.style.padding = '60px';
        slideElement.style.background = 'white';
        slideElement.style.position = 'absolute';
        slideElement.style.top = '-10000px';
        slideElement.style.left = '-10000px';
        slideElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        
        // Apply theme-specific styles
        if (theme === 'cenia') {
            this.applyCeniaStyles(slideElement);
        }
        
        return slideElement;
    }

    applyCeniaStyles(element) {
        // Apply CENIA theme styles inline for PDF export
        const style = `
            color: #333333;
            background-image: linear-gradient(135deg, #f0f7ff 0%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #f0f7ff 100%);
        `;
        element.style.cssText += style;
        
        // Style headings
        const h1 = element.querySelector('h1');
        if (h1) {
            h1.style.color = '#4a90e2';
            h1.style.fontSize = '3rem';
            h1.style.fontWeight = '700';
            h1.style.borderBottom = '3px solid #e91e63';
            h1.style.paddingBottom = '0.5rem';
        }
        
        const h2 = element.querySelector('h2');
        if (h2) {
            h2.style.color = '#2c5aa0';
            h2.style.fontSize = '2.2rem';
            h2.style.fontWeight = '600';
        }
        
        // Style lists
        const listItems = element.querySelectorAll('li');
        listItems.forEach(li => {
            li.style.marginBottom = '0.5rem';
            li.style.position = 'relative';
            li.style.paddingLeft = '1.5rem';
        });
    }

    generateHTMLDocument(slides, theme, title) {
        const css = this.getEmbeddedCSS(theme);
        const slidesHTML = slides.map((slide, index) => {
            return `
                <div class="slide ${index === 0 ? 'active' : ''}" data-theme="${theme}">
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
    <style>
        ${css}
        
        /* Presentation Controls */
        .presentation-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #f8f9fa;
        }
        
        .presentation-header {
            background: white;
            padding: 1rem;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .presentation-content {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        
        .slide {
            width: 960px;
            height: 540px;
            padding: 60px;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 8px;
            display: none;
            overflow: hidden;
        }
        
        .slide.active {
            display: block;
        }
        
        .presentation-controls {
            background: white;
            padding: 1rem;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: center;
            gap: 1rem;
        }
        
        .control-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #4a90e2;
            background: white;
            color: #4a90e2;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .control-btn:hover {
            background: #4a90e2;
            color: white;
        }
        
        .control-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .slide-counter {
            display: flex;
            align-items: center;
            font-size: 0.9rem;
            color: #666;
        }
        
        /* Fullscreen styles */
        .fullscreen-slide {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .fullscreen-slide .slide {
            max-width: 90vw;
            max-height: 90vh;
            box-shadow: none;
        }
        
        /* Print styles */
        @media print {
            .presentation-header,
            .presentation-controls {
                display: none !important;
            }
            
            .presentation-container {
                height: auto;
            }
            
            .presentation-content {
                padding: 0;
            }
            
            .slide {
                width: 100%;
                height: auto;
                min-height: 100vh;
                box-shadow: none;
                border-radius: 0;
                page-break-after: always;
                display: block !important;
            }
            
            .slide:last-child {
                page-break-after: avoid;
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
        </footer>
    </div>
    
    <script>
        let currentSlide = 0;
        const totalSlides = ${slides.length};
        
        function showSlide(index) {
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => slide.classList.remove('active'));
            
            if (slides[index]) {
                slides[index].classList.add('active');
                currentSlide = index;
                document.getElementById('current-slide').textContent = index + 1;
            }
            
            // Update button states
            const prevBtn = document.querySelector('.control-btn');
            const nextBtn = document.querySelector('.control-btn:last-child');
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === totalSlides - 1;
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
            const currentSlideEl = document.querySelector('.slide.active');
            
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
                    previousSlide();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
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
        
        // Initialize
        document.getElementById('total-slides').textContent = totalSlides;
        showSlide(0);
    </script>
</body>
</html>`;
    }

    getEmbeddedCSS(theme) {
        // Return embedded CSS for the HTML export
        return `
        /* Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        /* CENIA Theme */
        .slide[data-theme="cenia"] {
            --cenia-primary: #4a90e2;
            --cenia-secondary: #e91e63;
            --cenia-dark: #2c5aa0;
            --cenia-light: #f0f7ff;
            --cenia-gray: #666666;
            --cenia-text: #333333;
            
            background: white;
            background-image: 
                linear-gradient(135deg, var(--cenia-light) 0%, transparent 25%),
                linear-gradient(45deg, transparent 75%, var(--cenia-light) 100%);
            color: var(--cenia-text);
            position: relative;
        }
        
        .slide[data-theme="cenia"] h1 {
            color: var(--cenia-primary);
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            line-height: 1.2;
            border-bottom: 3px solid var(--cenia-secondary);
            padding-bottom: 0.5rem;
        }
        
        .slide[data-theme="cenia"] h2 {
            color: var(--cenia-dark);
            font-size: 2.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
            line-height: 1.3;
        }
        
        .slide[data-theme="cenia"] h3 {
            color: var(--cenia-primary);
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 0.8rem;
        }
        
        .slide[data-theme="cenia"] p {
            font-size: 1.2rem;
            margin-bottom: 1rem;
        }
        
        .slide[data-theme="cenia"] ul {
            font-size: 1.2rem;
            margin-bottom: 1rem;
        }
        
        .slide[data-theme="cenia"] li {
            margin-bottom: 0.5rem;
            position: relative;
            padding-left: 1.5rem;
        }
        
        .slide[data-theme="cenia"] ul > li::before {
            content: "▶";
            color: var(--cenia-secondary);
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
        }
        
        .slide[data-theme="cenia"] strong {
            color: var(--cenia-dark);
            font-weight: 700;
        }
        
        .slide[data-theme="cenia"] em {
            color: var(--cenia-secondary);
            font-style: italic;
        }
        
        .slide[data-theme="cenia"]::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--cenia-primary) 0%, var(--cenia-secondary) 100%);
        }
        
        .slide[data-theme="cenia"]::after {
            content: "CENIA";
            position: absolute;
            bottom: 20px;
            right: 60px;
            font-size: 0.9rem;
            color: var(--cenia-gray);
            font-weight: 500;
            opacity: 0.7;
        }
        
        .slide[data-theme="cenia"] .pagination {
            position: absolute;
            bottom: 20px;
            left: 60px;
            font-size: 0.9rem;
            color: var(--cenia-gray);
            opacity: 0.7;
        }
        
        /* Special slide types */
        .slide[data-theme="cenia"].title-slide {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, var(--cenia-primary) 0%, var(--cenia-dark) 100%);
            color: white;
        }
        
        .slide[data-theme="cenia"].title-slide h1 {
            color: white;
            font-size: 4rem;
            border-bottom: 3px solid white;
            margin-bottom: 2rem;
        }
        
        .slide[data-theme="cenia"].title-slide h2 {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.8rem;
            font-weight: 400;
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