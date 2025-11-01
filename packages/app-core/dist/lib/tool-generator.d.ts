/**
 * Tool Generation System
 *
 * This module provides utilities for automatically generating tool pages,
 * configurations, and related files from the central tools registry.
 */
export interface Tool {
    id: string;
    name: string;
    description: string;
    operation: string;
    route: string;
    from?: string;
    to?: string;
    isActive: boolean;
    tags?: string[];
    priority?: number;
    isBeta?: boolean;
    isNew?: boolean;
    requiresFFmpeg?: boolean;
    content?: any;
}
export interface ToolGeneratorConfig {
    outputDir: string;
    templateDir: string;
    skipExisting?: boolean;
    registryPath?: string;
}
export declare class ToolGenerator {
    private tools;
    private config;
    constructor(config: ToolGeneratorConfig);
    /**
     * Load tools from registry
     */
    loadToolsFromRegistry(): Promise<void>;
    /**
     * Generate all tool pages based on the tools registry
     */
    generateAllTools(): Promise<void>;
    /**
     * Generate a single tool page
     */
    generateTool(tool: Tool): Promise<void>;
    /**
     * Generate the main page.tsx file for a tool
     */
    private generatePageFile;
    /**
     * Generate page template content
     */
    private generatePageTemplate;
    /**
     * Generate metadata file if needed
     */
    private generateMetadata;
    /**
     * Convert tool ID to PascalCase for component names
     */
    private toPascalCase;
    /**
     * Get statistics about tools
     */
    getToolStats(): {
        total: number;
        active: number;
        byOperation: Record<string, number>;
        byFormat: Record<string, number>;
    };
    /**
     * Validate tools configuration
     */
    validateTools(): {
        valid: boolean;
        errors: string[];
    };
}
/**
 * Utility function to create a new tool generator
 */
export declare function createToolGenerator(config: ToolGeneratorConfig): ToolGenerator;
//# sourceMappingURL=tool-generator.d.ts.map