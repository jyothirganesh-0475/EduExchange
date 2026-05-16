import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';

export interface AppNotification {
  notificationId : number;
  userId         : number;
  message        : string;
  type           : string;
  referenceId?   : number;
  isRead         : boolean;
  createdAt      : string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private url         = `${environment.apiUrl}/notifications`;

  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  private _unreadCount   = new BehaviorSubject<number>(0);

  notifications$ = this._notifications.asObservable();
  unreadCount$   = this._unreadCount.asObservable();

  refresh() {
    const userId = this.authService.getUserId();
    if (!userId || !this.authService.isLoggedIn()) {
      this._notifications.next([]);
      this._unreadCount.next(0);
      return;
    }
    this.http.get<AppNotification[]>(`${this.url}/${userId}`).subscribe({
      next: (data) => {
        this._notifications.next(data);
        this._unreadCount.next(data.filter(n => !n.isRead).length);
      },
      error: () => {}
    });
  }

  markAllRead() {
    const userId = this.authService.getUserId();
    this.http.put(`${this.url}/${userId}/mark-read`, {}).subscribe({
      next: () => {
        const updated = this._notifications.value.map(n => ({ ...n, isRead: true }));
        this._notifications.next(updated);
        this._unreadCount.next(0);
      },
      error: () => {}
    });
  }

  markRead(id: number) {
    this.http.put(`${this.url}/${id}/read`, {}).subscribe({
      next: () => {
        const updated = this._notifications.value.map(n =>
          n.notificationId === id ? { ...n, isRead: true } : n
        );
        this._notifications.next(updated);
        this._unreadCount.next(updated.filter(n => !n.isRead).length);
      },
      error: () => {}
    });
  }

  refreshAfterAction() { this.refresh(); }
}