import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // 1. Initial Redirect
  { path: '', redirectTo: 'discover', pathMatch: 'full' },

  // 2. Authentication
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(m => m.RegisterComponent)
  },
  { 
    path: 'profile-setup',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/profile-setup/profile-setup').then(m => m.ProfileSetupComponent)
  },

  // 3. Main Discovery & Category Filtering
  // All three of these now use the BookListComponent but pass different data modes
  { 
    path: 'discover', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/books/book-list/book-list').then(m => m.BookListComponent),
    data: { mode: 'all' } 
  },
  {
  path: 'books-search',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/books/books-search/books-search')
      .then(m => m.BooksSearchComponent)
},
  { 
    path: 'books', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/books/book-list/book-list').then(m => m.BookListComponent),
    data: { mode: 'books' } 
  },

  // 4. Book Details & Actions
  {
    path: 'books/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-detail/book-detail').then(m => m.BookDetailComponent)
  },
  {
    path: 'add-book',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-form/book-form').then(m => m.BookFormComponent)
  },
  {
    path: 'edit-book/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-form/book-form').then(m => m.BookFormComponent)
  },

  // 5. Notes (If you want Notes to have its own page, keep this. 
  // If you want Notes to use the same "Discover" style, point it to BookListComponent with data: {mode: 'notes'})
  {
    path: 'notes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notes/notes-list/notes-list').then(m => m.NotesListComponent)
  },
  {
    path: 'upload-note',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notes/upload-note/upload-note').then(m => m.UploadNoteComponent)
  },

  // 6. Items (Same logic as Notes)
  { 
    path: 'items',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-list/item-list').then(m => m.ItemListComponent) 
  },
  { 
    path: 'items/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-detail/item-detail').then(m => m.ItemDetailComponent) 
  },
  { 
    path: 'add-item',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-form/item-form').then(m => m.ItemFormComponent) 
  },
  { 
    path: 'edit-item/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-form/item-form').then(m => m.ItemFormComponent) 
  },

  // 7. Exchanges
  {
    path: 'exchange',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/exchange/exchange-list/exchange-list').then(m => m.ExchangeListComponent)
  },

  // 8. My Assets (User's private listings)
  {
    path: 'my-books',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/my-books/my-books').then(m => m.MyBooksComponent)
  },
  {
    path: 'my-notes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notes/my-notes/my-notes').then(m => m.MyNotesComponent)
  },
  {
    path: 'my-items',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/my-items/my-items').then(m => m.MyItemsComponent)
  },

  // 9. Wildcard
  { path: '**', redirectTo: 'discover' }
];