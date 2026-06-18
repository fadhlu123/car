import mongoose from 'mongoose';
import { env } from './env.config';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('database');

class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 5;
  private readonly initialRetryDelay: number = 1000;
  // Named connections — one per module database (auto-majid-users, auto-majid-inventory, etc.)
  private readonly namedConnections: Map<string, mongoose.Connection> = new Map();

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      this.isConnected = false;
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      logger.info('MongoDB reconnected');
    });
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    try {
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4,                          
        serverSelectionTimeoutMS: 30000,
        retryWrites: true,
        retryReads: true,
      };

      await mongoose.connect(env.MONGODB_URI, options);
      this.isConnected = true;
    } catch (error: any) {
      logger.error('Failed to connect to MongoDB:', error);
      await this.handleConnectionFailure();
      throw error;
    }
  }

  private async handleConnectionFailure(): Promise<void> {
    this.connectionAttempts++;

    if (this.connectionAttempts <= this.maxRetries) {
      const delay = this.initialRetryDelay * Math.pow(2, this.connectionAttempts - 1);
      logger.warn(`Retrying MongoDB connection in ${delay}ms (attempt ${this.connectionAttempts}/${this.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.connect();
    } else {
      logger.error('Maximum MongoDB connection retries exceeded');
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      for (const [dbName, conn] of this.namedConnections) {
        await conn.close();
        logger.info(`Closed connection to module database: ${dbName}`);
      }
      this.namedConnections.clear();

      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
      }

      logger.info('All database connections closed gracefully');
    } catch (error: any) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<{ status: string; latency?: number }> {
    if (!this.isConnected || ! mongoose.connection.db) {
      return { status: 'disconnected' };
    }

    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error:any) {
      logger.error('MongoDB health check failed:', error);
      return { status: 'unhealthy' };
    }
  }

  public getConnectionState(): string {
    return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  }

  public async withTransaction<T>(
    operation: (session: mongoose.ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  public isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Returns a cached named connection for a module database.
  // Each module calls this with its own DB name (e.g. 'auto-majid-users').
  public async getConnection(dbName: string): Promise<mongoose.Connection> {
    const cached = this.namedConnections.get(dbName);
    if (cached && cached.readyState === 1) return cached;

    const conn = await mongoose.createConnection(this.buildUri(dbName), {
      maxPoolSize: 10,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      family: 4,
    }).asPromise();

    this.namedConnections.set(dbName, conn);
    logger.info(`Connected to module database: ${dbName}`);
    return conn;
  }

  // Open all known module DB connections at startup so no request ever
  // pays the cold-connect penalty.
  public async warmUp(dbNames: string[]): Promise<void> {
    await Promise.all(dbNames.map((name) => this.getConnection(name)));
    logger.info('All module databases warmed up', { databases: dbNames });
    this.startHeartbeat(dbNames);
  }

  // Ping all named connections every 20 seconds to prevent Atlas M0 idle timeout
  // (Atlas M0 drops connections idle for >30s).
  private startHeartbeat(dbNames: string[]): void {
    setInterval(async () => {
      for (const name of dbNames) {
        const conn = this.namedConnections.get(name);
        if (conn && conn.readyState === 1 && conn.db) {
          try {
            await conn.db.admin().ping();
          } catch {
            // Connection dropped — remove so next getConnection() re-creates it
            this.namedConnections.delete(name);
            logger.warn(`Heartbeat lost for ${name}, will reconnect on next request`);
          }
        }
      }
    }, 20_000);
  }

  // Replaces the database name segment in the Atlas URI.
  // e.g. .../car_dealership -> .../auto-majid-users
  private buildUri(dbName: string): string {
    return env.MONGODB_URI.replace(/\/([^/?]*)(\?|$)/, `/${dbName}$2`);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing MongoDB connection...');
  await DatabaseManager.getInstance().disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing MongoDB connection...');
  await DatabaseManager.getInstance().disconnect();
  process.exit(0);
});


export const databaseManager = DatabaseManager.getInstance();