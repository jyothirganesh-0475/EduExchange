import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token  = localStorage.getItem('token');

  // BUG FIX 3 — check token expiry BEFORE sending request
  if (token && isTokenExpired(token)) {
    localStorage.clear();
    router.navigate(['/login']);
    return throwError(() => new Error('Token expired'));
  }

  // Attach token to request
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // BUG FIX 3 — catch 401 from server and auto-logout
      if (error.status === 401) {
        localStorage.clear();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

// Helper — decode JWT and check exp claim
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch {
    // If token is malformed, treat as expired
    return true;
  }
}