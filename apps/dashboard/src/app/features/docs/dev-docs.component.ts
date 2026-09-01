import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dev-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dev-docs.component.html',
  styleUrl: './dev-docs.component.css',
})
export class DevDocsComponent {
  selectedLanguage: 'curl' | 'node' | 'python' = 'curl';

  curlSnippet = `curl -X POST http://localhost:3000/api/v1/payments \\
  -H "Authorization: Bearer sk_live_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 99.00,
    "currency": "USD",
    "paymentMethod": {
      "type": "card",
      "card": {
        "number": "4242424242424242",
        "expiryMonth": 12,
        "expiryYear": 2028,
        "cvc": "123"
      }
    }
  }'`;

  nodeSnippet = `import axios from 'axios';

const createCharge = async () => {
  const response = await axios.post('http://localhost:3000/api/v1/payments', {
    amount: 99.00,
    currency: 'USD',
    paymentMethod: {
      type: 'card',
      card: {
        number: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2028,
        cvc: '123'
      }
    }
  }, {
    headers: {
      Authorization: \`Bearer \${process.env.PAYFLOWX_SECRET_KEY}\`
    }
  });

  console.log('Payment Succeeded:', response.data);
};`;

  pythonSnippet = `import requests
import os

url = "http://localhost:3000/api/v1/payments"
headers = {
    "Authorization": f"Bearer {os.getenv('PAYFLOWX_SECRET_KEY')}",
    "Content-Type": "application/json"
}
payload = {
    "amount": 99.00,
    "currency": "USD",
    "paymentMethod": {
        "type": "card",
        "card": {
            "number": "4242424242424242",
            "expiryMonth": 12,
            "expiryYear": 2028,
            "cvc": "123"
        }
    }
}

response = requests.post(url, json=payload, headers=headers)
print("Response:", response.json())`;

  webhookSnippet = `// Node.js Express HMAC Verification Example
import crypto from 'crypto';

app.post('/payflowx-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-payflowx-signature'];
  const webhookSecret = process.env.PAYFLOWX_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid webhook signature');
  }

  const event = JSON.parse(req.body.toString());
  if (event.type === 'payment.succeeded') {
    console.log('Payment Succeeded for Intent:', event.data.id);
  }

  res.status(200).send({ received: true });
});`;
}
