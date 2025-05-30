// Exportador CENIA Marp Editor - Solo backgrounds
class MarpExporter {
    constructor() {
        this.defaultCSS = '';
        this.backgroundImages = {
            pattern: null,  // Para slides normales
            title: null,    // Para slides de título  
            section: null   // Para slides de sección
        };
        
        this.loadDefaultCSS();
        this.loadBackgroundImages();
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

    async loadBackgroundImageAsBase64(url) {
        try {
            console.log(`Intentando cargar: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} para ${url}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error(`Error cargando ${url}:`, e);
            return null;
        }
    }

    async loadBackgroundImages() {
        console.log('=== Cargando imágenes de fondo ===');
        
        // Probar diferentes rutas base
        const basePaths = [
            './assets/backgrounds/',
            'assets/backgrounds/',
            '../assets/backgrounds/'
        ];

        for (const basePath of basePaths) {
            console.log(`Probando ruta base: ${basePath}`);
            
            this.backgroundImages.pattern = await this.loadBackgroundImageAsBase64(`${basePath}cenia-pattern.png`);
            this.backgroundImages.title = await this.loadBackgroundImageAsBase64(`${basePath}cenia-title.png`);  
            this.backgroundImages.section = await this.loadBackgroundImageAsBase64(`${basePath}cenia-section.png`);

            // Si al menos una imagen se cargó, usar esta ruta
            if (this.backgroundImages.pattern || this.backgroundImages.title || this.backgroundImages.section) {
                console.log(`✅ Ruta exitosa: ${basePath}`);
                break;
            }
        }

        // Reportar estado
        console.log('Estado de carga:');
        console.log('- Pattern:', this.backgroundImages.pattern ? '✅ OK' : '❌ FAIL');
        console.log('- Title:', this.backgroundImages.title ? '✅ OK' : '❌ FAIL');
        console.log('- Section:', this.backgroundImages.section ? '✅ OK' : '❌ FAIL');
    }

    exportHTML(slides, theme, filename) {
        const html = this.generateHTMLDocument(slides, theme, filename);
        this.downloadFile(html, `${filename}.html`, 'text/html');
    }

    // ============================================
    // EXPORT PDF - Con imágenes de fondo
    // ============================================
    async exportPDF(slides, theme, filename) {
        try {
            this.showLoadingMessage('Generando PDF con backgrounds...');
            
            await this.loadPDFLibraries();
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const slideWidth = 297;
            const slideHeight = 210;
            
            console.log('=== INICIANDO EXPORT PDF ===');
            console.log('Total slides:', slides.length);
            
            for (let i = 0; i < slides.length; i++) {
                if (i > 0) pdf.addPage();
                
                const slide = slides[i];
                const isTitle = slide.classes.includes('title-slide');
                const isSection = slide.classes.includes('section-slide');
                
                console.log(`\nSlide ${i + 1}:`);
                console.log('- Classes:', slide.classes);
                console.log('- isTitle:', isTitle);
                console.log('- isSection:', isSection);
                
                // Aplicar fondo según tipo
                if (theme === 'cenia') {
                    if (isTitle && this.backgroundImages.title) {
                        console.log('→ Aplicando fondo título');
                        pdf.addImage(this.backgroundImages.title, 'PNG', 0, 0, slideWidth, slideHeight);
                    } else if (isSection && this.backgroundImages.section) {
                        console.log('→ Aplicando fondo sección');
                        pdf.addImage(this.backgroundImages.section, 'PNG', 0, 0, slideWidth, slideHeight);
                    } else if (!isTitle && !isSection && this.backgroundImages.pattern) {
                        console.log('→ Aplicando fondo normal');
                        pdf.addImage(this.backgroundImages.pattern, 'PNG', 0, 0, slideWidth, slideHeight);
                    } else {
                        console.log('→ Sin fondo (imagen no disponible)');
                        // Fondo color sólido como fallback
                        if (isTitle) {
                            pdf.setFillColor(0, 32, 96);
                            pdf.rect(0, 0, slideWidth, slideHeight, 'F');
                        } else if (isSection) {
                            pdf.setFillColor(231, 40, 135);
                            pdf.rect(0, 0, slideWidth, slideHeight, 'F');
                        } else {
                            pdf.setFillColor(245, 245, 245);
                            pdf.rect(0, 0, slideWidth, slideHeight, 'F');
                        }
                    }
                }
                
                // Agregar contenido de texto
                this.addPDFTextContent(pdf, slide, isTitle, isSection, slideWidth, slideHeight, i);
                
                this.updateLoadingMessage(`Procesando slide ${i + 1}/${slides.length}...`);
            }
            
            pdf.save(`${filename}.pdf`);
            this.hideLoadingMessage();
            console.log('=== PDF EXPORT COMPLETADO ===');
            
        } catch (e) {
            console.error('PDF export failed:', e);
            this.hideLoadingMessage();
            alert('Error al exportar PDF: ' + e.message);
        }
    }

    addPDFTextContent(pdf, slide, isTitle, isSection, width, height, index) {
        const lines = this.parseMarkdownLines(slide.markdown);
        let yPos = isTitle || isSection ? 80 : 50;
        
        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            const textContent = String(content || '').trim();
            if (!textContent) return;
            
            // Colores según tipo de slide
            let titleColor = isTitle || isSection ? [255, 255, 255] : [231, 40, 135];
            let textColor = isTitle || isSection ? [255, 255, 255] : [51, 51, 51];
            
            switch (type) {
                case 'h1':
                    pdf.setTextColor(...titleColor);
                    pdf.setFontSize(isTitle ? 40 : 28);
                    pdf.setFont('helvetica', 'bold');
                    if (isSection) {
                        pdf.text(textContent, width/2, height/2, { align: 'center', maxWidth: 240 });
                    } else {
                        pdf.text(textContent, 30, yPos, { maxWidth: 240 });
                        yPos += isTitle ? 50 : 30;
                    }
                    break;
                    
                case 'h2':
                    pdf.setTextColor(isTitle ? 231 : 0, isTitle ? 40 : 32, isTitle ? 135 : 96);
                    pdf.setFontSize(isTitle ? 28 : 22);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(textContent, 30, yPos, { maxWidth: 240 });
                    yPos += isTitle ? 35 : 25;
                    break;
                    
                case 'h3':
                    pdf.setTextColor(...titleColor);
                    pdf.setFontSize(18);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(textContent, 30, yPos, { maxWidth: 240 });
                    yPos += 20;
                    break;
                    
                case 'list':
                    pdf.setTextColor(...textColor);
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(textContent, 40, yPos, { maxWidth: 230 });
                    yPos += 15;
                    break;
                    
                case 'text':
                    pdf.setTextColor(...textColor);
                    pdf.setFontSize(isTitle ? 18 : 14);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(textContent, 30, yPos, { maxWidth: 240 });
                    yPos += isTitle ? 25 : 18;
                    break;
            }
            
            if (yPos > 180) return; // Evitar overflow
        });

        // Numeración
        if (slide.directives && slide.directives.paginate && !isTitle && !isSection) {
            pdf.setTextColor(117, 112, 112);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(String(index + 1), 30, 190);
        }
    }

    // ============================================
    // EXPORT PPTX - Con contenido real del markdown
    // ============================================
    async exportPPTX(slides, theme, filename) {
        try {
            this.showLoadingMessage('Generando PowerPoint con contenido real...');
            
            await this.loadPPTXLibrary();
            
            console.log('=== INICIANDO EXPORT PPTX CON MARKDOWN ===');
            console.log('PptxGenJS cargado:', !!window.PptxGenJS);
            console.log('Total slides:', slides.length);
            
            const pres = new PptxGenJS();
            
            // Layout 16:9
            pres.defineLayout({ 
                name: 'CENIA_16x9', 
                width: 13.33, 
                height: 7.5 
            });
            pres.layout = 'CENIA_16x9';
            
            for (let i = 0; i < slides.length; i++) {
                const slideData = slides[i];
                const isTitle = slideData.classes.includes('title-slide');
                const isSection = slideData.classes.includes('section-slide');
                
                console.log(`\nCreando PPT slide ${i + 1}:`);
                console.log('- Classes:', slideData.classes);
                console.log('- isTitle:', isTitle);
                console.log('- isSection:', isSection);
                console.log('- Markdown:', slideData.markdown.substring(0, 100) + '...');
                
                const slide = pres.addSlide();
                
                // Aplicar backgrounds
                if (theme === 'cenia') {
                    if (isTitle && this.backgroundImages.title) {
                        console.log('→ Aplicando fondo título PPT');
                        slide.addImage({
                            data: this.backgroundImages.title,
                            x: 0, y: 0, w: '100%', h: '100%'
                        });
                    } else if (isSection && this.backgroundImages.section) {
                        console.log('→ Aplicando fondo sección PPT');
                        slide.addImage({
                            data: this.backgroundImages.section,
                            x: 0, y: 0, w: '100%', h: '100%'
                        });
                    } else if (!isTitle && !isSection && this.backgroundImages.pattern) {
                        console.log('→ Aplicando fondo normal PPT');
                        slide.addImage({
                            data: this.backgroundImages.pattern,
                            x: 0, y: 0, w: '100%', h: '100%'
                        });
                    } else {
                        console.log('→ Aplicando color de fondo PPT');
                        // Fallback a colores
                        if (isTitle) {
                            slide.background = { fill: '002060' };
                        } else if (isSection) {
                            slide.background = { fill: 'e72887' };
                        } else {
                            slide.background = { fill: 'f5f5f5' };
                        }
                    }
                }
                
                // Agregar contenido real del markdown
                this.addPPTXTextContent(slide, slideData, isTitle, isSection, i);
                
                this.updateLoadingMessage(`Creando slide ${i + 1}/${slides.length}...`);
            }
            
            await pres.writeFile({ fileName: `${filename}.pptx` });
            this.hideLoadingMessage();
            console.log('=== PPTX EXPORT COMPLETADO ===');
            
        } catch (e) {
            console.error('PPTX export failed:', e);
            console.error('Error stack:', e.stack);
            this.hideLoadingMessage();
            alert(`Error al exportar PowerPoint: ${e.message}`);
        }
    }

    // ============================================
    // AGREGAR CONTENIDO MARKDOWN A PPTX
    // ============================================
    addPPTXTextContent(slide, slideData, isTitle, isSection, slideIndex) {
        console.log(`\n--- Procesando contenido slide ${slideIndex + 1} ---`);
        
        const markdown = slideData.markdown;
        console.log('Full markdown:', markdown);
        
        // Detectar si hay tablas
        if (markdown.includes('|') && markdown.includes('---')) {
            this.addPPTXTableContent(slide, slideData, isTitle, isSection, slideIndex);
            return;
        }
        
        // Procesar contenido agrupado por secciones
        const sections = this.groupContentIntoSections(markdown);
        console.log('Sections to process:', sections);
        
        let currentY = isTitle || isSection ? 1.8 : 1.2;
        const leftMargin = isTitle || isSection ? 1.2 : 1.0;
        const maxWidth = 11.0;
        
        sections.forEach((section, sectionIndex) => {
            console.log(`Processing section ${sectionIndex}:`, section);
            
            if (section.type === 'title') {
                // Títulos individuales
                const textOptions = this.getPPTXTextStyle('h1', isTitle, isSection);
                textOptions.x = leftMargin;
                textOptions.y = currentY;
                textOptions.w = maxWidth;
                textOptions.h = 1.0;
                
                if (isSection) {
                    textOptions.x = 0;
                    textOptions.y = 3.2;
                    textOptions.w = 13.33;
                    textOptions.align = 'center';
                    textOptions.valign = 'middle';
                    textOptions.fontSize = 54;
                }
                
                slide.addText(section.content, textOptions);
                currentY += this.getPPTXLineHeight('h1', textOptions.fontSize);
                
            } else if (section.type === 'subtitle') {
                // Subtítulos individuales
                const textOptions = this.getPPTXTextStyle('h2', isTitle, isSection);
                textOptions.x = leftMargin;
                textOptions.y = currentY;
                textOptions.w = maxWidth;
                textOptions.h = 0.8;
                
                slide.addText(section.content, textOptions);
                currentY += this.getPPTXLineHeight('h2', textOptions.fontSize);
                
            } else if (section.type === 'list') {
                // Listas como un solo bloque de texto
                const listText = section.items.map(item => `• ${item}`).join('\n');
                const textOptions = this.getPPTXTextStyle('list', isTitle, isSection);
                textOptions.x = leftMargin + 0.3;
                textOptions.y = currentY;
                textOptions.w = maxWidth - 0.3;
                textOptions.h = section.items.length * 0.4; // Altura proporcional
                
                slide.addText(listText, textOptions);
                currentY += section.items.length * 0.5;
                
            } else if (section.type === 'text') {
                // Párrafos agrupados
                const textOptions = this.getPPTXTextStyle('text', isTitle, isSection);
                textOptions.x = leftMargin;
                textOptions.y = currentY;
                textOptions.w = maxWidth;
                textOptions.h = 0.8;
                
                slide.addText(section.content, textOptions);
                currentY += this.getPPTXLineHeight('text', textOptions.fontSize);
            }
            
            // Evitar overflow
            if (currentY > 6.2) return;
        });
        
        // Agregar numeración si está habilitada
        if (slideData.directives && slideData.directives.paginate && !isTitle && !isSection) {
            slide.addText(String(slideIndex + 1), {
                x: 0.8, y: 6.8, w: 1, h: 0.4,
                fontSize: 14,
                color: '757070',
                fontFace: 'Arial'
            });
        }
    }

    // ============================================
    // AGRUPAR CONTENIDO EN SECCIONES LÓGICAS
    // ============================================
    groupContentIntoSections(markdown) {
        const lines = this.parseMarkdownLines(markdown);
        const sections = [];
        let currentSection = null;
        
        lines.forEach(line => {
            const { type, content } = this.parseLineType(line);
            
            if (type === 'h1') {
                if (currentSection) sections.push(currentSection);
                currentSection = { type: 'title', content: content };
                
            } else if (type === 'h2') {
                if (currentSection) sections.push(currentSection);
                currentSection = { type: 'subtitle', content: content };
                
            } else if (type === 'list') {
                if (!currentSection || currentSection.type !== 'list') {
                    if (currentSection) sections.push(currentSection);
                    currentSection = { type: 'list', items: [] };
                }
                currentSection.items.push(content);
                
            } else if (type === 'text' && content.trim()) {
                if (!currentSection || currentSection.type !== 'text') {
                    if (currentSection) sections.push(currentSection);
                    currentSection = { type: 'text', content: content };
                } else {
                    currentSection.content += '\n' + content;
                }
            }
        });
        
        if (currentSection) sections.push(currentSection);
        return sections;
    }

    // ============================================
    // MANEJAR TABLAS EN PPTX
    // ============================================
    addPPTXTableContent(slide, slideData, isTitle, isSection, slideIndex) {
        console.log('Processing slide with table...');
        
        const lines = slideData.markdown.split('\n');
        let currentY = 1.2;
        const leftMargin = 1.0;
        
        let tableData = [];
        let isInTable = false;
        let headerProcessed = false;
        
        lines.forEach((line, lineIndex) => {
            const trimmed = line.trim();
            
            // Procesar títulos y subtítulos antes de la tabla
            if (trimmed.startsWith('#') && !isInTable) {
                const { type, content } = this.parseLineType(trimmed);
                const textOptions = this.getPPTXTextStyle(type, isTitle, isSection);
                
                textOptions.x = leftMargin;
                textOptions.y = currentY;
                textOptions.w = 11.0;
                textOptions.h = 1.0;
                
                slide.addText(content, textOptions);
                currentY += this.getPPTXLineHeight(type, textOptions.fontSize);
                return;
            }
            
            // Detectar inicio de tabla
            if (trimmed.includes('|') && !trimmed.includes('---')) {
                isInTable = true;
                const cells = trimmed.split('|').map(cell => cell.trim()).filter(cell => cell);
                tableData.push(cells);
                return;
            }
            
            // Saltar línea separadora de tabla
            if (trimmed.includes('---')) {
                headerProcessed = true;
                return;
            }
            
            // Procesar contenido después de la tabla
            if (isInTable && !trimmed.includes('|')) {
                isInTable = false;
                // Renderizar la tabla
                this.renderPPTXTable(slide, tableData, leftMargin, currentY);
                currentY += (tableData.length * 0.5) + 1.0; // Espacio para la tabla
                tableData = []; // Reset
                
                // Procesar línea actual si no está vacía
                if (trimmed) {
                    const { type, content } = this.parseLineType(trimmed);
                    const textOptions = this.getPPTXTextStyle(type, isTitle, isSection);
                    
                    textOptions.x = leftMargin;
                    textOptions.y = currentY;
                    textOptions.w = 11.0;
                    textOptions.h = 0.8;
                    
                    slide.addText(content, textOptions);
                    currentY += this.getPPTXLineHeight(type, textOptions.fontSize);
                }
            }
        });
        
        // Renderizar tabla final si la hay
        if (tableData.length > 0) {
            this.renderPPTXTable(slide, tableData, leftMargin, currentY);
        }
        
        // Numeración
        if (slideData.directives && slideData.directives.paginate && !isTitle && !isSection) {
            slide.addText(String(slideIndex + 1), {
                x: 0.8, y: 6.8, w: 1, h: 0.4,
                fontSize: 14,
                color: '757070',
                fontFace: 'Arial'
            });
        }
    }

    // ============================================
    // RENDERIZAR TABLA EN PPTX
    // ============================================
    renderPPTXTable(slide, tableData, x, y) {
        if (tableData.length === 0) return;
        
        const colCount = Math.max(...tableData.map(row => row.length));
        const tableWidth = 9.0; // Ancho total de la tabla
        const colWidth = tableWidth / colCount;
        const rowHeight = 0.5;
        
        console.log(`Rendering table: ${tableData.length} rows, ${colCount} cols`);
        
        // Crear tabla usando un enfoque más simple - una sola shape para toda la tabla
        const tableRows = [];
        
        tableData.forEach((row, rowIndex) => {
            const tableRow = [];
            row.forEach((cell, colIndex) => {
                tableRow.push({
                    text: cell,
                    options: {
                        fontSize: rowIndex === 0 ? 16 : 14,
                        bold: rowIndex === 0,
                        color: rowIndex === 0 ? 'FFFFFF' : '333333',
                        fill: rowIndex === 0 ? { color: 'e72887' } : 
                              rowIndex % 2 === 1 ? { color: 'f8f9fa' } : { color: 'FFFFFF' },
                        align: 'center',
                        valign: 'middle'
                    }
                });
            });
            tableRows.push(tableRow);
        });
        
        // Usar addTable si está disponible, sino fallback a celdas individuales
        try {
            slide.addTable(tableRows, {
                x: x,
                y: y,
                w: tableWidth,
                colW: Array(colCount).fill(colWidth),
                border: { pt: 1, color: 'e0e0e0' },
                fill: { color: 'FFFFFF' }
            });
        } catch (e) {
            console.log('addTable no disponible, usando celdas individuales');
            // Fallback: celdas individuales
            tableData.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const cellX = x + (colIndex * colWidth);
                    const cellY = y + (rowIndex * rowHeight);
                    const isHeader = rowIndex === 0;
                    
                    slide.addText(cell, {
                        x: cellX,
                        y: cellY,
                        w: colWidth - 0.05,
                        h: rowHeight,
                        fontSize: isHeader ? 16 : 14,
                        bold: isHeader,
                        color: isHeader ? 'FFFFFF' : '333333',
                        fill: isHeader ? 'e72887' : (rowIndex % 2 === 1 ? 'f8f9fa' : 'FFFFFF'),
                        align: 'center',
                        valign: 'middle',
                        fontFace: 'Arial',
                        border: { pt: 1, color: 'e0e0e0' }
                    });
                });
            });
        }
    }

    // ============================================
    // ESTILOS PARA DIFERENTES TIPOS DE CONTENIDO
    // ============================================
    getPPTXTextStyle(type, isTitle, isSection) {
        // Colores según tipo de slide
        const titleColor = isTitle || isSection ? 'FFFFFF' : 'e72887'; // Blanco o rosa CENIA
        const subtitleColor = isTitle ? 'e72887' : '002060'; // Rosa o azul CENIA
        const textColor = isTitle || isSection ? 'FFFFFF' : '333333'; // Blanco o gris oscuro
        
        switch (type) {
            case 'h1':
                return {
                    fontSize: isTitle ? 48 : isSection ? 54 : 36,
                    bold: true,
                    color: titleColor,
                    fontFace: 'Arial'
                };
                
            case 'h2':
                return {
                    fontSize: isTitle ? 36 : 32,
                    bold: true,
                    color: subtitleColor,
                    fontFace: 'Arial'
                };
                
            case 'h3':
                return {
                    fontSize: isTitle ? 28 : 24,
                    bold: true,
                    color: titleColor,
                    fontFace: 'Arial'
                };
                
            case 'list':
                return {
                    fontSize: 20,
                    color: textColor,
                    fontFace: 'Arial',
                    bullet: { 
                        type: 'bullet',
                        style: '•',
                        color: 'e72887' // Rosa CENIA para bullets
                    }
                };
                
            case 'text':
            default:
                return {
                    fontSize: isTitle ? 24 : 18,
                    color: textColor,
                    fontFace: 'Arial'
                };
        }
    }

    // ============================================
    // CALCULAR ALTURA DE LÍNEA PARA ESPACIADO
    // ============================================
    getPPTXLineHeight(type, fontSize) {
        const baseHeight = (fontSize || 18) / 72; // Convertir pt a inches
        
        switch (type) {
            case 'h1':
                return baseHeight * 2.2;
            case 'h2':
                return baseHeight * 2.0;
            case 'h3':
                return baseHeight * 1.8;
            case 'list':
                return baseHeight * 1.6;
            case 'text':
            default:
                return baseHeight * 1.6;
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================
    parseMarkdownLines(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return [];
        }
        return markdown.split('\n').filter(line => line.trim().length > 0);
    }

    parseLineType(line) {
        if (!line || typeof line !== 'string') {
            return { type: 'text', content: '' };
        }
        
        const trimmed = line.trim();
        
        if (trimmed.startsWith('# ')) {
            return { type: 'h1', content: trimmed.substring(2).trim() };
        } else if (trimmed.startsWith('## ')) {
            return { type: 'h2', content: trimmed.substring(3).trim() };
        } else if (trimmed.startsWith('### ')) {
            return { type: 'h3', content: trimmed.substring(4).trim() };
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return { type: 'list', content: trimmed.substring(2).trim() };
        } else if (trimmed.match(/^\d+\. /)) {
            return { type: 'list', content: trimmed.replace(/^\d+\. /, '') };
        } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            return { type: 'text', content: trimmed.slice(2, -2) };
        } else if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
            return { type: 'text', content: trimmed.slice(1, -1) };
        } else if (trimmed.length > 0 && !trimmed.startsWith('<!--') && !trimmed.startsWith('---')) {
            return { type: 'text', content: trimmed };
        } else {
            return { type: 'text', content: '' };
        }
    }

    // ============================================
    // CARGA DE LIBRERÍAS
    // ============================================
    async loadPDFLibraries() {
        if (!window.jspdf) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
    }

    async loadPPTXLibrary() {
        if (!window.PptxGenJS) {
            const urls = [
                'https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.min.js',
                'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.11.0/pptxgen.bundle.min.js'
            ];
            
            for (const url of urls) {
                try {
                    await this.loadScript(url);
                    if (window.PptxGenJS) {
                        console.log(`✅ PptxGenJS cargado desde: ${url}`);
                        break;
                    }
                } catch (e) {
                    console.warn(`❌ Falló carga desde ${url}:`, e);
                }
            }
            
            if (!window.PptxGenJS) {
                throw new Error('No se pudo cargar PptxGenJS desde ninguna URL');
            }
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

    // ============================================
    // UI HELPERS
    // ============================================
    showLoadingMessage(message) {
        this.hideLoadingMessage();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'export-loading';
        loadingDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 2rem 3rem; border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 10000;
            text-align: center; font-family: Arial, sans-serif;
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

    // HTML Export (simple)
    generateHTMLDocument(slides, theme, title) {
        let slidesHtml = '';
        slides.forEach((slide, index) => {
            const slideClasses = `slide ${slide.classes.join(' ')} ${index === 0 ? 'active' : ''}`.trim();
            slidesHtml += `<div class="${slideClasses}" data-theme="${slide.theme}">${slide.html}</div>\n`;
        });

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        .slide { width: 100%; max-width: 800px; margin: 20px auto; padding: 40px; border: 1px solid #ddd; }
        h1 { color: #e72887; }
        h2 { color: #002060; }
    </style>
</head>
<body>
    ${slides.map((slide, i) => `
        <div class="slide">
            <h2>Slide ${i + 1}</h2>
            ${slide.html}
        </div>
    `).join('')}
</body>
</html>`;
    }
}