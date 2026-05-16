import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Note {
  noteId:        number;
  title:         string;
  subject:       string;
  academicLevel: string;
  filePath:      string;
  uploaderId:    number;
  categoryId?:   number;
  uploadedAt?:   string;
  uploader?:     { username: string };
  category?:     { categoryName: string };
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/notes`;

  getAll(): Observable<Note[]> {
    return this.http.get<Note[]>(this.url);
  }

  getMyNotes(uploaderId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.url}/mynotes/${uploaderId}`);
  }

  upload(formData: FormData): Observable<Note> {
    return this.http.post<Note>(this.url, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getFileUrl(filePath: string | null | undefined): string | null {
    if (!filePath) return null;
    if (filePath.startsWith('http://') || filePath.startsWith('https://'))
      return filePath;
    return `${environment.apiBase}/${filePath}`;
  }

  downloadNote(note: Note): void {
    const url = this.getFileUrl(note.filePath);
    if (!url) return;
    const filename = note.filePath
      ? note.filePath.split('/').pop() || `${note.title}.pdf`
      : `${note.title}.pdf`;
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.target   = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}