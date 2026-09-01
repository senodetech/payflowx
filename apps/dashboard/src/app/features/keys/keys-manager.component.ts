import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'app-keys-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keys-manager.component.html',
  styleUrl: './keys-manager.component.css',
})
export class KeysManagerComponent implements OnInit {
  public store = inject(AppStore);
  private http = inject(HttpClient);

  isRotating = false;
  rotatedKeys: { publicKey: string; secretKey: string } | null = null;
  copiedText = false;

  ngOnInit() {
    this.fetchKeys();
  }

  fetchKeys() {
    this.http.get<any[]>('http://localhost:3000/api/v1/keys').subscribe({
      next: (res) => {
        this.store.setKeys(res);
      },
    });
  }

  onRotateKeys() {
    this.isRotating = true;
    this.rotatedKeys = null;
    this.copiedText = false;

    this.http.post<any>('http://localhost:3000/api/v1/keys/rotate', {}).subscribe({
      next: (res) => {
        this.rotatedKeys = res;
        
        // Save plain secret key in localStorage for sandbox dashboard charge testing
        localStorage.setItem('secretKey', res.secretKey);
        
        this.fetchKeys();
        this.isRotating = false;
      },
      error: () => {
        this.isRotating = false;
      },
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.copiedText = true;
    setTimeout(() => (this.copiedText = false), 2000);
  }
}
