/**
 * Tool Generation System
 *
 * This module provides utilities for automatically generating tool pages,
 * configurations, and related files from the central tools registry.
 */
import fs from 'fs/promises';
import path from 'path';
import toolsData from '../data/tools.json';
import { createRegistryManager } from './tool-registry.js';
export class ToolGenerator {
    tools;
    config;
    constructor(config) {
        this.tools = toolsData;
        this.config = config;
    }
    /**
     * Load tools from registry
     */
    async loadToolsFromRegistry() {
        const registryManager = createRegistryManager(this.config.registryPath || '/tmp/tool-registry.json');
        this.tools = await registryManager.getAllTools();
    }
    /**
     * Generate all tool pages based on the tools registry
     */
    async generateAllTools() {
        // Load tools from registry
        await this.loadToolsFromRegistry();
        console.log(`Generating ${this.tools.length} tool pages...`);
        for (const tool of this.tools.filter(t => t.isActive)) {
            await this.generateTool(tool);
        }
        console.log('Tool generation complete!');
    }
    /**
     * Generate a single tool page
     */
    async generateTool(tool) {
        const toolDir = path.join(this.config.outputDir, tool.route);
        // Check if tool already exists and skip if configured
        if (this.config.skipExisting) {
            try {
                await fs.access(path.join(toolDir, 'page.tsx'));
                console.log(`Skipping existing tool: ${tool.id}`);
                return;
            }
            catch {
                // Tool doesn't exist, continue with generation
            }
        }
        // Ensure directory exists
        await fs.mkdir(toolDir, { recursive: true });
        // Generate page.tsx
        await this.generatePageFile(tool, toolDir);
        // Generate metadata if needed
        await this.generateMetadata(tool, toolDir);
        console.log(`Generated tool page: ${tool.id} -> ${tool.route}`);
    }
    /**
     * Generate the main page.tsx file for a tool
     */
    async generatePageFile(tool, toolDir) {
        const pageContent = this.generatePageTemplate(tool);
        await fs.writeFile(path.join(toolDir, 'page.tsx'), pageContent);
    }
    /**
     * Generate page template content
     */
    generatePageTemplate(tool) {
        const pascalName = this.toPascalCase(tool.id);
        const title = tool.name || `${tool.from?.toUpperCase()} to ${tool.to?.toUpperCase()}`;
        const subtitle = tool.description || `Convert ${tool.from?.toUpperCase()} files to ${tool.to?.toUpperCase()} format`;
        return `"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { toolContent } from '@/lib/tool-content';

export default function ${pascalName}Page() {
  const content = toolContent["${tool.id}"];

  if (!content) {
    // Fallback to HeroConverter for tools without content
    return (
      <LanderHeroTwoColumn
        title="${title}"
        subtitle="${subtitle}"
        from="${tool.from || ''}"
        to="${tool.to || ''}"
      />
    );
  }

  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      useTwoColumnLayout={true}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}
`;
    }
    /**
     * Generate metadata file if needed
     */
    async generateMetadata(tool, toolDir) {
        // For now, metadata is handled in the page.tsx
        // Could be expanded to separate files if needed
    }
    /**
     * Convert tool ID to PascalCase for component names
     */
    toPascalCase(str) {
        return str
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    /**
     * Get statistics about tools
     */
    getToolStats() {
        const active = this.tools.filter(t => t.isActive);
        const byOperation = {};
        const byFormat = {};
        for (const tool of active) {
            byOperation[tool.operation] = (byOperation[tool.operation] || 0) + 1;
            if (tool.from) {
                byFormat[tool.from] = (byFormat[tool.from] || 0) + 1;
            }
            if (tool.to) {
                byFormat[tool.to] = (byFormat[tool.to] || 0) + 1;
            }
        }
        return {
            total: this.tools.length,
            active: active.length,
            byOperation,
            byFormat
        };
    }
    /**
     * Validate tools configuration
     */
    validateTools() {
        const errors = [];
        const routes = new Set();
        for (const tool of this.tools) {
            // Check for duplicate routes
            if (routes.has(tool.route)) {
                errors.push(`Duplicate route: ${tool.route} (${tool.id})`);
            }
            routes.add(tool.route);
            // Check required fields
            if (!tool.id || !tool.name || !tool.description) {
                errors.push(`Missing required fields in tool: ${tool.id}`);
            }
            // Check route format
            if (!tool.route.startsWith('/')) {
                errors.push(`Invalid route format: ${tool.route} (${tool.id})`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
/**
 * Utility function to create a new tool generator
 */
export function createToolGenerator(config) {
    return new ToolGenerator(config);
}
//# sourceMappingURL=tool-generator.js.map