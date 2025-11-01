/**
 * Tool Validation Framework
 *
 * Automated testing system for validating tool functionality,
 * performance, and quality standards.
 */
import { Tool } from './tool-generator';
export interface ValidationTest {
    id: string;
    name: string;
    description: string;
    type: 'functional' | 'performance' | 'quality' | 'security' | 'compatibility';
    required: boolean;
}
export interface ValidationResult {
    testId: string;
    passed: boolean;
    score?: number;
    message: string;
    duration: number;
    data?: any;
}
export interface ToolValidationReport {
    toolId: string;
    timestamp: Date;
    overall: {
        passed: boolean;
        score: number;
        duration: number;
    };
    results: ValidationResult[];
    suggestions: string[];
}
export declare class ToolValidator {
    private tests;
    private customValidators;
    constructor();
    /**
     * Initialize default validation tests
     */
    private initializeDefaultTests;
    /**
     * Setup default validation functions
     */
    private setupDefaultValidators;
    /**
     * Add a custom validation test
     */
    addTest(test: ValidationTest, validator: (tool: Tool, testData?: any) => Promise<ValidationResult>): void;
    /**
     * Run all validation tests on a tool
     */
    validateTool(tool: Tool, testIds?: string[]): Promise<ToolValidationReport>;
    /**
     * Run validation on multiple tools
     */
    validateTools(tools: Tool[]): Promise<ToolValidationReport[]>;
    /**
     * Generate validation summary report
     */
    generateSummaryReport(reports: ToolValidationReport[]): {
        overall: {
            passed: number;
            failed: number;
            score: number;
        };
        byType: Record<string, {
            passed: number;
            failed: number;
            averageScore: number;
        }>;
        failedTools: string[];
        suggestions: string[];
    };
    /**
     * Save validation report to file
     */
    saveReport(report: ToolValidationReport, filePath: string): Promise<void>;
    /**
     * Load validation report from file
     */
    loadReport(filePath: string): Promise<ToolValidationReport>;
}
/**
 * Create a new tool validator instance
 */
export declare function createToolValidator(): ToolValidator;
//# sourceMappingURL=tool-validator.d.ts.map