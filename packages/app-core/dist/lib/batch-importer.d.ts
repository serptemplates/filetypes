/**
 * Batch Tool Import System
 *
 * Allows administrators to import large lists of tools and automatically
 * detect which ones already exist vs. which are new.
 */
import { Tool } from './tool-generator';
import { ToolRegistryManager } from './tool-registry';
export interface ImportToolRequest {
    from: string;
    to: string;
    operation?: string;
    priority?: number;
    tags?: string[];
}
export interface ImportAnalysisResult {
    total: number;
    existing: Array<{
        request: ImportToolRequest;
        existingTool: Tool;
        match: 'exact' | 'similar';
    }>;
    new: ImportToolRequest[];
    conflicts: Array<{
        request: ImportToolRequest;
        issue: string;
    }>;
}
export interface ImportExecutionResult {
    success: boolean;
    created: Tool[];
    skipped: Array<{
        tool: ImportToolRequest;
        reason: string;
    }>;
    errors: Array<{
        tool: ImportToolRequest;
        error: string;
    }>;
}
export declare class BatchToolImporter {
    private registryManager;
    private supportedFormats;
    constructor(registryManager: ToolRegistryManager);
    /**
     * Parse a batch import list from various formats with fuzzy matching
     */
    parseImportList(input: string): ImportToolRequest[];
    /**
     * Parse a single conversion line with multiple format support
     * Handles: "jpg to png", "convert jpg to png", "jpg 2 png", "jpg->png", etc.
     */
    private parseConversionLine;
    /**
     * Analyze import requests against existing tools with enhanced duplicate detection
     */
    analyzeImportRequests(requests: ImportToolRequest[]): Promise<ImportAnalysisResult>;
    /**
     * Find fuzzy matches for tools that might be duplicates with different naming
     */
    private findFuzzyMatch;
    /**
     * Check if two formats are equivalent (e.g., jpg vs jpeg)
     */
    private areFormatsEquivalent;
    /**
     * Check if request semantically matches existing tool based on name patterns
     */
    private isSemanticMatch;
    /**
     * Execute import of new tools
     */
    executeImport(requests: ImportToolRequest[], options?: {
        skipExisting?: boolean;
        generateContent?: boolean;
        dryRun?: boolean;
    }): Promise<ImportExecutionResult>;
    /**
     * Import from file
     */
    importFromFile(filePath: string, options?: Parameters<BatchToolImporter['executeImport']>[1]): Promise<{
        analysis: ImportAnalysisResult;
        execution?: ImportExecutionResult;
    }>;
    /**
     * Generate import statistics with enhanced duplicate detection info
     */
    generateImportReport(analysis: ImportAnalysisResult, execution?: ImportExecutionResult): string;
    /**
     * Test the parsing capabilities with sample inputs
     */
    testParsingCapabilities(): {
        input: string;
        parsed: any;
        success: boolean;
    }[];
    /**
     * Validate an import request
     */
    private validateImportRequest;
    /**
     * Check if a format is valid/supported
     */
    private isValidFormat;
    /**
     * Determine the operation type based on formats
     */
    private determineOperation;
    /**
     * Generate a Tool object from an import request
     */
    private generateToolFromRequest;
    /**
     * Generate basic content for a tool
     */
    private generateBasicContent;
}
/**
 * Create a batch tool importer instance
 */
export declare function createBatchToolImporter(registryManager: ToolRegistryManager): BatchToolImporter;
//# sourceMappingURL=batch-importer.d.ts.map