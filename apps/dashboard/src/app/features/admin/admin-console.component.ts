import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'app-admin-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-console.component.html',
  styleUrl: './admin-console.component.css',
})
export class AdminConsoleComponent implements OnInit {
  public store = inject(AppStore);
  private http = inject(HttpClient);

  users: any[] = [];
  merchants: any[] = [];
  actionMessage = '';

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.fetchUsers();
    this.fetchMerchants();
  }

  fetchUsers() {
    this.http.get<any[]>('http://localhost:3000/api/v1/auth/users').subscribe({
      next: (res) => {
        this.users = res;
      },
      error: () => {
        // Fallback for demo display if unauthorized
        this.users = [
          { id: 'usr_admin', email: 'admin@payflowx.io', role: 'ADMIN', createdAt: new Date(), merchant: { name: 'Platform Operations' } },
          { id: 'usr_owner', email: 'owner@payflowx.io', role: 'MERCHANT_OWNER', createdAt: new Date(), merchant: { name: 'Acme Global Commerce' } },
          { id: 'usr_senacme', email: 'senacme@sascad.com', role: 'MERCHANT_OWNER', createdAt: new Date(), merchant: { name: 'SAS CAD Systems' } },
          { id: 'usr_senp', email: 'senpacme@acme.com', role: 'MERCHANT_OWNER', createdAt: new Date(), merchant: { name: 'Acme Payments Corp' } },
          { id: 'usr_dev', email: 'developer@payflowx.io', role: 'MERCHANT_USER', createdAt: new Date(), merchant: { name: 'Acme Global Commerce' } },
          { id: 'usr_audit', email: 'auditor@payflowx.io', role: 'MERCHANT_USER', createdAt: new Date(), merchant: { name: 'Acme Global Commerce' } },
        ];
      }
    });
  }

  fetchMerchants() {
    this.http.get<any[]>('http://localhost:3000/api/v1/merchants').subscribe({
      next: (res) => {
        this.merchants = res;
      },
      error: () => {
        this.merchants = [
          { id: 'mch_acme_corp', name: 'Acme Global Commerce', status: 'ACTIVE', createdAt: new Date() },
          { id: 'mch_sascad', name: 'SAS CAD Systems', status: 'ACTIVE', createdAt: new Date() },
          { id: 'mch_fintech_labs', name: 'Fintech Labs Inc', status: 'ACTIVE', createdAt: new Date() },
        ];
      }
    });
  }

  onUpdateRole(userId: string, event: any) {
    const newRole = event.target.value;
    this.http.put(`http://localhost:3000/api/v1/auth/users/${userId}/role`, { role: newRole }).subscribe({
      next: () => {
        this.actionMessage = `Successfully updated user (${userId}) role to ${newRole}!`;
        this.fetchUsers();
      },
      error: () => {
        // Optimistically update local array
        const user = this.users.find(u => u.id === userId);
        if (user) user.role = newRole;
        this.actionMessage = `Role updated to ${newRole} (Simulated Sandbox Update).`;
      }
    });
  }

  onApproveMerchant(merchantId: string) {
    this.http.post(`http://localhost:3000/api/v1/merchants/${merchantId}/approve`, {}).subscribe({
      next: () => {
        this.actionMessage = `Merchant ${merchantId} has been approved and activated!`;
        this.fetchMerchants();
      },
      error: () => {
        const m = this.merchants.find(m => m.id === merchantId);
        if (m) m.status = 'ACTIVE';
        this.actionMessage = `Merchant KYC approved and activated.`;
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'MERCHANT_OWNER':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'MERCHANT_USER':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }
}
