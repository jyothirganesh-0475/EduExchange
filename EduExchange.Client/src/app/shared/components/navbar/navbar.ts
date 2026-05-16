import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { NotificationService, AppNotification } from '../../../core/services/notification';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatToolbarModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService          = inject(AuthService);
  private router       = inject(Router);
  private notifService = inject(NotificationService);
  private http = inject(HttpClient);

  profileOpen   = false;
  menuOpen      = false;
  editMode      = false;
  notifOpen     = false;
  assetsOpen    = false;
  exchangesOpen = false;
  exchangeOpen  = false;

  unreadCount   : number = 0;
  notifications : AppNotification[] = [];

  profilePicture : string | null = null;
  profile  = { fullName: '', educationLevel: '', city: '', about: '' };
  editData = { fullName: '', educationLevel: '', city: '', about: '' };
  levels   = ['School', 'Undergraduate', 'Masters', 'PhD'];

  private countSub : Subscription | null = null;
  private notifSub : Subscription | null = null;
  private routeSub : Subscription | null = null;

  ngOnInit() {
    this.loadProfile();

    this.countSub = this.notifService.unreadCount$.subscribe(c => this.unreadCount = c);
    this.notifSub = this.notifService.notifications$.subscribe(n => this.notifications = n);

    this.routeSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.menuOpen      = false;
      this.profileOpen   = false;
      this.notifOpen     = false;
      this.assetsOpen    = false;
      this.exchangesOpen = false;
      if (this.authService.isLoggedIn()) this.notifService.refresh();
    });

    if (this.authService.isLoggedIn()) this.notifService.refresh();
  }

  ngOnDestroy() {
    this.countSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  // ── Exchanges dropdown ─────────────────────────────────────────────────────
  toggleExchanges(event: Event) {
    event.stopPropagation();
    this.exchangesOpen = !this.exchangesOpen;
    this.assetsOpen    = false;   // ← close My Assets
    this.profileOpen   = false;
    this.notifOpen     = false;
  }

  navigateExchange(tab: string) {
    this.exchangesOpen = false;
    this.assetsOpen    = false;
    if (tab === 'sent' || tab === 'received') {
      this.router.navigate(['/exchange'], { queryParams: { tab } });
    } else {
      this.router.navigate(['/exchange']);
    }
  }

  // ── My Assets dropdown ─────────────────────────────────────────────────────
  toggleAssets(event: Event) {
    event.stopPropagation();
    this.assetsOpen    = !this.assetsOpen;
    this.exchangesOpen = false;   // ← close Exchanges
    this.profileOpen   = false;
    this.notifOpen     = false;
  }

  navigateAsset(route: string) {
    this.assetsOpen    = false;
    this.exchangesOpen = false;
    this.router.navigate([route]);
  }

  // ── Notification bell ──────────────────────────────────────────────────────
  toggleNotif(event: Event) {
    event.stopPropagation();
    this.notifOpen   = !this.notifOpen;
    this.profileOpen = false;
    this.menuOpen    = false;
    this.assetsOpen  = false;
    if (this.notifOpen && this.unreadCount > 0) this.notifService.markAllRead();
  }

  handleNotifClick(event: Event, notif: AppNotification) {
  event.stopPropagation();
  this.notifOpen = false;
  if (!notif.isRead) this.notifService.markRead(notif.notificationId);

  // ✅ Use n.type instead of parsing message text
  if (notif.type === 'item') {
    const msg = notif.message.toLowerCase();
    if (msg.includes('approved') || msg.includes('rejected') || msg.includes('completed')) {
      this.router.navigate(['/exchange'], { queryParams: { tab: 'sent' } });
    } else {
      this.router.navigate(['/exchange'], { queryParams: { tab: 'received' } });
    }
  } else {
    // type === 'exchange'
    const msg = notif.message.toLowerCase();
    if (msg.includes('approved') || msg.includes('rejected') || msg.includes('completed')) {
      this.router.navigate(['/exchange'], { queryParams: { tab: 'sent' } });
    } else {
      this.router.navigate(['/exchange'], { queryParams: { tab: 'received' } });
    }
  }
}

  goToExchange(event: Event) {
    event.stopPropagation();
    this.notifOpen = false;
    this.router.navigate(['/exchange']);
  }
loadProfile() {
  this.profilePicture = localStorage.getItem('profilePicture');

  // Load from localStorage immediately
  const saved = localStorage.getItem('userProfile');
  if (saved) this.profile = JSON.parse(saved);

  // Fetch fresh from server on every load
  if (this.authService.isLoggedIn()) {
    const userId = this.authService.getUserId();
    this.http.get<any>(`${environment.apiUrl}/users/${userId}`).subscribe({
      next: (user) => {
        // Update all fields from server
        this.profile = {
          fullName:       user.fullName       || '',
          educationLevel: user.educationLevel || '',
          city:           user.city           || '',
          about:          user.about          || ''
        };

        if (user.profilePicture)
          this.profilePicture = user.profilePicture;

        // Save back to localStorage
        localStorage.setItem('userProfile',    JSON.stringify(this.profile));
        localStorage.setItem('profilePicture', user.profilePicture || '');
      },
      error: () => {}
    });
  }
}

  toggleProfile(event: Event) {
    event.stopPropagation();
    this.profileOpen = !this.profileOpen;
    this.notifOpen   = false;
    this.assetsOpen  = false;
  }

  closeProfile()             { this.profileOpen = false; }
  onPanelClick(event: Event) { event.stopPropagation(); }

  @HostListener('document:click')
  onDocumentClick() {
    this.profileOpen   = false;
    this.menuOpen      = false;
    this.notifOpen     = false;
    this.assetsOpen    = false;
    this.exchangesOpen = false;
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen   = !this.menuOpen;
    this.notifOpen  = false;
    this.assetsOpen = false;
    if (this.menuOpen) this.profileOpen = false;
  }

  closeMenu() { this.menuOpen = false; }

  startEdit()  { this.editData = { ...this.profile }; this.editMode = true; }
  cancelEdit() { this.editMode = false; }


saveProfile() {
  this.profile = { ...this.editData };

  // Save to localStorage
  localStorage.setItem('userProfile', JSON.stringify(this.profile));

  // Save ALL fields to server
  const userId = this.authService.getUserId();
  this.http.put(`${environment.apiUrl}/users/${userId}/profile`, {
    fullName:       this.editData.fullName,
    educationLevel: this.editData.educationLevel,
    city:           this.editData.city,
    about:          this.editData.about
  }).subscribe({
    next: () => {},
    error: () => {}
  });

  this.editMode = false;
}

  getInitials(): string {
    return (this.authService.getUsername() || '').slice(0, 2).toUpperCase();
  }

  onProfileImgError(event: Event) {
    this.profilePicture = null;
    (event.target as HTMLImageElement).style.display = 'none';
  }

  logout() {
    this.profileOpen = false;
    this.menuOpen    = false;
    this.notifOpen   = false;
    this.assetsOpen  = false;
    this.authService.logout();
  }

  timeAgo(dateStr: string): string {
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}