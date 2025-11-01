/**
 * Plugin Architecture System
 *
 * Modular system for extending tools functionality with plugins
 * for different conversion types, processors, and features.
 */
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    type: 'converter' | 'processor' | 'validator' | 'ui-component' | 'workflow';
    supportedFormats?: string[];
    dependencies?: string[];
    permissions?: string[];
    entryPoint: string;
    config?: Record<string, any>;
}
export interface PluginContext {
    toolId: string;
    operation: string;
    formats: {
        from?: string;
        to?: string;
    };
    metadata: Record<string, any>;
    utils: {
        logger: Logger;
        fileUtils: FileUtils;
        validationUtils: ValidationUtils;
    };
}
export interface Logger {
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
}
export interface FileUtils {
    readFile(path: string): Promise<Buffer>;
    writeFile(path: string, data: Buffer): Promise<void>;
    getFileInfo(file: File): {
        name: string;
        size: number;
        type: string;
    };
    validateFileType(file: File, allowedTypes: string[]): boolean;
}
export interface ValidationUtils {
    validateFormat(format: string, data: Buffer): Promise<boolean>;
    sanitizeFilename(filename: string): string;
    checkFileSize(file: File, maxSize: number): boolean;
}
export interface PluginInstance {
    manifest: PluginManifest;
    initialize(context: PluginContext): Promise<void>;
    execute(input: any, options?: Record<string, any>): Promise<any>;
    cleanup?(): Promise<void>;
    getCapabilities?(): string[];
    validateInput?(input: any): boolean;
    getDefaultOptions?(): Record<string, any>;
}
export interface PluginHook {
    name: string;
    handler: (data: any, context: PluginContext) => Promise<any>;
    priority: number;
}
export declare class PluginManager {
    private plugins;
    private hooks;
    private pluginRegistry;
    private logger;
    private fileUtils;
    private validationUtils;
    constructor();
    /**
     * Register a plugin
     */
    registerPlugin(manifest: PluginManifest, pluginClass: new () => PluginInstance): Promise<void>;
    /**
     * Unregister a plugin
     */
    unregisterPlugin(pluginId: string): Promise<void>;
    /**
     * Get plugin by ID
     */
    getPlugin(pluginId: string): PluginInstance | undefined;
    /**
     * Get all plugins
     */
    getAllPlugins(): PluginInstance[];
    /**
     * Get plugins by type
     */
    getPluginsByType(type: string): PluginInstance[];
    /**
     * Get plugins supporting specific formats
     */
    getPluginsByFormat(format: string): PluginInstance[];
    /**
     * Execute plugin
     */
    executePlugin(pluginId: string, input: any, context: PluginContext, options?: Record<string, any>): Promise<any>;
    /**
     * Register a hook
     */
    registerHook(hookName: string, handler: PluginHook['handler'], priority?: number): void;
    /**
     * Execute hooks
     */
    executeHooks(hookName: string, data: any, context: PluginContext): Promise<any>;
    /**
     * Create plugin context
     */
    createContext(toolId: string, operation: string, formats: {
        from?: string;
        to?: string;
    }): PluginContext;
    /**
     * Get plugin capabilities
     */
    getPluginCapabilities(pluginId: string): Promise<string[]>;
    /**
     * Validate plugin manifest
     */
    private validateManifest;
    /**
     * Check plugin dependencies
     */
    private checkDependencies;
    /**
     * Create logger instance
     */
    private createLogger;
    /**
     * Create file utilities
     */
    private createFileUtils;
    /**
     * Create validation utilities
     */
    private createValidationUtils;
}
/**
 * Base plugin class that can be extended
 */
export declare abstract class BasePlugin implements PluginInstance {
    manifest: PluginManifest;
    abstract initialize(context: PluginContext): Promise<void>;
    abstract execute(input: any, options?: Record<string, any>): Promise<any>;
    cleanup(): Promise<void>;
    getCapabilities(): string[];
    validateInput(input: any): boolean;
    getDefaultOptions(): Record<string, any>;
}
/**
 * Example converter plugin
 */
export declare class ImageConverterPlugin extends BasePlugin {
    initialize(context: PluginContext): Promise<void>;
    execute(input: File, options?: Record<string, any>): Promise<Blob>;
    getCapabilities(): string[];
}
/**
 * Create plugin manager instance
 */
export declare function createPluginManager(): PluginManager;
//# sourceMappingURL=plugin-system.d.ts.map