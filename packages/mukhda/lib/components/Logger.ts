export enum LogLevel {
    VERBOSE = 0,
    WARN = 1,
    ERROR = 2
}

export class Logger {
    public static LOG_LEVEL: LogLevel = LogLevel.ERROR;

    private static TAG = (message: string) => console.log("chitrakar:mukhda:debug", message)
    
    private static log(level: LogLevel, message: string = "") {
        if (this.LOG_LEVEL <= level) {
            Logger.TAG(message);
        }
    }

    public static debug(message: string = "") {
        this.log(LogLevel.VERBOSE, message)
    }

    public static warn(message: string = "") {
        this.log(LogLevel.WARN, message)
    }

    public static error(message: string = "") {
        this.log(LogLevel.ERROR, message)
    }
}