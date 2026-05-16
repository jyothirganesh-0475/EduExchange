import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Book {
  bookId:        number;
  title:         string;
  author:        string;
  subject:       string;
  academicLevel: string;
  condition:     string;
  status:        string;
  imagePath:     string;
  contactNumber?: string;
  ownerId:       number;
  categoryId:    number;
  owner?:        { username: string; };
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/books`;

  getAll(level?: string, search?: string, excludeOwner?: number): Observable<Book[]> {
    let params = new HttpParams();
    if (level)        params = params.set('level', level);
    if (search)       params = params.set('search', search);
    if (excludeOwner) params = params.set('excludeOwner', excludeOwner.toString());
    return this.http.get<Book[]>(this.url, { params });
  }

  getMyBooks(ownerId: number): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.url}/mybooks/${ownerId}`);
  }

  getById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.url}/${id}`);
  }

  create(book: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(this.url, book);
  }

  createWithImage(formData: FormData): Observable<Book> {
    return this.http.post<Book>(`${this.url}/with-image`, formData);
  }

  update(id: number, book: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.url}/${id}`, book);
  }

  updateWithImage(id: number, formData: FormData): Observable<Book> {
    return this.http.put<Book>(`${this.url}/${id}/with-image`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return 'assets/default-book.svg';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://'))
      return imagePath;
    return `${environment.apiBase}/${imagePath}`;
  }
}