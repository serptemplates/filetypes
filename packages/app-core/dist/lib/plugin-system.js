/**
 * Plugin Architecture System
 *
 * Modular system for extending tools functionality with plugins
 * for different conversion types, processors, and features.
 */
export class PluginManager {
    plugins = new Map();
    hooks = new Map();
    pluginRegistry = new Map();
    logger;
    fileUtils;
    validationUtils;
    constructor() {
        this.logger = this.createLogger();
        this.fileUtils = this.createFileUtils();
        this.validationUtils = this.createValidationUtils();
    }
    /**
     * Register a plugin
     */
    async registerPlugin(manifest, pluginClass) {
        // Validate plugin manifest
        if (!this.validateManifest(manifest)) {
            throw new Error(`Invalid plugin manifest: ${manifest.id}`);
        }
        // Check dependencies
        await this.checkDependencies(manifest);
        // Create plugin instance
        const plugin = new pluginClass();
        plugin.manifest = manifest;
        // Store in registry
        this.pluginRegistry.set(manifest.id, manifest);
        this.plugins.set(manifest.id, plugin);
        this.logger.info(`Plugin registered: ${manifest.id} v${manifest.version}`);
    }
    /**
     * Unregister a plugin
     */
    async unregisterPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }
        // Cleanup plugin
        if (plugin.cleanup) {
            await plugin.cleanup();
        }
        // Remove from registry
        this.plugins.delete(pluginId);
        this.pluginRegistry.delete(pluginId);
        // Remove hooks
        for (const [hookName, hooks] of this.hooks.entries()) {
            this.hooks.set(hookName, hooks.filter(hook => !hook.name.startsWith(`${pluginId}:`)));
        }
        this.logger.info(`Plugin unregistered: ${pluginId}`);
    }
    /**
     * Get plugin by ID
     */
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    /**
     * Get all plugins
     */
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Get plugins by type
     */
    getPluginsByType(type) {
        return Array.from(this.plugins.values()).filter(plugin => plugin.manifest.type === type);
    }
    /**
     * Get plugins supporting specific formats
     */
    getPluginsByFormat(format) {
        return Array.from(this.plugins.values()).filter(plugin => plugin.manifest.supportedFormats?.includes(format));
    }
    /**
     * Execute plugin
     */
    async executePlugin(pluginId, input, context, options) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }
        // Initialize plugin if needed
        await plugin.initialize(context);
        // Validate input
        if (plugin.validateInput && !plugin.validateInput(input)) {
            throw new Error(`Invalid input for plugin: ${pluginId}`);
        }
        // Merge options with defaults
        const finalOptions = {
            ...plugin.getDefaultOptions?.(),
            ...options
        };
        // Execute pre-hooks
        await this.executeHooks(`before:${pluginId}`, input, context);
        try {
            // Execute plugin
            const result = await plugin.execute(input, finalOptions);
            // Execute post-hooks
            await this.executeHooks(`after:${pluginId}`, result, context);
            this.logger.debug(`Plugin executed successfully: ${pluginId}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Plugin execution failed: ${pluginId}`, error);
            throw error;
        }
    }
    /**
     * Register a hook
     */
    registerHook(hookName, handler, priority = 0) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        const hook = {
            name: hookName,
            handler,
            priority
        };
        const hooks = this.hooks.get(hookName);
        hooks.push(hook);
        // Sort by priority (higher priority first)
        hooks.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Execute hooks
     */
    async executeHooks(hookName, data, context) {
        const hooks = this.hooks.get(hookName);
        if (!hooks || hooks.length === 0) {
            return data;
        }
        let result = data;
        for (const hook of hooks) {
            try {
                result = await hook.handler(result, context);
            }
            catch (error) {
                this.logger.warn(`Hook execution failed: ${hook.name}`, error);
            }
        }
        return result;
    }
    /**
     * Create plugin context
     */
    createContext(toolId, operation, formats) {
        return {
            toolId,
            operation,
            formats,
            metadata: {},
            utils: {
                logger: this.logger,
                fileUtils: this.fileUtils,
                validationUtils: this.validationUtils
            }
        };
    }
    /**
     * Get plugin capabilities
     */
    async getPluginCapabilities(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            return [];
        }
        return plugin.getCapabilities?.() || [];
    }
    /**
     * Validate plugin manifest
     */
    validateManifest(manifest) {
        const required = ['id', 'name', 'version', 'type', 'entryPoint'];
        return required.every(field => manifest[field]);
    }
    /**
     * Check plugin dependencies
     */
    async checkDependencies(manifest) {
        if (!manifest.dependencies) {
            return;
        }
        for (const dependency of manifest.dependencies) {
            if (!this.plugins.has(dependency)) {
                throw new Error(`Missing dependency: ${dependency} for plugin ${manifest.id}`);
            }
        }
    }
    /**
     * Create logger instance
     */
    createLogger() {
        return {
            debug: (message, data) => console.debug(`[DEBUG] ${message}`, data || ''),
            info: (message, data) => console.info(`[INFO] ${message}`, data || ''),
            warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
            error: (message, data) => console.error(`[ERROR] ${message}`, data || '')
        };
    }
    /**
     * Create file utilities
     */
    createFileUtils() {
        return {
            readFile: async (path) => {
                // Implementation would depend on environment (Node.js vs Browser)
                throw new Error('Not implemented');
            },
            writeFile: async (path, data) => {
                // Implementation would depend on environment (Node.js vs Browser)
                throw new Error('Not implemented');
            },
            getFileInfo: (file) => ({
                name: file.name,
                size: file.size,
                type: file.type
            }),
            validateFileType: (file, allowedTypes) => {
                return allowedTypes.includes(file.type) ||
                    allowedTypes.some(type => file.name.toLowerCase().endsWith(`.${type}`));
            }
        };
    }
    /**
     * Create validation utilities
     */
    createValidationUtils() {
        return {
            validateFormat: async (format, data) => {
                // Basic format validation - would be expanded with actual validators
                return data.length > 0;
            },
            sanitizeFilename: (filename) => {
                return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            },
            checkFileSize: (file, maxSize) => {
                return file.size <= maxSize;
            }
        };
    }
}
/**
 * Base plugin class that can be extended
 */
export class BasePlugin {
    manifest;
    async cleanup() {
        // Override in subclasses if needed
    }
    getCapabilities() {
        return this.manifest.supportedFormats || [];
    }
    validateInput(input) {
        return input !== null && input !== undefined;
    }
    getDefaultOptions() {
        return this.manifest.config || {};
    }
}
/**
 * Example converter plugin
 */
export class ImageConverterPlugin extends BasePlugin {
    async initialize(context) {
        context.utils.logger.info(`Initializing image converter for ${context.toolId}`);
    }
    async execute(input, options) {
        const { from, to } = options || {};
        if (!from || !to) {
            throw new Error('Missing format parameters');
        }
        // Placeholder implementation
        // In reality, this would use Canvas API, WebAssembly, or similar
        return new Blob([await input.arrayBuffer()], { type: `image/${to}` });
    }
    getCapabilities() {
        return ['jpg', 'png', 'gif', 'bmp', 'webp'];
    }
}
/**
 * Create plugin manager instance
 */
export function createPluginManager() {
    return new PluginManager();
}
//# sourceMappingURL=plugin-system.js.map