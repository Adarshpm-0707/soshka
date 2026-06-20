import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import createOrderHandler from './api/create-order.js'
import verifyPaymentHandler from './api/verify-payment.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');

  // Populate process.env so backend functions can access credentials
  process.env.RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;

  return {
    plugins: [
      react(),
      {
        name: 'razorpay-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            console.log(`[Dev Server Middleware] Incoming request: ${req.method} ${req.url}`);
            if (req.url.startsWith('/api/create-order')) {
              try {
                await createOrderHandler(req, res);
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            if (req.url.startsWith('/api/verify-payment')) {
              try {
                await verifyPaymentHandler(req, res);
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
      open: true
    }
  };
})
