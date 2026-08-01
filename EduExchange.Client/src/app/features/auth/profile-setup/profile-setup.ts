import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatIconModule
  ],
  templateUrl: './profile-setup.html',
  styleUrl:    './profile-setup.scss'
})
export class ProfileSetupComponent implements OnInit {
  private router      = inject(Router);
  private authService = inject(AuthService);
  private http        = inject(HttpClient);
  private toast       = inject(ToastService);

  username       = this.authService.getUsername();
  email          = this.authService.getEmail();
  profilePicture = this.authService.getProfilePicture();
  submitting     = false;

  profile = {
    educationLevel: '',
    city:           '',
    fullName:       ''
  };

  levels = [
    'School (Class 1–8)', 'School (Class 9–10)', 'School (Class 11–12)',
    'Undergraduate', 'Masters', 'PhD', 'Diploma', 'Other'
  ];

  ngOnInit() {
    // BUG FIX 2 — redirect to login if not authenticated
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Pre-fill from localStorage if already saved
    const saved = this.authService.getUserProfile();
    if (saved && saved.fullName)       this.profile.fullName       = saved.fullName;
    if (saved?.educationLevel) this.profile.educationLevel = saved.educationLevel;
    if (saved?.city)           this.profile.city           = saved.city;
  }

  skip() {
    this.router.navigate(['/discover']);
  }

  save() {
    if (!this.profile.educationLevel) {
      this.toast.error('Please select your education level.');
      return;
    }

    this.submitting = true;
    const userId = this.authService.getUserId();

    // BUG FIX 1 — save to localStorage immediately before API call
    this.authService.saveProfile({
      fullName:       this.profile.fullName,
      educationLevel: this.profile.educationLevel,
      city:           this.profile.city,
      about:          ''
    });

    // Also save to backend
    this.http.put(`${environment.apiUrl}/users/${userId}/profile`, {
      fullName:       this.profile.fullName,
      educationLevel: this.profile.educationLevel,
      city:           this.profile.city
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('Profile saved! Welcome to EduExchange 🎉');
        this.router.navigate(['/discover']);
      },
      error: () => {
        // localStorage already saved above — safe to proceed
        this.submitting = false;
        this.toast.success('Welcome to EduExchange 🎉');
        this.router.navigate(['/discover']);
      }
    });
  }
}