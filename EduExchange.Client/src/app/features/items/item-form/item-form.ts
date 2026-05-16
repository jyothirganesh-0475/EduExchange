import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ItemService } from '../../../core/services/item';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatIconModule
  ],
  templateUrl: './item-form.html',
  styleUrl: './item-form.scss'
})
export class ItemFormComponent implements OnInit {
  private itemService  = inject(ItemService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private route        = inject(ActivatedRoute);
  private toast        = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);

  isEditMode    = false;
  itemId        : number | null = null;
  selectedImage : File | null   = null;
  imagePreview  : string | null = null;
  submitting    = false;

  // ownerId removed — server reads it from JWT
  item = {
    name:          '',
    description:   '',
    itemType:      '',
    condition:     '',
    status:        'Available',
    contactNumber: ''
  };

  itemTypes  = [
    'Scientific Calculator', 'Casio Calculator', 'Drafter',
    'Geometric Box', 'Compass Set', 'Lab Equipment', 'Other'
  ];
  conditions = ['New', 'Like New', 'Good', 'Acceptable', 'Worn'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.itemId     = +id;
      this.itemService.getById(+id).subscribe({
        next: (data) => {
          // Block non-owners from editing via direct URL
          if (data.ownerId !== this.authService.getUserId()) {
            this.toast.error('You are not authorized to edit this item.');
            this.router.navigate(['/items']);
            return;
          }
          // ownerId removed — not needed client-side
          this.item = {
            name:          data.name,
            description:   data.description   || '',
            itemType:      data.itemType,
            condition:     data.condition      || '',
            status:        data.status,
            contactNumber: data.contactNumber  || ''
          };
          if (data.imagePath)
            this.imagePreview = this.itemService.getImageUrl(data.imagePath);
          this.cdr.detectChanges();
        },
        error: (err) => this.errorHandler.handle(err, 'Failed to load item.')
      });
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview  = null;
  }

  submit() {
    if (!this.item.name.trim()) {
      this.toast.error('Please enter the item name!');
      return;
    }
    if (!this.item.itemType) {
      this.toast.error('Please select the item type!');
      return;
    }
    if (!this.item.contactNumber.trim()) {
      this.toast.error('Please enter a contact number!');
      return;
    }

    this.submitting = true;

    if (this.isEditMode && this.itemId) {
      // Update — send as JSON, no ownerId needed
      this.itemService.update(this.itemId, this.item).subscribe({
        next: () => {
          this.toast.success('Item updated successfully!');
          this.router.navigate(['/my-items']);
        },
        error: (err) => {
          this.errorHandler.handle(err, 'Failed to update item.');
          this.submitting = false;
        }
      });
    } else {
      // Create — send as FormData, no ownerId appended
      const fd = new FormData();
      fd.append('name',          this.item.name);
      fd.append('description',   this.item.description);
      fd.append('itemType',      this.item.itemType);
      fd.append('condition',     this.item.condition);
      fd.append('contactNumber', this.item.contactNumber);
      if (this.selectedImage)
        fd.append('image', this.selectedImage);

      this.itemService.create(fd).subscribe({
        next: () => {
          this.toast.success('Item listed successfully!');
          this.router.navigate(['/my-items']);
        },
        error: (err) => {
          this.errorHandler.handle(err, 'Failed to list item.');
          this.submitting = false;
        }
      });
    }
  }
}