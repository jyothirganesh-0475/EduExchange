import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Global Loading Service
 *
 * Uses an activeRequests counter so concurrent API calls don't race:
 * – show() increments the counter
 * – hide() decrements the counter
 * – isLoading$ emits true while counter > 0, false when it hits 0
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {

  private activeRequests = 0;
  private readonly _loading$ = new BehaviorSubject<boolean>(false);

  /** Observable that consumers can subscribe to (navbar, progress bar, etc.) */
  readonly isLoading$ = this._loading$.asObservable().pipe(distinctUntilChanged());

  show(): void {
    this.activeRequests++;
    this._loading$.next(true);
  }

  hide(): void {
    this.activeRequests = Math.max(this.activeRequests - 1, 0);
    if (this.activeRequests === 0) {
      this._loading$.next(false);
    }
  }

  /** Force-reset (useful when navigating away mid-request) */
  reset(): void {
    this.activeRequests = 0;
    this._loading$.next(false);
  }
}
