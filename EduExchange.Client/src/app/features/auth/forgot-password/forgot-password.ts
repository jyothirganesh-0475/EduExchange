import { Component, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';
import { ErrorHandlerService } from '../../../core/services/error-handler';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent implements OnDestroy {
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private snackBar     = inject(MatSnackBar);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);

  email      = '';
  submitting = false;
  activeAction: 'link' | 'otp' | null = null;

  // ── OTP-mode state ─────────────────────────────────────────────────────────
  otpSent    = false;
  otp        = '';
  verifying  = false;

  // ── Resend cooldown timer ──────────────────────────────────────────────────
  resendCooldown = 0;
  private cooldownInterval: any;

  // ── Link mode: send reset link to email ───────────────────────────────────
  sendResetLink() {
    if (!this.validateEmail()) return;

    this.submitting = true;
    this.activeAction = 'link';
    this.cdr.detectChanges(); // Force UI update to avoid ExpressionChangedAfterItHasBeenCheckedError

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.submitting = false;
        this.activeAction = null;
        this.cdr.detectChanges();
        
        const snackRef = this.snackBar.open(
          '✅ Reset link sent successfully to your email!',
          'OK',
          { duration: 5000, panelClass: ['toast-success'], horizontalPosition: 'right', verticalPosition: 'top' }
        );
        snackRef.onAction().subscribe(() => this.router.navigate(['/login']));
        snackRef.afterDismissed().subscribe(() => this.router.navigate(['/login']));
      },
      error: (err: any) => {
        this.submitting = false;
        this.activeAction = null;
        this.cdr.detectChanges();
        this.errorHandler.handle(err, 'Could not send reset link. Please try again.');
      }
    });
  }

  // ── OTP mode step 1: send OTP code to email ───────────────────────────────
  sendOtpCode() {
    if (!this.validateEmail()) return;

    this.submitting = true;
    this.activeAction = 'otp';
    this.cdr.detectChanges(); // Force UI update

    this.authService.sendOtp(this.email).subscribe({
      next: () => {
        this.submitting = false;
        this.activeAction = null;
        this.otpSent = true;
        this.cdr.detectChanges();
        
        this.showSuccess('OTP sent! Please check your email.');
        this.startCooldown(60);
      },
      error: (err: any) => {
        this.submitting = false;
        this.activeAction = null;
        this.cdr.detectChanges();
        this.errorHandler.handle(err, 'Could not send OTP. Please try again.');
      }
    });
  }

  // ── OTP mode step 2: verify the entered OTP ───────────────────────────────
  verifyOtp() {
    if (!this.otp.trim() || this.otp.length < 4) {
      this.showError('Please enter the OTP sent to your email.');
      return;
    }

    this.verifying = true;
    this.cdr.detectChanges();

    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: (res: any) => {
        this.verifying = false;
        this.cdr.detectChanges();
        // Navigate to reset password page with token
        this.router.navigate(['/reset-password'], {
          queryParams: { email: this.email, token: res.token }
        });
      },
      error: (err: any) => {
        this.verifying = false;
        this.cdr.detectChanges();
        this.errorHandler.handle(err, 'Invalid or expired OTP. Please try again.');
      }
    });
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────
  resendOtp() {
    if (this.resendCooldown > 0) return;
    this.otp = '';
    this.sendOtpCode();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  validateEmail(): boolean {
    if (!this.email.trim()) {
      this.showError('Please enter your email address.');
      return false;
    }
    return true;
  }

  goBack() { this.router.navigate(['/login']); }

  private showError(msg: string) {
    this.snackBar.open(`❌ ${msg}`, 'Close', {
      duration: 3000, panelClass: ['toast-error'],
      horizontalPosition: 'right', verticalPosition: 'top'
    });
  }

  private showSuccess(msg: string) {
    this.snackBar.open(`✅ ${msg}`, 'Close', {
      duration: 3000, panelClass: ['toast-success'],
      horizontalPosition: 'right', verticalPosition: 'top'
    });
  }

  private startCooldown(seconds: number) {
    this.resendCooldown = seconds;
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) this.stopCooldown();
    }, 1000);
  }

  private stopCooldown() {
    this.resendCooldown = 0;
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  ngOnDestroy() { this.stopCooldown(); }
}
