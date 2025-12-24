/**
 * Simple logger utility
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export class Logger {
    private context: string;
    private level: LogLevel;

    constructor(context: string, level: LogLevel = LogLevel.INFO) {
        this.context = context;
        this.level = level;
    }

    debug(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}]`, message, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.INFO) {
            console.log(`[${new Date().toISOString()}] [INFO] [${this.context}]`, message, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}]`, message, ...args);
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}]`, message, ...args);
        }
    }
}
