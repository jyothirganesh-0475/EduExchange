import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;
  private baseUrl = environment.apiUrl.replace('/api', '');

  register(data: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  // Inside your AuthService class

// ── Forgot Password Request ──────────────────────────────────────────
forgotPassword(email: string) {
  return this.http.post(`${this.apiUrl}/forgot-password`, { email });
}

// ── Reset Password Request ──────────────────────────────────────────
resetPassword(data: any) {
  return this.http.post(`${this.apiUrl}/reset-password`, data);
}

// ── Send OTP to email ──────────────────────────────────────────────
sendOtp(email: string) {
  return this.http.post(`${this.apiUrl}/send-otp`, { email });
}

// ── Verify OTP → returns { token } for reset-password page ────────
verifyOtp(email: string, otp: string) {
  return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
}

  googleSignIn(idToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/google`, { idToken });
  }

  saveSession(response: any): void {
  localStorage.setItem('token',    response.token);
  localStorage.setItem('userId',   response.userId.toString());
  localStorage.setItem('username', response.username);
  localStorage.setItem('email',    response.email);

  if (response.profilePicture)
    localStorage.setItem('profilePicture', response.profilePicture);

  // Save ALL profile fields so they survive logout/login
  const existing = localStorage.getItem('userProfile');
  const profile  = existing ? JSON.parse(existing) : {};

  if (response.fullName)       profile.fullName       = response.fullName;
  if (response.educationLevel) profile.educationLevel = response.educationLevel;
  if (response.city)           profile.city           = response.city;
  if (response.about)          profile.about          = response.about;

  localStorage.setItem('userProfile', JSON.stringify(profile));
}

  isLoggedIn(): boolean { return !!localStorage.getItem('token'); }

  getToken():    string | null { return localStorage.getItem('token'); }
  getUserId():   number        { return parseInt(localStorage.getItem('userId') || '0'); }
  getUsername(): string        { return localStorage.getItem('username') || ''; }
  getEmail():    string        { return localStorage.getItem('email') || ''; }
  getProfilePicture(): string | null { return localStorage.getItem('profilePicture'); }

  getUserProfile(): any {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : null;
  }

  saveProfile(profile: { fullName: string; educationLevel: string; city: string; about: string }): void {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  updateProfileOnServer(userId: number, profile: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/${userId}/profile`, profile);
  }

  logout(): void {
    localStorage.clear();
    if ((window as any).google?.accounts?.id)
      (window as any).google.accounts.id.disableAutoSelect();
    this.router.navigate(['/login']);
  }
}