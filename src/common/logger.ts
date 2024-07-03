import envPaths from 'env-paths'
import { join } from 'path'
import * as winston from 'winston'

import { replacer } from './utils'

/**
 * Winston Base Log Levels for NPM
 * {
 *    error: 0,
 *    warn: 1,
 *    info: 2,
 *    http: 3,
 *    verbose: 4,
 *    debug: 5,
 *    silly: 6
 * }
 */


export class EntropyLogger {
  protected context: string
  protected endpoint: string
  private winstonLogger: winston.Logger

  constructor (context: string, endpoint: string) {
    this.context = context
    this.endpoint = endpoint

    let format = winston.format.combine(
      // Add timestamp key: { timestamp: 'YYYY-MM-DD HH:mm:ss.SSS' }
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      // If message is instanceof Error, log Error's message property and stack
      winston.format.errors({ stack: true }),
      // Allows for string interpolation tokens '%s' in message with splat key values
      // Ex. { message: 'my message %s', splat: ['test'] } -> { message: 'my message test' }
      winston.format.splat(),
      // Uses safe-stable-stringify to finalize full object message as string
      // (prevents circular references from crashing)
      winston.format.json({ replacer: replacer }),
    );

    if (process.env.NODE_ENV === 'test') {
      format = winston.format.combine(
        format,
        winston.format.colorize({ level: true }),
        winston.format.printf(info => {
          let message = typeof info.message === 'object' ? JSON.stringify(info.message) : info.message;
          if (info.stack) {
            message = `${message}\n${info.stack}`;
          }
          return `${info.level}: ${message}`;
        }),
      );
    }
    const paths = envPaths('entropy-cryptography', { suffix: '' })
    const DEBUG_PATH = join(paths.log, 'entropy-cli.debug.log')
    const ERROR_PATH = join(paths.log, 'entropy-cli.error.log')
    const INFO_PATH = join(paths.log, 'entropy-cli.info.log')
    const VERBOSE_PATH = join(paths.log, 'entropy-cli.verbose.log')

    this.winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL,
      format,
      defaultMeta: { service: 'Entropy CLI' },
      transports: [
        new winston.transports.File({ filename: VERBOSE_PATH }),
        new winston.transports.File({
          level: 'error',
          filename: ERROR_PATH
        }),
        new winston.transports.File({
          level: 'info',
          filename: INFO_PATH
        }),
        new winston.transports.File({
          level: 'debug',
          filename: DEBUG_PATH,
        }),
      ],
    })

    // If env var is set then stream logs to console as well as a file
    if (process.env.DEBUG) {
      this.winstonLogger.add(new winston.transports.Console({
        format: winston.format.cli()
      }))
    }
  }

  // maps to winston:error
  public error (description: string, error: Error): void {
    this.writeLogMsg('error', error?.message, this.context, description, error.stack);
  }

  // maps to winston:info
  public log (message: any, context?: string): void {
    this.writeLogMsg('info', message, context);
  }

  // maps to winston:warn
  public warn (message: any, context?: string): void {
    this.writeLogMsg('warn', message, context);
  }

  // maps to winston:debug
  public debug (message: any, context?: string): void {
    this.writeLogMsg('debug', message, context);
  }

  // maps to winston:verbose
  public verbose (message: any, context?: string): void {
    this.writeLogMsg('verbose', message, context);
  }

  protected writeLogMsg (level: string, message: any, context?: string, description?: string, stack?: string) {
    this.winstonLogger.log({
      level,
      message,
      context: context || this.context,
      endpoint: this.endpoint,
      description,
      stack,
    });
  }

}
