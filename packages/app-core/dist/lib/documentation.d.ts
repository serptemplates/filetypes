/**
 * Documentation Generation System
 *
 * Automatically generates documentation for tools, APIs,
 * and system architecture.
 */
import { Tool } from './tool-generator';
import { ToolRegistryManager } from './tool-registry';
export interface DocumentationSection {
    id: string;
    title: string;
    content: string;
    subsections?: DocumentationSection[];
    metadata?: {
        lastUpdated: Date;
        author?: string;
        version?: string;
    };
}
export interface APIDocumentation {
    endpoint: string;
    method: string;
    description: string;
    parameters?: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    responses?: Array<{
        status: number;
        description: string;
        example?: any;
    }>;
    examples?: Array<{
        title: string;
        request: any;
        response: any;
    }>;
}
export declare class DocumentationGenerator {
    private registryManager;
    private outputDir;
    constructor(registryManager: ToolRegistryManager, outputDir: string);
    /**
     * Generate complete documentation
     */
    generateAllDocumentation(): Promise<void>;
    /**
     * Generate tools documentation
     */
    generateToolsDocumentation(): Promise<void>;
    /**
     * Generate individual tool page
     */
    generateToolPage(tool: Tool, outputDir: string): Promise<void>;
    /**
     * Generate tool markdown content
     */
    private generateToolMarkdown;
    /**
     * Generate tools index page
     */
    generateToolsIndex(tools: Tool[], outputDir: string): Promise<void>;
    /**
     * Generate API documentation
     */
    generateAPIDocumentation(): Promise<void>;
    /**
     * Generate architecture documentation
     */
    generateArchitectureDocumentation(): Promise<void>;
    /**
     * Generate developer guide
     */
    generateDeveloperGuide(): Promise<void>;
    /**
     * Generate user guide
     */
    generateUserGuide(): Promise<void>;
    /**
     * Generate main index page
     */
    generateIndexPage(): Promise<void>;
    /**
     * Get tool category for organization
     */
    private getToolCategory;
}
/**
 * Create documentation generator
 */
export declare function createDocumentationGenerator(registryManager: ToolRegistryManager, outputDir: string): DocumentationGenerator;
//# sourceMappingURL=documentation.d.ts.map