// Logo Manager desactivado - Solo stub para evitar errores
class CeniaLogoManager {
    constructor() {
        this.logos = {};
        this.initialized = false;
    }

    async init() {
        console.log('Logo Manager desactivado - usando solo backgrounds');
        this.initialized = true;
    }

    updateSlidesWithLogos() {
        // No hacer nada - solo backgrounds
    }

    getLogosForExport() {
        return {};
    }

    applyLogosToExportHTML(html, logos) {
        return html;
    }

    integrateWithParser(parser) {
        // No hacer nada
    }
}

// Stub mínimo para evitar errores
document.addEventListener('DOMContentLoaded', () => {
    window.ceniaLogoManager = new CeniaLogoManager();
    window.ceniaLogoManager.init();
});