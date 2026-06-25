import createOrderHandler from './api/create-order.js';
import { EventEmitter } from 'events';

class MockRequest extends EventEmitter {
  constructor() {
    super();
    this.method = 'POST';
    this.url = '/api/create-order';
  }
}

class MockResponse {
  constructor() {
    this.headers = {};
    this.body = '';
    this.statusCode = 200;
  }
  writeHead(status, headers) {
    this.statusCode = status;
    this.headers = { ...this.headers, ...headers };
  }
  end(chunk) {
    if (chunk) this.body += chunk;
    console.log('STATUS:', this.statusCode);
    console.log('HEADERS:', this.headers);
    console.log('BODY:', this.body);
  }
}

async function test() {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_T3TMydmyeqz3fy';
  process.env.RAZORPAY_KEY_SECRET = 'YRgCMLjrMIItjQCQ2HbbD6nh';

  const req = new MockRequest();
  const res = new MockResponse();

  const promise = createOrderHandler(req, res);

  req.emit('data', Buffer.from(JSON.stringify({
    amount: 50000,
    currency: 'INR',
    receipt: 'receipt_test_123'
  })));
  req.emit('end');

  await promise;
}

test().catch(console.error);
