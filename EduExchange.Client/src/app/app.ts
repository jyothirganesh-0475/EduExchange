import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { NotificationService } from './core/services/notification';
import { AuthService } from './core/services/auth';
import { LoadingService } from './core/services/loading.service';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  title      = 'EduExchange';
  showNavbar = false;

  readonly loadingService = inject(LoadingService);

  private pollSub   : Subscription | null = null;
  private routeSub1 : Subscription | null = null;
  private routeSub2 : Subscription | null = null;
  private routeLoadSub : Subscription | null = null;

  constructor(
    private router       : Router,
    private notifService : NotificationService,
    private authService  : AuthService
  ) {}

  ngOnInit() {
    // ── Global route-change loader ─────────────────────────────────────────
    this.routeLoadSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingService.show();
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loadingService.hide();
      }
    });

    // Show/hide navbar based on route
    this.routeSub1 = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(event => {
      const e = event as NavigationEnd;
      const hiddenRoutes = ['/login', '/register', '/profile-setup', '/reset-password'];
      this.showNavbar = !hiddenRoutes.includes(e.urlAfterRedirects);
    });

    // Start polling if already logged in
    if (this.authService.isLoggedIn()) {
      this.notifService.refresh();
      this.startPolling();
    }

    // Re-start polling after login, stop after logout
    this.routeSub2 = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.authService.isLoggedIn() && !this.pollSub) {
        this.notifService.refresh();
        this.startPolling();
      }
      if (!this.authService.isLoggedIn()) {
        this.stopPolling();
      }
    });
  }

  private startPolling() {
    this.stopPolling();
    this.pollSub = interval(30_000).subscribe(() => {
      if (this.authService.isLoggedIn())
        this.notifService.refresh();
    });
  }

  private stopPolling() {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  ngOnDestroy() {
    this.stopPolling();
    this.routeSub1?.unsubscribe();
    this.routeSub2?.unsubscribe();
    this.routeLoadSub?.unsubscribe();
  }
}