import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay" *ngIf="loading">
      <div class="spinner-wrap">
        <div class="spinner-ring"></div>
        <p class="spinner-text">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      width: 100%;
    }

    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .spinner-ring {
      width: 52px;
      height: 52px;
      border: 4px solid rgba(108, 99, 255, 0.15);
      border-top-color: #6c63ff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-text {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #636e72;
      margin: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {
  @Input() loading = false;
  @Input() message = 'Loading...';
}