import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatInputModule, MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl:    './login.scss'
})
export class LoginComponent implements OnInit {
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private toast        = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);
  private ngZone       = inject(NgZone);

  email       = '';
  password    = '';
  showPass    = false;
  submitting  = false;
  googleLoading = false;
  
  // Flag to toggle "Forgot Password" link visibility on login failure
  showForgotLink = false;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/discover']);
      return;
    }
    this.initGoogleSignIn();
  }

  // ── Initialize Google One Tap / Button ────────────────────────────────────
  initGoogleSignIn() {
    const tryInit = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback:         (response: any) => this.handleGoogleCallback(response),
          auto_select:      false,
          cancel_on_tap_outside: true
        });

        const container = document.getElementById('google-btn-container');
        let btnWidth = container ? container.clientWidth : 350;
        if (!btnWidth || btnWidth === 0) {
          btnWidth = window.innerWidth < 480 ? window.innerWidth - 72 : 350;
        }
        // Google button width must be between 200 and 400
        btnWidth = Math.max(200, Math.min(btnWidth, 400));

        (window as any).google.accounts.id.renderButton(
          container,
          {
            theme:     'outline',
            size:      'large',
            width:     btnWidth,
            text:      'signin_with',
            shape:     'rectangular',
            logo_alignment: 'left'
          }
        );
      } else {
        setTimeout(tryInit, 300);
      }
    };
    tryInit();
  }

  // ── Called by Google after user picks account ─────────────────────────────
  handleGoogleCallback(response: any) {
    this.ngZone.run(() => {
      this.googleLoading = true;
      this.cdr.detectChanges();

      this.authService.googleSignIn(response.credential).subscribe({
        next: (res: any) => {
          this.authService.saveSession(res);
          this.googleLoading = false;

          if (res.isNewUser) {
            this.toast.success('Welcome to EduExchange! 🎉 Let\'s set up your profile.');
            this.router.navigate(['/profile-setup']);
          } else {
            this.toast.success(`Welcome back, ${res.username}!`);
            this.router.navigate(['/discover']);
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.errorHandler.handle(err, 'Google sign-in failed. Please try again.');
          this.googleLoading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  // ── Regular email/password login ──────────────────────────────────────────
 login() {
  // ... validation ...
  this.submitting = true;
  this.showForgotLink = false; // Hide link on new attempt

  this.authService.login({ email: this.email, password: this.password }).subscribe({
    next: (res: any) => {
    this.authService.saveSession(res);
    this.submitting = false;
    this.router.navigate(['/discover']);
    },
    error: (err: any) => {
      this.submitting = false;
      
      // If error is 401, show the "Forgot Password" link
      if (err.status === 401) {
        this.showForgotLink = true;
      }

      this.errorHandler.handle(err, 'Login failed. Please check your credentials.');
      this.cdr.detectChanges();
    }
  });
}

  // ── Handle Forgot Password Click ──────────────────────────────────────────
  handleForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  togglePassword() { this.showPass = !this.showPass; }
}