/**
 * Tool Registry System
 *
 * Central registry for managing all tools, their configurations,
 * dependencies, and relationships.
 */
import fs from 'fs/promises';
export class ToolRegistryManager {
    registryPath;
    registry = null;
    constructor(registryPath) {
        this.registryPath = registryPath;
    }
    /**
     * Load the tool registry from disk
     */
    async loadRegistry() {
        if (this.registry) {
            return this.registry;
        }
        try {
            const content = await fs.readFile(this.registryPath, 'utf-8');
            this.registry = JSON.parse(content);
            return this.registry;
        }
        catch (error) {
            // Create new registry if file doesn't exist
            this.registry = {
                version: '1.0.0',
                lastUpdated: new Date(),
                tools: {},
                dependencies: {},
                categories: {},
                metrics: {}
            };
            await this.saveRegistry();
            return this.registry;
        }
    }
    /**
     * Save the registry to disk
     */
    async saveRegistry() {
        if (!this.registry) {
            throw new Error('No registry loaded');
        }
        this.registry.lastUpdated = new Date();
        const content = JSON.stringify(this.registry, null, 2);
        await fs.writeFile(this.registryPath, content);
    }
    /**
     * Register a new tool
     */
    async registerTool(tool) {
        const registry = await this.loadRegistry();
        registry.tools[tool.id] = tool;
        // Initialize metrics
        registry.metrics[tool.id] = {
            usage: 0,
            performance: 0,
            errors: 0,
            lastUpdated: new Date()
        };
        // Auto-categorize tool
        await this.categorizeTool(tool);
        await this.saveRegistry();
    }
    /**
     * Update an existing tool
     */
    async updateTool(toolId, updates) {
        const registry = await this.loadRegistry();
        if (!registry.tools[toolId]) {
            throw new Error(`Tool ${toolId} not found in registry`);
        }
        registry.tools[toolId] = { ...registry.tools[toolId], ...updates };
        // Update metrics timestamp
        if (registry.metrics[toolId]) {
            registry.metrics[toolId].lastUpdated = new Date();
        }
        await this.saveRegistry();
    }
    /**
     * Get tool by ID
     */
    async getTool(toolId) {
        const registry = await this.loadRegistry();
        return registry.tools[toolId] || null;
    }
    /**
     * Get all tools
     */
    async getAllTools() {
        const registry = await this.loadRegistry();
        return Object.values(registry.tools);
    }
    /**
     * Get tools by category
     */
    async getToolsByCategory(category) {
        const registry = await this.loadRegistry();
        const toolIds = registry.categories[category] || [];
        return toolIds.map(id => registry.tools[id]).filter((tool) => tool !== undefined);
    }
    /**
     * Search tools by query
     */
    async searchTools(query) {
        const registry = await this.loadRegistry();
        const lowercaseQuery = query.toLowerCase();
        return Object.values(registry.tools).filter(tool => {
            return (tool.name.toLowerCase().includes(lowercaseQuery) ||
                tool.description.toLowerCase().includes(lowercaseQuery) ||
                tool.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
                tool.from?.toLowerCase().includes(lowercaseQuery) ||
                tool.to?.toLowerCase().includes(lowercaseQuery));
        });
    }
    /**
     * Get tool dependencies
     */
    async getToolDependencies(toolId) {
        const registry = await this.loadRegistry();
        return registry.dependencies[toolId] || [];
    }
    /**
     * Add dependency between tools
     */
    async addDependency(toolId, dependency) {
        const registry = await this.loadRegistry();
        if (!registry.dependencies[toolId]) {
            registry.dependencies[toolId] = [];
        }
        // Check for existing dependency
        const existing = registry.dependencies[toolId].find(d => d.toolId === dependency.toolId);
        if (existing) {
            Object.assign(existing, dependency);
        }
        else {
            registry.dependencies[toolId].push(dependency);
        }
        await this.saveRegistry();
    }
    /**
     * Update tool metrics
     */
    async updateMetrics(toolId, metrics) {
        const registry = await this.loadRegistry();
        if (!registry.metrics[toolId]) {
            registry.metrics[toolId] = {
                usage: 0,
                performance: 0,
                errors: 0,
                lastUpdated: new Date()
            };
        }
        Object.assign(registry.metrics[toolId], metrics);
        registry.metrics[toolId].lastUpdated = new Date();
        await this.saveRegistry();
    }
    /**
     * Get tool metrics
     */
    async getMetrics(toolId) {
        const registry = await this.loadRegistry();
        return registry.metrics[toolId] || null;
    }
    /**
     * Get registry statistics
     */
    async getRegistryStats() {
        const registry = await this.loadRegistry();
        const tools = Object.values(registry.tools);
        const activeTools = tools.filter(t => t.isActive);
        // Count tools by category
        const categoryCounts = {};
        for (const [category, toolIds] of Object.entries(registry.categories)) {
            categoryCounts[category] = toolIds.length;
        }
        // Get top used tools
        const toolsWithUsage = Object.entries(registry.metrics)
            .map(([toolId, metrics]) => ({ toolId, usage: metrics.usage }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 10);
        // Get recently updated tools
        const recentlyUpdated = Object.values(registry.tools)
            .sort((a, b) => {
            const aMetrics = registry.metrics[a.id];
            const bMetrics = registry.metrics[b.id];
            if (!aMetrics || !bMetrics)
                return 0;
            return new Date(bMetrics.lastUpdated).getTime() - new Date(aMetrics.lastUpdated).getTime();
        })
            .slice(0, 10);
        return {
            totalTools: tools.length,
            activeTools: activeTools.length,
            categoryCounts,
            topUsedTools: toolsWithUsage,
            recentlyUpdated
        };
    }
    /**
     * Validate registry integrity
     */
    async validateRegistry() {
        const registry = await this.loadRegistry();
        const errors = [];
        // Check for orphaned dependencies
        for (const [toolId, deps] of Object.entries(registry.dependencies)) {
            if (!registry.tools[toolId]) {
                errors.push(`Tool ${toolId} has dependencies but is not in registry`);
            }
            for (const dep of deps) {
                if (!registry.tools[dep.toolId]) {
                    errors.push(`Tool ${toolId} depends on missing tool ${dep.toolId}`);
                }
            }
        }
        // Check for orphaned metrics
        for (const toolId of Object.keys(registry.metrics)) {
            if (!registry.tools[toolId]) {
                errors.push(`Metrics exist for missing tool ${toolId}`);
            }
        }
        // Check category consistency
        for (const [category, toolIds] of Object.entries(registry.categories)) {
            for (const toolId of toolIds) {
                if (!registry.tools[toolId]) {
                    errors.push(`Category ${category} references missing tool ${toolId}`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Auto-categorize a tool based on its properties
     */
    async categorizeTool(tool) {
        const registry = await this.loadRegistry();
        // Determine category based on formats and operation
        let category = 'Other Tools';
        if (tool.operation === 'convert') {
            if (tool.from && tool.to) {
                // Categorize by format type
                const imageFormats = ['jpg', 'png', 'gif', 'bmp', 'svg', 'webp', 'heic', 'heif', 'ico', 'tiff'];
                const videoFormats = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'mpeg'];
                const audioFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma'];
                const docFormats = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
                if (imageFormats.includes(tool.from) || imageFormats.includes(tool.to)) {
                    category = 'Image Formats';
                }
                else if (videoFormats.includes(tool.from) || videoFormats.includes(tool.to)) {
                    category = 'Video Formats';
                }
                else if (audioFormats.includes(tool.from) || audioFormats.includes(tool.to)) {
                    category = 'Audio Formats';
                }
                else if (docFormats.includes(tool.from) || docFormats.includes(tool.to)) {
                    category = 'Document Formats';
                }
            }
        }
        else if (tool.operation === 'compress') {
            category = 'Compression Tools';
        }
        // Add tool to category
        if (!registry.categories[category]) {
            registry.categories[category] = [];
        }
        const categoryTools = registry.categories[category];
        if (categoryTools && !categoryTools.includes(tool.id)) {
            categoryTools.push(tool.id);
        }
    }
}
/**
 * Create a tool registry manager instance
 */
export function createRegistryManager(registryPath) {
    return new ToolRegistryManager(registryPath);
}
//# sourceMappingURL=tool-registry.js.map