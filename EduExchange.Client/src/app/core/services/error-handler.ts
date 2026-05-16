import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private toast = inject(ToastService);

  handle(error: HttpErrorResponse, fallback = 'Something went wrong. Please try again.'): string {
    let message = fallback;

    if (error.error) {
      if (typeof error.error === 'string') {
        message = error.error;
      } else if (error.error.errors) {
        const validationErrors = Object.values(error.error.errors) as string[][];
        message = validationErrors.flat().join(' ');
      } else if (error.error.title) {
        message = error.error.title;
      } else if (error.error.message) {
        message = error.error.message;
      }
    } else {
      switch (error.status) {
        case 0:   message = 'Cannot connect to server. Is the backend running?'; break;
        case 401: message = 'Session expired. Please log in again.'; break;
        case 403: message = 'You do not have permission to do this.'; break;
        case 404: message = 'Resource not found.'; break;
        case 500: message = 'Server error. Please try again later.'; break;
      }
    }

    this.toast.error(message);
    return message;
  }
}