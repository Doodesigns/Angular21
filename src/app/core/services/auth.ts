import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest } from '../models/user.model';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'currentUser';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<AuthUser | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${environment.apiBaseUrl}/auth/login`, {
        ...credentials,
        expiresInMins: credentials.expiresInMins ?? 30,
      })
      .pipe(
        tap((user) => {
          localStorage.setItem(TOKEN_KEY, user.accessToken);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.currentUserSignal.set(user);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
}
