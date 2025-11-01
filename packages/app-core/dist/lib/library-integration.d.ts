/**
 * Library Integration System
 *
 * Integration with major conversion libraries like ImageMagick, FFmpeg,
 * VERT.sh, etc. to handle actual conversion operations.
 */
export interface LibraryCapability {
    name: string;
    version?: string;
    supportedFormats: {
        input: string[];
        output: string[];
    };
    operations: string[];
    platform: 'browser' | 'desktop' | 'server' | 'all';
    license: string;
    homepage?: string;
    documentation?: string;
}
export interface ConversionLibrary {
    id: string;
    name: string;
    description: string;
    capabilities: LibraryCapability;
    isAvailable: () => Promise<boolean>;
    convert: (input: any, options: any) => Promise<any>;
    getVersion: () => Promise<string | null>;
    initialize?: () => Promise<void>;
    cleanup?: () => Promise<void>;
}
export interface LibraryManager {
    registerLibrary(library: ConversionLibrary): void;
    getLibrary(id: string): ConversionLibrary | undefined;
    getLibrariesForConversion(from: string, to: string): ConversionLibrary[];
    getBestLibraryForConversion(from: string, to: string, platform?: string): ConversionLibrary | null;
    getAllLibraries(): ConversionLibrary[];
    checkLibraryAvailability(): Promise<Map<string, boolean>>;
}
/**
 * Main Library Registry and Manager
 */
export declare class ConversionLibraryManager implements LibraryManager {
    private libraries;
    registerLibrary(library: ConversionLibrary): void;
    getLibrary(id: string): ConversionLibrary | undefined;
    getLibrariesForConversion(from: string, to: string): ConversionLibrary[];
    getBestLibraryForConversion(from: string, to: string, platform?: string): ConversionLibrary | null;
    getAllLibraries(): ConversionLibrary[];
    checkLibraryAvailability(): Promise<Map<string, boolean>>;
}
/**
 * ImageMagick Browser Implementation
 * Using @imagemagick/magick-wasm for browser-based image processing
 */
export declare class ImageMagickLibrary implements ConversionLibrary {
    id: string;
    name: string;
    description: string;
    capabilities: LibraryCapability;
    isAvailable(): Promise<boolean>;
    convert(input: File | Blob, options: {
        format: string;
        quality?: number;
        width?: number;
        height?: number;
    }): Promise<Blob>;
    getVersion(): Promise<string | null>;
    initialize(): Promise<void>;
}
/**
 * FFmpeg.wasm Implementation
 * Using @ffmpeg/ffmpeg for browser-based video/audio processing
 */
export declare class FFmpegLibrary implements ConversionLibrary {
    id: string;
    name: string;
    description: string;
    capabilities: LibraryCapability;
    isAvailable(): Promise<boolean>;
    convert(input: File | Blob, options: {
        format: string;
        quality?: string;
        startTime?: number;
        duration?: number;
    }): Promise<Blob>;
    getVersion(): Promise<string | null>;
    initialize(): Promise<void>;
}
/**
 * VERT.sh Integration
 * For server-side conversions using VERT.sh API
 */
export declare class VertShLibrary implements ConversionLibrary {
    id: string;
    name: string;
    description: string;
    capabilities: LibraryCapability;
    isAvailable(): Promise<boolean>;
    convert(input: File | Blob, options: {
        format: string;
        quality?: number;
    }): Promise<Blob>;
    getVersion(): Promise<string | null>;
}
/**
 * Browser-native Canvas/WebAPI Library
 * For basic image operations using Canvas API
 */
export declare class CanvasLibrary implements ConversionLibrary {
    id: string;
    name: string;
    description: string;
    capabilities: LibraryCapability;
    isAvailable(): Promise<boolean>;
    convert(input: File | Blob, options: {
        format: string;
        quality?: number;
        width?: number;
        height?: number;
    }): Promise<Blob>;
    getVersion(): Promise<string | null>;
}
/**
 * Create and configure the default library manager with all available libraries
 */
export declare function createLibraryManager(): ConversionLibraryManager;
/**
 * Get conversion recommendations based on available libraries
 */
export declare function getConversionRecommendations(from: string, to: string, platform?: string): Promise<{
    recommended: ConversionLibrary | null;
    alternatives: ConversionLibrary[];
    unsupported: boolean;
}>;
/**
 * Generate library compatibility matrix
 */
export declare function generateLibraryMatrix(): {
    libraries: ConversionLibrary[];
    matrix: Record<string, Record<string, string[]>>;
};
//# sourceMappingURL=library-integration.d.ts.map