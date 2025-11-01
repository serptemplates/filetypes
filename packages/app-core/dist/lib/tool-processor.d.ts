/**
 * Shared Business Logic Layer
 *
 * Common core functionality that can be shared between web and desktop versions,
 * ensuring consistency and reducing duplication.
 */
import { PluginManager } from './plugin-system';
export interface ProcessingOptions {
    quality?: number;
    compression?: number;
    maxSize?: number;
    preserveMetadata?: boolean;
    outputFormat?: string;
    customSettings?: Record<string, any>;
}
export interface ProcessingResult {
    success: boolean;
    data?: Blob | Buffer | string;
    metadata?: Record<string, any>;
    warnings?: string[];
    errors?: string[];
    processingTime: number;
    outputSize?: number;
}
export interface BatchProcessingOptions extends ProcessingOptions {
    parallel?: boolean;
    maxConcurrency?: number;
    stopOnError?: boolean;
    progressCallback?: (progress: number, current: number, total: number) => void;
}
export interface BatchProcessingResult {
    success: boolean;
    results: Array<{
        index: number;
        result: ProcessingResult;
        filename?: string;
    }>;
    totalProcessingTime: number;
    successCount: number;
    errorCount: number;
    overallProgress: number;
}
export interface ToolCapabilities {
    supportedInputFormats: string[];
    supportedOutputFormats: string[];
    maxFileSize: number;
    supportsBatch: boolean;
    supportsQuality: boolean;
    supportsCompression: boolean;
    requiresFFmpeg: boolean;
    platform: 'browser' | 'desktop' | 'both';
}
export declare class ToolProcessor {
    private pluginManager;
    private capabilities;
    constructor(pluginManager: PluginManager);
    /**
     * Process a single file
     */
    processFile(toolId: string, file: File | Buffer, options?: ProcessingOptions): Promise<ProcessingResult>;
    /**
     * Process multiple files in batch
     */
    processBatch(toolId: string, files: Array<File | Buffer>, options?: BatchProcessingOptions): Promise<BatchProcessingResult>;
    /**
     * Get tool capabilities
     */
    getToolCapabilities(toolId: string): ToolCapabilities | undefined;
    /**
     * Check if tool supports specific operation
     */
    supportsOperation(toolId: string, inputFormat: string, outputFormat: string): boolean;
    /**
     * Get recommended settings for a tool
     */
    getRecommendedSettings(toolId: string, inputFormat: string, outputFormat: string): ProcessingOptions;
    /**
     * Estimate processing time
     */
    estimateProcessingTime(toolId: string, fileSize: number, options?: ProcessingOptions): number;
    /**
     * Validate input file/buffer
     */
    private validateInput;
    /**
     * Get appropriate plugin for tool
     */
    private getToolPlugin;
    /**
     * Create processing context
     */
    private createProcessingContext;
    /**
     * Get file size
     */
    private getFileSize;
    /**
     * Get data size
     */
    private getDataSize;
    /**
     * Chunk array into smaller arrays
     */
    private chunkArray;
    /**
     * Initialize tool capabilities
     */
    private initializeCapabilities;
    /**
     * Register capabilities for a tool
     */
    private registerToolCapabilities;
}
/**
 * Performance Monitor for tracking tool usage
 */
export declare class PerformanceMonitor {
    private metrics;
    /**
     * Record performance metric
     */
    record(toolId: string, duration: number, fileSize: number): void;
    /**
     * Get performance statistics
     */
    getStats(toolId: string): {
        averageDuration: number;
        averageFileSize: number;
        throughput: number;
        usageCount: number;
    } | null;
    /**
     * Get all tools performance summary
     */
    getAllStats(): Record<string, ReturnType<PerformanceMonitor['getStats']>>;
}
/**
 * Create tool processor instance
 */
export declare function createToolProcessor(pluginManager: PluginManager): ToolProcessor;
/**
 * Create performance monitor instance
 */
export declare function createPerformanceMonitor(): PerformanceMonitor;
//# sourceMappingURL=tool-processor.d.ts.map