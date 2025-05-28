// Marp-compatible Markdown Parser
class MarpParser {
    constructor() {
        this.slides = [];
        this.globalDirectives = {};
        this.slideDirectives = {};
        
        // Configure marked for better compatibility
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: function(code, lang) {
                    if (typeof hljs !== 'undefined' && hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }
                    return code;
                },
                breaks: true,
                gfm: true
            });
        }
    }

    parse(markdown, theme = 'default') {
        this.slides = [];
        this.globalDirectives = {};
        this.slideDirectives = {};

        // Split into slides using --- separator
        const slideTexts = this.splitIntoSlides(markdown);
        
        // Parse each slide
        slideTexts.forEach((slideText, index) => {
            const slide = this.parseSlide(slideText, index, theme);
            if (slide) {
                this.slides.push(slide);
            }
        });

        return this.slides;
    }

    splitIntoSlides(markdown) {
        // Split by --- that are on their own line
        const slides = markdown.split(/^---\s*$/m);
        
        // Remove empty slides
        return slides.filter(slide => slide.trim().length > 0);
    }

    parseSlide(slideText, index, theme) {
        const slide = {
            index: index,
            markdown: slideText.trim(),
            html: '',
            directives: {},
            classes: [],
            theme: theme
        };

        // Extract frontmatter directives from first slide
        if (index === 0) {
            const { content, directives } = this.extractFrontmatter(slideText);
            slide.markdown = content;
            this.globalDirectives = { ...directives };
            slide.directives = { ...directives };
        } else {
            slide.directives = { ...this.globalDirectives };
        }

        // Extract slide-specific directives (<!-- directive: value -->)
        const { content, directives } = this.extractSlideDirectives(slide.markdown);
        slide.markdown = content;
        slide.directives = { ...slide.directives, ...directives };

        // Apply theme from directives
        if (slide.directives.theme) {
            slide.theme = slide.directives.theme;
        }

        // Determine slide classes based on content and directives
        slide.classes = this.determineSlideClasses(slide);

        // Convert markdown to HTML
        slide.html = this.convertToHTML(slide);

        return slide;
    }

    extractFrontmatter(text) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = text.match(frontmatterRegex);
        
        if (match) {
            const frontmatter = match[1];
            const content = match[2];
            const directives = this.parseFrontmatter(frontmatter);
            return { content, directives };
        }
        
        return { content: text, directives: {} };
    }

    parseFrontmatter(frontmatter) {
        const directives = {};
        const lines = frontmatter.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                
                // Parse boolean values
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                // Parse numeric values
                else if (!isNaN(value) && value !== '') value = Number(value);
                
                directives[key] = value;
            }
        });
        
        return directives;
    }

    extractSlideDirectives(text) {
        const directiveRegex = /<!--\s*(\w+):\s*(.+?)\s*-->/g;
        const directives = {};
        let content = text;
        
        let match;
        while ((match = directiveRegex.exec(text)) !== null) {
            const key = match[1];
            let value = match[2];
            
            // Parse values
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            
            directives[key] = value;
            
            // Remove directive from content
            content = content.replace(match[0], '');
        }
        
        return { content: content.trim(), directives };
    }

    determineSlideClasses(slide) {
        const classes = [];
        const content = slide.markdown.toLowerCase();
        
        // Title slide detection
        const lines = slide.markdown.split('\n').filter(line => line.trim());
        const firstLine = lines[0] || '';
        
        if (firstLine.startsWith('# ') && lines.length <= 4) {
            classes.push('title-slide');
        }
        
        // Section slide detection
        if (slide.directives.class === 'section' || 
            (firstLine.startsWith('# ') && lines.length === 1)) {
            classes.push('section-slide');
        }
        
        // Other slide types based on directives
        if (slide.directives.class) {
            classes.push(slide.directives.class);
        }
        
        return classes;
    }

    convertToHTML(slide) {
        let html = slide.markdown;
        
        // Process Marp-specific directives and features
        html = this.processMarpFeatures(html, slide);
        
        // Convert markdown to HTML using marked
        if (typeof marked !== 'undefined') {
            html = marked.parse(html);
        }
        
        // Post-process HTML for Marp-specific features
        html = this.postProcessHTML(html, slide);
        
        return html;
    }

    processMarpFeatures(markdown, slide) {
        let processed = markdown;
        
        // Process image sizing: ![w:100](image.jpg)
        processed = processed.replace(/!\[([^\]]*?)w:(\d+)([^\]]*?)\]\(([^)]+)\)/g, 
            '<img src="$4" alt="$1$3" style="width: $2px;">');
        
        // Process image sizing: ![h:100](image.jpg)  
        processed = processed.replace(/!\[([^\]]*?)h:(\d+)([^\]]*?)\]\(([^)]+)\)/g,
            '<img src="$4" alt="$1$3" style="height: $2px;">');
        
        // Process background images: ![bg](image.jpg)
        processed = processed.replace(/!\[bg([^\]]*?)\]\(([^)]+)\)/g, 
            '<!-- background: $2 -->');
        
        // Process fit images: ![fit](image.jpg)
        processed = processed.replace(/!\[fit([^\]]*?)\]\(([^)]+)\)/g,
            '<img src="$2" alt="$1" style="width: 100%; height: 100%; object-fit: contain;">');
        
        // Process columns: <!-- split -->
        if (processed.includes('<!-- split -->')) {
            const parts = processed.split('<!-- split -->');
            if (parts.length === 2) {
                processed = `<div class="columns">\n<div>${parts[0]}</div>\n<div>${parts[1]}</div>\n</div>`;
            }
        }
        
        // Process text alignment
        processed = processed.replace(/<!-- center -->/g, '<div class="center">');
        processed = processed.replace(/<!-- \/center -->/g, '</div>');
        
        // Process text sizing
        processed = processed.replace(/<!-- large -->/g, '<div class="large">');
        processed = processed.replace(/<!-- \/large -->/g, '</div>');
        processed = processed.replace(/<!-- xlarge -->/g, '<div class="xlarge">');
        processed = processed.replace(/<!-- \/xlarge -->/g, '</div>');
        
        return processed;
    }

    postProcessHTML(html, slide) {
        let processed = html;
        
        // Add pagination if enabled
        if (slide.directives.paginate) {
            const pageNumber = slide.index + 1;
            processed += `<div class="pagination">${pageNumber}</div>`;
        }
        
        // Process background colors
        if (slide.directives.backgroundColor || slide.directives.bg) {
            const bgColor = slide.directives.backgroundColor || slide.directives.bg;
            processed = `<div style="background-color: ${bgColor}; width: 100%; height: 100%; padding: inherit;">${processed}</div>`;
        }
        
        // Process background images from directives
        if (slide.directives.backgroundImage || slide.directives.bgImage) {
            const bgImage = slide.directives.backgroundImage || slide.directives.bgImage;
            processed = `<div style="background-image: url(${bgImage}); background-size: cover; background-position: center; width: 100%; height: 100%; padding: inherit;">${processed}</div>`;
        }
        
        // Process color directives
        if (slide.directives.color) {
            processed = `<div style="color: ${slide.directives.color};">${processed}</div>`;
        }
        
        // Add slide classes to HTML
        if (slide.classes.length > 0) {
            const classAttr = slide.classes.join(' ');
            processed = `<div class="${classAttr}">${processed}</div>`;
        }
        
        // Process special box types
        processed = this.processSpecialBoxes(processed);
        
        return processed;
    }
    
    processSpecialBoxes(html) {
        // Warning boxes: > **Warning:** content
        html = html.replace(/<blockquote>\s*<p><strong>Warning:<\/strong>\s*(.*?)<\/p>\s*<\/blockquote>/gi, 
            '<div class="warning"><h3>⚠️ Warning</h3><p>$1</p></div>');
        
        // Success boxes: > **Success:** content  
        html = html.replace(/<blockquote>\s*<p><strong>Success:<\/strong>\s*(.*?)<\/p>\s*<\/blockquote>/gi,
            '<div class="success"><h3>✅ Success</h3><p>$1</p></div>');
        
        // Info boxes: > **Info:** content
        html = html.replace(/<blockquote>\s*<p><strong>Info:<\/strong>\s*(.*?)<\/p>\s*<\/blockquote>/gi,
            '<div class="highlight"><h3>ℹ️ Info</h3><p>$1</p></div>');
        
        return html;
    }
    
    // Utility methods for slide analysis
    getSlideCount() {
        return this.slides.length;
    }
    
    getSlide(index) {
        return this.slides[index] || null;
    }
    
    getGlobalDirectives() {
        return this.globalDirectives;
    }
    
    getSlidesByClass(className) {
        return this.slides.filter(slide => slide.classes.includes(className));
    }
    
    // Export methods for different formats
    toJSON() {
        return {
            slides: this.slides,
            globalDirectives: this.globalDirectives,
            slideCount: this.slides.length
        };
    }
    
    toMarkdown() {
        let markdown = '';
        
        // Add global frontmatter
        if (Object.keys(this.globalDirectives).length > 0) {
            markdown += '---\n';
            Object.entries(this.globalDirectives).forEach(([key, value]) => {
                markdown += `${key}: ${value}\n`;
            });
            markdown += '---\n\n';
        }
        
        // Add slides
        this.slides.forEach((slide, index) => {
            if (index > 0) {
                markdown += '\n---\n\n';
            }
            markdown += slide.markdown;
        });
        
        return markdown;
    }
    
    // Debug and development helpers
    debugSlide(index) {
        const slide = this.getSlide(index);
        if (slide) {
            console.group(`Slide ${index + 1}`);
            console.log('Markdown:', slide.markdown);
            console.log('HTML:', slide.html);
            console.log('Directives:', slide.directives);
            console.log('Classes:', slide.classes);
            console.log('Theme:', slide.theme);
            console.groupEnd();
        }
    }
    
    debugAll() {
        console.group('Marp Parser Debug');
        console.log('Global Directives:', this.globalDirectives);
        console.log('Total Slides:', this.slides.length);
        this.slides.forEach((_, index) => this.debugSlide(index));
        console.groupEnd();
    }
    
    // Validation methods
    validateSlide(slide) {
        const errors = [];
        const warnings = [];
        
        // Check for empty slides
        if (!slide.markdown.trim()) {
            warnings.push('Empty slide detected');
        }
        
        // Check for unsupported directives
        const supportedDirectives = [
            'theme', 'paginate', 'size', 'backgroundColor', 'bg', 
            'backgroundImage', 'bgImage', 'color', 'class', 'footer', 'header'
        ];
        
        Object.keys(slide.directives).forEach(directive => {
            if (!supportedDirectives.includes(directive)) {
                warnings.push(`Unsupported directive: ${directive}`);
            }
        });
        
        // Check for invalid image syntax
        if (slide.markdown.includes('![') && !slide.markdown.match(/!\[.*?\]\(.*?\)/)) {
            errors.push('Invalid image syntax detected');
        }
        
        return { errors, warnings };
    }
    
    validate() {
        const results = {
            errors: [],
            warnings: [],
            slideResults: []
        };
        
        this.slides.forEach((slide, index) => {
            const slideValidation = this.validateSlide(slide);
            results.slideResults[index] = slideValidation;
            
            slideValidation.errors.forEach(error => {
                results.errors.push(`Slide ${index + 1}: ${error}`);
            });
            
            slideValidation.warnings.forEach(warning => {
                results.warnings.push(`Slide ${index + 1}: ${warning}`);
            });
        });
        
        return results;
    }
}