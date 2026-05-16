import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ItemService, Item } from '../../../core/services/item';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatInputModule
  ],
  templateUrl: './item-detail.html',
  styleUrl:    './item-detail.scss'
})
export class ItemDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private itemService  = inject(ItemService);
  private authService  = inject(AuthService);
  private toast        = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);

  item            : Item | null = null;
  showRequestForm = false;
  requestMessage  = '';
  requesting      = false;
  isOwner         = false;

  private currentUserId = this.authService.getUserId();

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) {
        this.router.navigate(['/items']);
        return;
      }
      this.loadItem(id);
    });
  }

  loadItem(id: number) {
    this.item = null;
    this.itemService.getById(id).subscribe({
      next: item => {
        this.item    = item;
        this.isOwner = item.ownerId === this.currentUserId;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorHandler.handle(err, 'Item not found.');
        this.router.navigate(['/items']);
      }
    });
  }

  toggleRequestForm() {
    if (this.isOwner) {
      this.toast.error('You cannot request your own item.');
      return;
    }
    this.showRequestForm = !this.showRequestForm;
    if (!this.showRequestForm) this.requestMessage = '';
  }

  sendRequest() {
    if (this.isOwner) {
      this.toast.error('You cannot request your own item.');
      return;
    }
    if (!this.item) return;

    this.requesting = true;
    // requesterId removed — server reads from JWT
    this.itemService.createRequest({
      itemId:  this.item.itemId,
      message: this.requestMessage
    }).subscribe({
      next: () => {
        this.toast.success('Request sent successfully! 🎉');
        this.showRequestForm = false;
        this.requestMessage  = '';
        this.requesting      = false;
      },
      error: (err) => {
        this.errorHandler.handle(err, 'Failed to send request.');
        this.requesting = false;
      }
    });
  }

  openWhatsApp() {
    if (!this.item?.contactNumber) {
      this.toast.error('No contact number available.');
      return;
    }
    const number = this.item.contactNumber.replace(/\D/g, '');
    const phone  = number.startsWith('91') ? number : `91${number}`;
    const msg    = encodeURIComponent(
      `Hi! I saw your listing "${this.item.name}" on EduExchange and I'm interested.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  getImageUrl(path: string | null | undefined): string {
    return this.itemService.getImageUrl(path ?? null);
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Scientific Calculator': '🧮',
      'Casio Calculator':      '🔢',
      'Drafter':               '📐',
      'Geometric Box':         '📏',
      'Compass Set':           '🧭',
      'Lab Equipment':         '🔬',
      'Other':                 '📦'
    };
    return icons[type] || '📦';
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/default-item.svg';
  }
}