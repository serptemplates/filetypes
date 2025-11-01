/**
 * Shared Business Logic Layer
 *
 * Common core functionality that can be shared between web and desktop versions,
 * ensuring consistency and reducing duplication.
 */
export class ToolProcessor {
    pluginManager;
    capabilities = new Map();
    constructor(pluginManager) {
        this.pluginManager = pluginManager;
        this.initializeCapabilities();
    }
    /**
     * Process a single file
     */
    async processFile(toolId, file, options = {}) {
        const startTime = Date.now();
        try {
            // Get tool capabilities
            const capabilities = this.capabilities.get(toolId);
            if (!capabilities) {
                throw new Error(`Tool ${toolId} not found or not supported`);
            }
            // Validate input
            await this.validateInput(file, capabilities, options);
            // Get appropriate plugin
            const plugin = this.getToolPlugin(toolId, capabilities);
            if (!plugin) {
                throw new Error(`No plugin available for tool ${toolId}`);
            }
            // Create processing context
            const context = this.createProcessingContext(toolId, capabilities);
            // Execute processing
            const result = await this.pluginManager.executePlugin(plugin.manifest.id, file, context, options);
            const processingTime = Date.now() - startTime;
            return {
                success: true,
                data: result,
                metadata: {
                    originalSize: this.getFileSize(file),
                    outputSize: this.getDataSize(result),
                    format: options.outputFormat
                },
                processingTime,
                outputSize: this.getDataSize(result)
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                processingTime
            };
        }
    }
    /**
     * Process multiple files in batch
     */
    async processBatch(toolId, files, options = {}) {
        const startTime = Date.now();
        const results = [];
        const { parallel = true, maxConcurrency = 4, stopOnError = false, progressCallback } = options;
        let successCount = 0;
        let errorCount = 0;
        const processFile = async (file, index) => {
            const filename = file instanceof File ? file.name : `file_${index}`;
            const result = await this.processFile(toolId, file, options);
            if (result.success) {
                successCount++;
            }
            else {
                errorCount++;
            }
            const processedItem = { index, result, filename };
            results.push(processedItem);
            // Update progress
            if (progressCallback) {
                const progress = ((successCount + errorCount) / files.length) * 100;
                progressCallback(progress, successCount + errorCount, files.length);
            }
            return processedItem;
        };
        try {
            if (parallel) {
                // Process files in parallel with concurrency limit
                const chunks = this.chunkArray(files, maxConcurrency);
                for (const chunk of chunks) {
                    const promises = chunk.map((file, chunkIndex) => {
                        const globalIndex = chunks.flat().indexOf(file);
                        return processFile(file, globalIndex);
                    });
                    const chunkResults = await Promise.all(promises);
                    // Check if we should stop on error
                    if (stopOnError && chunkResults.some(r => !r.result.success)) {
                        break;
                    }
                }
            }
            else {
                // Process files sequentially
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file) {
                        const result = await processFile(file, i);
                        if (stopOnError && !result.result.success) {
                            break;
                        }
                    }
                }
            }
            const totalProcessingTime = Date.now() - startTime;
            const overallProgress = ((successCount + errorCount) / files.length) * 100;
            return {
                success: errorCount === 0,
                results: results.sort((a, b) => a.index - b.index),
                totalProcessingTime,
                successCount,
                errorCount,
                overallProgress
            };
        }
        catch (error) {
            return {
                success: false,
                results,
                totalProcessingTime: Date.now() - startTime,
                successCount,
                errorCount,
                overallProgress: ((successCount + errorCount) / files.length) * 100
            };
        }
    }
    /**
     * Get tool capabilities
     */
    getToolCapabilities(toolId) {
        return this.capabilities.get(toolId);
    }
    /**
     * Check if tool supports specific operation
     */
    supportsOperation(toolId, inputFormat, outputFormat) {
        const capabilities = this.capabilities.get(toolId);
        if (!capabilities)
            return false;
        return capabilities.supportedInputFormats.includes(inputFormat) &&
            capabilities.supportedOutputFormats.includes(outputFormat);
    }
    /**
     * Get recommended settings for a tool
     */
    getRecommendedSettings(toolId, inputFormat, outputFormat) {
        const capabilities = this.capabilities.get(toolId);
        if (!capabilities)
            return {};
        const settings = {};
        // Set quality based on format
        if (capabilities.supportsQuality) {
            if (['jpg', 'jpeg', 'webp'].includes(outputFormat)) {
                settings.quality = 85;
            }
        }
        // Set compression based on format
        if (capabilities.supportsCompression) {
            if (['png', 'gif'].includes(outputFormat)) {
                settings.compression = 6;
            }
        }
        // Set max size based on capabilities
        settings.maxSize = capabilities.maxFileSize;
        return settings;
    }
    /**
     * Estimate processing time
     */
    estimateProcessingTime(toolId, fileSize, options = {}) {
        const capabilities = this.capabilities.get(toolId);
        if (!capabilities)
            return 0;
        // Base time in milliseconds per MB
        let baseTime = 1000; // 1 second per MB
        // Adjust based on complexity
        if (capabilities.requiresFFmpeg) {
            baseTime *= 3; // FFmpeg operations are more complex
        }
        if (options.quality && options.quality > 90) {
            baseTime *= 1.5; // High quality takes longer
        }
        const fileSizeMB = fileSize / (1024 * 1024);
        return Math.max(500, baseTime * fileSizeMB); // Minimum 500ms
    }
    /**
     * Validate input file/buffer
     */
    async validateInput(file, capabilities, options) {
        const fileSize = this.getFileSize(file);
        // Check file size
        if (fileSize > capabilities.maxFileSize) {
            throw new Error(`File size exceeds maximum allowed size of ${capabilities.maxFileSize} bytes`);
        }
        // Validate input format
        if (file instanceof File) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension && !capabilities.supportedInputFormats.includes(extension)) {
                throw new Error(`Unsupported input format: ${extension}`);
            }
        }
        // Validate output format
        if (options.outputFormat && !capabilities.supportedOutputFormats.includes(options.outputFormat)) {
            throw new Error(`Unsupported output format: ${options.outputFormat}`);
        }
    }
    /**
     * Get appropriate plugin for tool
     */
    getToolPlugin(toolId, capabilities) {
        // Find plugin that supports the required formats
        const availablePlugins = this.pluginManager.getAllPlugins();
        return availablePlugins.find(plugin => {
            const supportedFormats = plugin.manifest.supportedFormats || [];
            return capabilities.supportedInputFormats.some(format => supportedFormats.includes(format));
        });
    }
    /**
     * Create processing context
     */
    createProcessingContext(toolId, capabilities) {
        return this.pluginManager.createContext(toolId, 'convert', // Default operation
        {
            from: capabilities.supportedInputFormats[0],
            to: capabilities.supportedOutputFormats[0]
        });
    }
    /**
     * Get file size
     */
    getFileSize(file) {
        return file instanceof File ? file.size : file.length;
    }
    /**
     * Get data size
     */
    getDataSize(data) {
        if (data instanceof Blob)
            return data.size;
        if (data instanceof Buffer)
            return data.length;
        if (typeof data === 'string')
            return new Blob([data]).size;
        return 0;
    }
    /**
     * Chunk array into smaller arrays
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * Initialize tool capabilities
     */
    initializeCapabilities() {
        // This would normally load from configuration or be dynamically determined
        // For now, we'll set up some example capabilities
        const imageCapabilities = {
            supportedInputFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif'],
            supportedOutputFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
            maxFileSize: 50 * 1024 * 1024, // 50MB
            supportsBatch: true,
            supportsQuality: true,
            supportsCompression: true,
            requiresFFmpeg: false,
            platform: 'both'
        };
        const videoCapabilities = {
            supportedInputFormats: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'],
            supportedOutputFormats: ['mp4', 'webm', 'gif'],
            maxFileSize: 500 * 1024 * 1024, // 500MB
            supportsBatch: true,
            supportsQuality: true,
            supportsCompression: true,
            requiresFFmpeg: true,
            platform: 'desktop'
        };
        const audioCapabilities = {
            supportedInputFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
            supportedOutputFormats: ['mp3', 'wav', 'aac', 'ogg'],
            maxFileSize: 100 * 1024 * 1024, // 100MB
            supportsBatch: true,
            supportsQuality: true,
            supportsCompression: true,
            requiresFFmpeg: true,
            platform: 'desktop'
        };
        // Register capabilities for different tool types
        this.registerToolCapabilities('image-converter', imageCapabilities);
        this.registerToolCapabilities('video-converter', videoCapabilities);
        this.registerToolCapabilities('audio-converter', audioCapabilities);
    }
    /**
     * Register capabilities for a tool
     */
    registerToolCapabilities(toolId, capabilities) {
        this.capabilities.set(toolId, capabilities);
    }
}
/**
 * Performance Monitor for tracking tool usage
 */
export class PerformanceMonitor {
    metrics = new Map();
    /**
     * Record performance metric
     */
    record(toolId, duration, fileSize) {
        if (!this.metrics.has(toolId)) {
            this.metrics.set(toolId, []);
        }
        const toolMetrics = this.metrics.get(toolId);
        toolMetrics.push({
            timestamp: new Date(),
            duration,
            fileSize
        });
        // Keep only last 1000 entries per tool
        if (toolMetrics.length > 1000) {
            toolMetrics.splice(0, toolMetrics.length - 1000);
        }
    }
    /**
     * Get performance statistics
     */
    getStats(toolId) {
        const metrics = this.metrics.get(toolId);
        if (!metrics || metrics.length === 0) {
            return null;
        }
        const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
        const totalFileSize = metrics.reduce((sum, m) => sum + m.fileSize, 0);
        return {
            averageDuration: totalDuration / metrics.length,
            averageFileSize: totalFileSize / metrics.length,
            throughput: totalFileSize / (totalDuration / 1000), // bytes per second
            usageCount: metrics.length
        };
    }
    /**
     * Get all tools performance summary
     */
    getAllStats() {
        const allStats = {};
        for (const toolId of this.metrics.keys()) {
            allStats[toolId] = this.getStats(toolId);
        }
        return allStats;
    }
}
/**
 * Create tool processor instance
 */
export function createToolProcessor(pluginManager) {
    return new ToolProcessor(pluginManager);
}
/**
 * Create performance monitor instance
 */
export function createPerformanceMonitor() {
    return new PerformanceMonitor();
}
//# sourceMappingURL=tool-processor.js.map