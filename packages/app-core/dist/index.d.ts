/**
 * SerpTools Core Library
 *
 * Main export file for the core functionality
 */
export { ToolGenerator, createToolGenerator, type Tool, type ToolGeneratorConfig } from './lib/tool-generator';
export { ToolRegistryManager, createRegistryManager, type ToolRegistry, type ToolDependency, type ToolMetrics } from './lib/tool-registry';
export { BatchToolImporter, createBatchToolImporter, type ImportToolRequest, type ImportAnalysisResult, type ImportExecutionResult } from './lib/batch-importer';
export { ConversionLibraryManager, ImageMagickLibrary, FFmpegLibrary, VertShLibrary, CanvasLibrary, createLibraryManager, getConversionRecommendations, generateLibraryMatrix, type ConversionLibrary, type LibraryCapability, type LibraryManager } from './lib/library-integration';
export { PluginManager, BasePlugin, ImageConverterPlugin, createPluginManager, type PluginManifest, type PluginInstance, type PluginContext, type PluginHook } from './lib/plugin-system';
export { ToolProcessor, PerformanceMonitor, createToolProcessor, createPerformanceMonitor, type ProcessingOptions, type ProcessingResult, type BatchProcessingOptions, type BatchProcessingResult, type ToolCapabilities } from './lib/tool-processor';
export { ToolValidator, createToolValidator, type ValidationTest, type ValidationResult, type ToolValidationReport } from './lib/tool-validator';
export { AnalyticsManager, InMemoryAnalyticsStorage, createAnalyticsManager, type AnalyticsEvent, type ToolUsageEvent, type PerformanceMetrics, type UsageStatistics, type AlertRule, type AnalyticsStorage } from './lib/analytics';
export { DocumentationGenerator, createDocumentationGenerator, type DocumentationSection, type APIDocumentation } from './lib/documentation';
export { default as toolsData } from './data/tools.json';
export { default as extensionsData } from './data/extensions.json';
//# sourceMappingURL=index.d.ts.map