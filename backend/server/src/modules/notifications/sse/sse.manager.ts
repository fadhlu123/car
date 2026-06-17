import { Response } from 'express';
import { createLogger } from '../../../utils/logger.utils';

const logger = createLogger('sse-manager');

// Each userId/adminId can have multiple active connections (multiple browser tabs).
// We store a Set<Response> per ID so pushes fan out to all of them.

class SSEManager {
  private readonly users  = new Map<string, Set<Response>>();
  private readonly admins = new Map<string, Set<Response>>();

  // Subscribe a response to the SSE stream for a given ID.
  // Returns a cleanup function — call it on 'close' to remove the connection.
  subscribe(id: string, res: Response, isAdmin: boolean): () => void {
    const map = isAdmin ? this.admins : this.users;
    if (!map.has(id)) map.set(id, new Set());
    map.get(id)!.add(res);

    logger.debug(`SSE ${isAdmin ? 'admin' : 'user'} connected`, { id, total: map.size });

    // Keep-alive comment every 25 s — prevents proxies from closing idle connections
    const ping = setInterval(() => {
      try { res.write(':ping\n\n'); }
      catch { cleanup(); }
    }, 25_000);

    const cleanup = () => {
      clearInterval(ping);
      const set = map.get(id);
      if (set) {
        set.delete(res);
        if (set.size === 0) map.delete(id);
      }
      logger.debug(`SSE ${isAdmin ? 'admin' : 'user'} disconnected`, { id });
    };

    return cleanup;
  }

  private emit(res: Response, event: string, data: unknown): void {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // The socket already closed — ping interval will clean it up on the next tick
    }
  }

  pushToUser(userId: string, event: string, data: unknown): void {
    const conns = this.users.get(userId);
    if (!conns) return;
    for (const res of conns) this.emit(res, event, data);
  }

  pushToAdmin(adminId: string, event: string, data: unknown): void {
    const conns = this.admins.get(adminId);
    if (!conns) return;
    for (const res of conns) this.emit(res, event, data);
  }

  broadcastToAllUsers(event: string, data: unknown): void {
    for (const conns of this.users.values())
      for (const res of conns) this.emit(res, event, data);
  }

  pushToAllAdmins(event: string, data: unknown): void {
    for (const conns of this.admins.values())
      for (const res of conns) this.emit(res, event, data);
  }

  get connectedUsers():  number { return this.users.size; }
  get connectedAdmins(): number { return this.admins.size; }
}

// Singleton — one registry per process
export const sseManager = new SSEManager();
