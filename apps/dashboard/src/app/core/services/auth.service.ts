import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppStore } from '../store/app.store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private store = inject(AppStore);
  private apiUrl = 'http://localhost:3000/api/v1/auth';

  register(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, payload);
  }

  login(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, payload).pipe(
      tap((res) => {
        this.store.setAuth(res.user, res.accessToken);
      }),
    );
  }

  logout(): Observable<any> {
    // If the server clears cookies or requires token, the authInterceptor will attach it
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.store.clearAuth();
      }),
    );
  }
}
