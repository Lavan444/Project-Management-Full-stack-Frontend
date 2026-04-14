import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

// Use your backend URL (usually http://localhost:5000)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        const token = getToken();
        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        this.socket.on('connect', () => console.log('? Real-time connected'));
        this.socket.on('disconnect', () => console.log('? Real-time disconnected'));
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    getSocket() {
        return this.socket;
    }

    joinProject(projectId: string) {
        this.socket?.emit('join_project', projectId);
    }

    leaveProject(projectId: string) {
        this.socket?.emit('leave_project', projectId);
    }
}

export const socketService = new SocketService();
