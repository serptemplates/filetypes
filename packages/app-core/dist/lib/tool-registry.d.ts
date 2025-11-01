/**
 * Tool Registry System
 *
 * Central registry for managing all tools, their configurations,
 * dependencies, and relationships.
 */
import { Tool } from './tool-generator';
export interface ToolDependency {
    toolId: string;
    type: 'conversion' | 'library' | 'worker';
    required: boolean;
}
export interface ToolMetrics {
    usage: number;
    performance: number;
    errors: number;
    lastUpdated: Date;
}
export interface ToolRegistry {
    version: string;
    lastUpdated: Date;
    tools: Record<string, Tool>;
    dependencies: Record<string, ToolDependency[]>;
    categories: Record<string, string[]>;
    metrics: Record<string, ToolMetrics>;
}
export declare class ToolRegistryManager {
    private registryPath;
    private registry;
    constructor(registryPath: string);
    /**
     * Load the tool registry from disk
     */
    loadRegistry(): Promise<ToolRegistry>;
    /**
     * Save the registry to disk
     */
    saveRegistry(): Promise<void>;
    /**
     * Register a new tool
     */
    registerTool(tool: Tool): Promise<void>;
    /**
     * Update an existing tool
     */
    updateTool(toolId: string, updates: Partial<Tool>): Promise<void>;
    /**
     * Get tool by ID
     */
    getTool(toolId: string): Promise<Tool | null>;
    /**
     * Get all tools
     */
    getAllTools(): Promise<Tool[]>;
    /**
     * Get tools by category
     */
    getToolsByCategory(category: string): Promise<Tool[]>;
    /**
     * Search tools by query
     */
    searchTools(query: string): Promise<Tool[]>;
    /**
     * Get tool dependencies
     */
    getToolDependencies(toolId: string): Promise<ToolDependency[]>;
    /**
     * Add dependency between tools
     */
    addDependency(toolId: string, dependency: ToolDependency): Promise<void>;
    /**
     * Update tool metrics
     */
    updateMetrics(toolId: string, metrics: Partial<ToolMetrics>): Promise<void>;
    /**
     * Get tool metrics
     */
    getMetrics(toolId: string): Promise<ToolMetrics | null>;
    /**
     * Get registry statistics
     */
    getRegistryStats(): Promise<{
        totalTools: number;
        activeTools: number;
        categoryCounts: Record<string, number>;
        topUsedTools: Array<{
            toolId: string;
            usage: number;
        }>;
        recentlyUpdated: Tool[];
    }>;
    /**
     * Validate registry integrity
     */
    validateRegistry(): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Auto-categorize a tool based on its properties
     */
    private categorizeTool;
}
/**
 * Create a tool registry manager instance
 */
export declare function createRegistryManager(registryPath: string): ToolRegistryManager;
//# sourceMappingURL=tool-registry.d.ts.map