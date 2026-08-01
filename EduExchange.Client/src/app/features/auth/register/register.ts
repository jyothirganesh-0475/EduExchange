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
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatInputModule, MatIconModule
  ],
  templateUrl: './register.html',
  styleUrl:    './register.scss'
})
export class RegisterComponent implements OnInit {
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private toast        = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);
  private ngZone       = inject(NgZone);

  username     = '';
  email        = '';
  password     = '';
  showPass     = false;
  submitting   = false;
  googleLoading = false;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/discover']);
      return;
    }
    this.initGoogleSignUp();
  }

  // ── Initialize Google Button ───────────────────────────────────────────────
  initGoogleSignUp() {
    const tryInit = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          // ✅ AFTER — from environment
          client_id: environment.googleClientId,
          callback:    (response: any) => this.handleGoogleCallback(response),
          auto_select: false
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signup-container'),
          {
            theme:          'outline',
            size:           'large',
            width:          '100%',
            text:           'signup_with',   // shows "Sign up with Google"
            shape:          'rectangular',
            logo_alignment: 'left'
          }
        );
      } else {
        setTimeout(tryInit, 300);
      }
    };
    tryInit();
  }

  // ── Google callback — same flow as login (creates account if new) ─────────
  handleGoogleCallback(response: any) {
    this.ngZone.run(() => {
      this.googleLoading = true;
      this.cdr.detectChanges();

      this.authService.googleSignIn(response.credential).subscribe({
        next: (res: any) => {
          this.authService.saveSession(res);
          this.googleLoading = false;

          // Always go to profile setup from register page
          this.toast.success('Account created! 🎉 Let\'s set up your profile.');
          this.router.navigate(['/profile-setup']);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.errorHandler.handle(err, 'Google sign-up failed. Please try again.');
          this.googleLoading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  // ── Regular registration ───────────────────────────────────────────────────
  register() {
    if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.toast.error('Please fill in all fields.');
      return;
    }
    if (this.password.length < 6) {
      this.toast.error('Password must be at least 6 characters.');
      return;
    }

    this.submitting = true;
    this.authService.register({
      username: this.username,
      email:    this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.toast.success('Account created! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.errorHandler.handle(err, 'Registration failed.');
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePassword() { this.showPass = !this.showPass; }
}