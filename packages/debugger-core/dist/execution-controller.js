"use strict";
/**
 * Execution Controller
 * Controls query execution flow with pause/resume capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionController = void 0;
const eventemitter3_1 = require("eventemitter3");
const uuid_1 = require("uuid");
class ExecutionController extends eventemitter3_1.EventEmitter {
    constructor(breakpointManager, sessionManager) {
        super();
        this.breakpointManager = breakpointManager;
        this.sessionManager = sessionManager;
        this.executionMode = new Map();
        this.executionHistory = new Map();
        this.pendingExecutions = new Map();
    }
    /**
     * Execute a query with debug instrumentation
     */
    async executeQuery(sessionId, query, parameters = []) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const queryId = (0, uuid_1.v4)();
        const execution = {
            queryId,
            sql: query,
            parameters,
            startTime: new Date(),
            status: 'running',
        };
        this.pendingExecutions.set(queryId, execution);
        this.emit('queryStarted', execution);
        try {
            // Execute with instrumentation at each stage
            await this.execWithInstrumentation(session.id, queryId, query, parameters);
            execution.status = 'completed';
            execution.endTime = new Date();
            execution.duration =
                execution.endTime.getTime() - execution.startTime.getTime();
            // Update session metadata
            this.sessionManager.updateSessionMetadata(sessionId, {
                totalQueries: session.metadata.totalQueries + 1,
                totalExecutionTime: session.metadata.totalExecutionTime + execution.duration,
            });
            this.emit('queryCompleted', execution);
            // For now, return mock result
            // In production, this would return actual query results
            return {
                rows: [],
                rowCount: 0,
                fields: [],
            };
        }
        catch (error) {
            execution.status = 'failed';
            execution.error = error;
            this.emit('queryFailed', execution, error);
            throw error;
        }
        finally {
            this.pendingExecutions.delete(queryId);
        }
    }
    /**
     * Execute with instrumentation at each stage
     */
    async execWithInstrumentation(sessionId, queryId, query, parameters) {
        const stages = [
            'parse',
            'analyze',
            'rewrite',
            'plan',
            'execute',
            'complete',
        ];
        for (const stage of stages) {
            // Create execution point
            const execPoint = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                queryId,
                stage,
            };
            // Record in history
            this.recordExecutionPoint(sessionId, execPoint);
            // Create execution context
            const context = {
                sessionId,
                queryId,
                query,
                parameters,
                startTime: new Date(),
                userId: this.sessionManager.getSession(sessionId).userId,
                connectionId: this.sessionManager.getSession(sessionId).connectionId,
                executionPoint: execPoint,
                variables: new Map(),
            };
            // Check breakpoints
            const breakpoint = await this.breakpointManager.shouldBreak(context);
            if (breakpoint) {
                await this.pause(sessionId, execPoint, 'breakpoint', {
                    breakpoint,
                    context,
                });
            }
            // Emit stage event
            this.emit('queryStage', {
                sessionId,
                queryId,
                stage,
                timestamp: new Date(),
            });
            // Simulate stage execution
            await this.simulateStageExecution(stage);
        }
    }
    /**
     * Simulate stage execution (placeholder for actual execution)
     */
    async simulateStageExecution(stage) {
        // In production, this would call the actual database execution
        // For now, just a small delay to simulate work
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    /**
     * Pause execution
     */
    async pause(sessionId, executionPoint, reason, details) {
        this.executionMode.set(sessionId, 'paused');
        this.sessionManager.pauseSession(sessionId);
        this.sessionManager.updateSessionState(sessionId, {
            currentExecutionPoint: executionPoint,
        });
        this.emit('paused', {
            sessionId,
            reason,
            executionPoint,
            details,
        });
        // Wait until resumed
        await this.waitForResume(sessionId);
    }
    /**
     * Resume execution
     */
    resume(sessionId) {
        this.executionMode.set(sessionId, 'running');
        this.sessionManager.resumeSession(sessionId);
        this.emit('resumed', { sessionId });
    }
    /**
     * Step over (execute to next statement)
     */
    async stepOver(sessionId) {
        this.executionMode.set(sessionId, 'stepping');
        this.sessionManager.updateSessionState(sessionId, { status: 'running' });
        this.emit('stepped', { sessionId, stepType: 'over' });
        // Will automatically pause at next execution point
    }
    /**
     * Step into (enter procedure/function)
     */
    async stepInto(sessionId) {
        this.executionMode.set(sessionId, 'stepping');
        this.emit('stepped', { sessionId, stepType: 'into' });
    }
    /**
     * Step out (exit current procedure/function)
     */
    async stepOut(sessionId) {
        this.executionMode.set(sessionId, 'stepping');
        this.emit('stepped', { sessionId, stepType: 'out' });
    }
    /**
     * Wait for resume signal
     */
    waitForResume(sessionId) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const mode = this.executionMode.get(sessionId);
                if (mode === 'running' || mode === 'stepping') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    /**
     * Record execution point in history
     */
    recordExecutionPoint(sessionId, point) {
        if (!this.executionHistory.has(sessionId)) {
            this.executionHistory.set(sessionId, []);
        }
        const history = this.executionHistory.get(sessionId);
        history.push(point);
        // Limit history size
        const session = this.sessionManager.getSession(sessionId);
        if (session && history.length > session.config.maxHistorySize) {
            history.shift(); // Remove oldest
        }
    }
    /**
     * Get execution history
     */
    getExecutionHistory(sessionId) {
        return this.executionHistory.get(sessionId) || [];
    }
    /**
     * Get current execution point
     */
    getCurrentExecutionPoint(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        return session?.state.currentExecutionPoint;
    }
    /**
     * Get active queries
     */
    getActiveQueries() {
        return Array.from(this.pendingExecutions.values());
    }
    /**
     * Clear history for session
     */
    clearHistory(sessionId) {
        this.executionHistory.delete(sessionId);
        this.executionMode.delete(sessionId);
    }
}
exports.ExecutionController = ExecutionController;
