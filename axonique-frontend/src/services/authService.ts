// authService.ts — Utility for handling JWT tokens and authenticated requests

const TOKEN_KEY = 'axonique_token';
const USER_KEY = 'axonique_user';

export interface UserInfo {
    username: string;
    email: string;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

export const authService = {
    saveAuth(token: string, user: UserInfo) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser(): UserInfo | null {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    getRole(): string | null {
        const user = this.getUser();
        return user ? user.role : null;
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    getAuthHeader(): Record<string, string> {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};
