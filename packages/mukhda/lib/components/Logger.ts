export enum LogLevel {
    VERBOSE = 0,
    WARN = 1,
    ERROR = 2
}

export class Logger {
    public static LOG_LEVEL: LogLevel = LogLevel.ERROR;

    private static TAG = (...args: any[]) => console.log("chitrakar:mukhda:debug", ...args)
    
    private static log(level: LogLevel, ...args: any[]) {
        if (this.LOG_LEVEL <= level) {
            Logger.TAG(...args);
        }
    }

    public static debug(...args: any[]) {
        this.log(LogLevel.VERBOSE, ...args)
    }

    public static warn(...args: any[]) {
        this.log(LogLevel.WARN, ...args)
    }

    public static error(...args: any[]) {
        this.log(LogLevel.ERROR, ...args)
    }
}