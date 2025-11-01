/**
 * Library Integration System
 *
 * Integration with major conversion libraries like ImageMagick, FFmpeg,
 * VERT.sh, etc. to handle actual conversion operations.
 */
/**
 * Main Library Registry and Manager
 */
export class ConversionLibraryManager {
    libraries = new Map();
    registerLibrary(library) {
        this.libraries.set(library.id, library);
    }
    getLibrary(id) {
        return this.libraries.get(id);
    }
    getLibrariesForConversion(from, to) {
        return Array.from(this.libraries.values()).filter(lib => {
            const caps = lib.capabilities;
            return caps.supportedFormats.input.includes(from.toLowerCase()) &&
                caps.supportedFormats.output.includes(to.toLowerCase());
        });
    }
    getBestLibraryForConversion(from, to, platform = 'browser') {
        const candidates = this.getLibrariesForConversion(from, to)
            .filter(lib => lib.capabilities.platform === platform || lib.capabilities.platform === 'all')
            .sort((a, b) => {
            // Prioritize by format support coverage and known reliability
            const aSupport = a.capabilities.supportedFormats.input.length + a.capabilities.supportedFormats.output.length;
            const bSupport = b.capabilities.supportedFormats.input.length + b.capabilities.supportedFormats.output.length;
            return bSupport - aSupport;
        });
        return candidates[0] || null;
    }
    getAllLibraries() {
        return Array.from(this.libraries.values());
    }
    async checkLibraryAvailability() {
        const availability = new Map();
        for (const [id, library] of this.libraries) {
            try {
                const isAvailable = await library.isAvailable();
                availability.set(id, isAvailable);
            }
            catch (error) {
                availability.set(id, false);
            }
        }
        return availability;
    }
}
/**
 * ImageMagick Browser Implementation
 * Using @imagemagick/magick-wasm for browser-based image processing
 */
export class ImageMagickLibrary {
    id = 'imagemagick-wasm';
    name = 'ImageMagick WASM';
    description = 'ImageMagick compiled to WebAssembly for browser-based image processing';
    capabilities = {
        name: 'ImageMagick',
        version: '7.1.0',
        supportedFormats: {
            input: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'psd', 'raw', 'heic', 'avif'],
            output: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'pdf', 'avif']
        },
        operations: ['convert', 'resize', 'crop', 'rotate', 'compress', 'optimize'],
        platform: 'browser',
        license: 'Apache 2.0',
        homepage: 'https://imagemagick.org/',
        documentation: 'https://github.com/dlemstra/magick-wasm'
    };
    async isAvailable() {
        try {
            // Check if ImageMagick WASM is available
            // This would typically check for the actual library
            return typeof window !== 'undefined';
        }
        catch {
            return false;
        }
    }
    async convert(input, options) {
        // This would implement the actual ImageMagick WASM conversion
        // For now, return a placeholder implementation
        console.log('ImageMagick conversion:', { input: input.type, options });
        return new Blob([await input.arrayBuffer()], { type: `image/${options.format}` });
    }
    async getVersion() {
        return this.capabilities.version || null;
    }
    async initialize() {
        // Initialize ImageMagick WASM module
        // This would load and configure the WASM module
    }
}
/**
 * FFmpeg.wasm Implementation
 * Using @ffmpeg/ffmpeg for browser-based video/audio processing
 */
export class FFmpegLibrary {
    id = 'ffmpeg-wasm';
    name = 'FFmpeg WASM';
    description = 'FFmpeg compiled to WebAssembly for browser-based video and audio processing';
    capabilities = {
        name: 'FFmpeg',
        version: '6.0',
        supportedFormats: {
            input: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'mpeg', 'mp3', 'wav', 'aac', 'flac', 'ogg'],
            output: ['mp4', 'webm', 'gif', 'mp3', 'wav', 'aac', 'ogg']
        },
        operations: ['convert', 'transcode', 'extract', 'compress', 'thumbnail'],
        platform: 'browser',
        license: 'LGPL',
        homepage: 'https://ffmpeg.org/',
        documentation: 'https://github.com/ffmpegwasm/ffmpeg.wasm'
    };
    async isAvailable() {
        try {
            // Check if SharedArrayBuffer is supported (required for FFmpeg.wasm)
            return typeof SharedArrayBuffer !== 'undefined';
        }
        catch {
            return false;
        }
    }
    async convert(input, options) {
        // This would implement the actual FFmpeg WASM conversion
        console.log('FFmpeg conversion:', { input: input.type, options });
        return new Blob([await input.arrayBuffer()], { type: `video/${options.format}` });
    }
    async getVersion() {
        return this.capabilities.version || null;
    }
    async initialize() {
        // Initialize FFmpeg WASM module
        // This would load the FFmpeg core and configure it
    }
}
/**
 * VERT.sh Integration
 * For server-side conversions using VERT.sh API
 */
export class VertShLibrary {
    id = 'vert-sh';
    name = 'VERT.sh';
    description = 'Server-side file conversion service via VERT.sh API';
    capabilities = {
        name: 'VERT.sh',
        supportedFormats: {
            input: ['jpg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'pdf', 'mp4', 'avi', 'mov', 'mp3', 'wav'],
            output: ['jpg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'pdf', 'mp4', 'webm', 'gif', 'mp3', 'wav']
        },
        operations: ['convert', 'compress', 'optimize', 'thumbnail'],
        platform: 'server',
        license: 'Commercial',
        homepage: 'https://vert.sh/',
        documentation: 'https://vert.sh/docs'
    };
    async isAvailable() {
        try {
            // Check if we can reach VERT.sh API
            // This would make an actual API call to verify availability
            return true; // Placeholder
        }
        catch {
            return false;
        }
    }
    async convert(input, options) {
        // This would implement the actual VERT.sh API call
        console.log('VERT.sh conversion:', { input: input.type, options });
        return new Blob([await input.arrayBuffer()], { type: `application/${options.format}` });
    }
    async getVersion() {
        return 'API v1';
    }
}
/**
 * Browser-native Canvas/WebAPI Library
 * For basic image operations using Canvas API
 */
export class CanvasLibrary {
    id = 'canvas-api';
    name = 'Canvas API';
    description = 'Browser-native image processing using Canvas API';
    capabilities = {
        name: 'Canvas API',
        supportedFormats: {
            input: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
            output: ['jpg', 'jpeg', 'png', 'webp']
        },
        operations: ['convert', 'resize', 'crop', 'rotate'],
        platform: 'browser',
        license: 'Web Standard',
        homepage: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'
    };
    async isAvailable() {
        return typeof HTMLCanvasElement !== 'undefined';
    }
    async convert(input, options) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = options.width || img.width;
                canvas.height = options.height || img.height;
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    }
                    else {
                        reject(new Error('Canvas conversion failed'));
                    }
                }, `image/${options.format}`, options.quality || 0.9);
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(input);
        });
    }
    async getVersion() {
        return 'Native';
    }
}
/**
 * Create and configure the default library manager with all available libraries
 */
export function createLibraryManager() {
    const manager = new ConversionLibraryManager();
    // Register all available libraries
    manager.registerLibrary(new ImageMagickLibrary());
    manager.registerLibrary(new FFmpegLibrary());
    manager.registerLibrary(new VertShLibrary());
    manager.registerLibrary(new CanvasLibrary());
    return manager;
}
/**
 * Get conversion recommendations based on available libraries
 */
export async function getConversionRecommendations(from, to, platform = 'browser') {
    const manager = createLibraryManager();
    const libraries = manager.getLibrariesForConversion(from, to);
    const platformLibraries = libraries.filter(lib => lib.capabilities.platform === platform || lib.capabilities.platform === 'all');
    const recommended = manager.getBestLibraryForConversion(from, to, platform);
    const alternatives = platformLibraries.filter(lib => lib.id !== recommended?.id);
    return {
        recommended,
        alternatives,
        unsupported: libraries.length === 0
    };
}
/**
 * Generate library compatibility matrix
 */
export function generateLibraryMatrix() {
    const manager = createLibraryManager();
    const libraries = manager.getAllLibraries();
    const matrix = {};
    for (const library of libraries) {
        for (const inputFormat of library.capabilities.supportedFormats.input) {
            if (!matrix[inputFormat]) {
                matrix[inputFormat] = {};
            }
            for (const outputFormat of library.capabilities.supportedFormats.output) {
                if (!matrix[inputFormat][outputFormat]) {
                    matrix[inputFormat][outputFormat] = [];
                }
                matrix[inputFormat][outputFormat].push(library.id);
            }
        }
    }
    return { libraries, matrix };
}
//# sourceMappingURL=library-integration.js.map