import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private toast       = inject(ToastService);

  email           = '';
  token           = '';
  newPassword     = '';
  confirmPassword = '';
  submitting      = false;
  showPass        = false;
  showConfirm     = false;

  // ── Password strength checks ──────────────────────────────────────────────
  get hasUpperCase(): boolean { return /[A-Z]/.test(this.newPassword); }
  get hasNumber():    boolean { return /[0-9]/.test(this.newPassword); }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    if (!this.token || !this.email) {
      this.toast.error('Invalid or expired reset link.');
      this.router.navigate(['/login']);
    }
  }

  togglePass()    { this.showPass    = !this.showPass; }
  toggleConfirm() { this.showConfirm = !this.showConfirm; }

  onSubmit() {
    if (this.newPassword.length < 6) {
      this.toast.error('Password must be at least 6 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('Passwords do not match. Please try again.');
      return;
    }

    this.submitting = true;

    this.authService.resetPassword({
      email:       this.email,
      token:       this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('Password updated successfully! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.submitting = false;
        this.toast.error('Failed to reset password. The link may have expired.');
      }
    });
  }
}