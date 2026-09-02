import { UserRole } from '../types';

const STORAGE_ROLE_KEY = 'eletromidia_user_role';
const STORAGE_LEADER_PIN_KEY = 'eletromidia_leader_pin';
const STORAGE_LEADER_AUTH_SESSION_KEY = 'eletromidia_leader_auth_session';

const DEFAULT_PIN = '1234';

type AuthListener = (role: UserRole) => void;

class AuthService {
  private listeners: AuthListener[] = [];

  constructor() {
    // Ensure default role is saved if none exists
    if (!localStorage.getItem(STORAGE_ROLE_KEY)) {
      localStorage.setItem(STORAGE_ROLE_KEY, 'tecnico');
    }
  }

  public getRole(): UserRole {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY);
    return (saved === 'lider' || saved === 'tecnico') ? saved : 'tecnico';
  }

  public isLeader(): boolean {
    return this.getRole() === 'lider';
  }

  public isTechnician(): boolean {
    return this.getRole() === 'tecnico';
  }

  public getStoredPin(): string {
    return localStorage.getItem(STORAGE_LEADER_PIN_KEY) || DEFAULT_PIN;
  }

  public setLeaderPin(newPin: string): boolean {
    if (!newPin || newPin.length < 4) return false;
    localStorage.setItem(STORAGE_LEADER_PIN_KEY, newPin);
    return true;
  }

  public verifyLeaderPin(enteredPin: string): boolean {
    const correctPin = this.getStoredPin();
    return enteredPin.trim() === correctPin.trim();
  }

  public loginAsLeader(pin: string): { success: boolean; error?: string } {
    if (this.verifyLeaderPin(pin)) {
      localStorage.setItem(STORAGE_ROLE_KEY, 'lider');
      sessionStorage.setItem(STORAGE_LEADER_AUTH_SESSION_KEY, 'true');
      this.notifyListeners('lider');
      return { success: true };
    }
    return { success: false, error: 'Senha/PIN de Líder incorreto.' };
  }

  public logoutToTechnician(): void {
    localStorage.setItem(STORAGE_ROLE_KEY, 'tecnico');
    sessionStorage.removeItem(STORAGE_LEADER_AUTH_SESSION_KEY);
    this.notifyListeners('tecnico');
  }

  public setRoleDirectly(role: UserRole): void {
    localStorage.setItem(STORAGE_ROLE_KEY, role);
    this.notifyListeners(role);
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(role: UserRole): void {
    this.listeners.forEach((l) => {
      try {
        l(role);
      } catch (e) {
        console.error('Error notifying auth listener:', e);
      }
    });
  }
}

export const authService = new AuthService();
