import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import createOrderHandler from './api/create-order.js'
import verifyPaymentHandler from './api/verify-payment.js'
import contactHandler from './api/contact.js'
import shiprocketPickupHandler from './api/shiprocket-pickup.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');

  // Populate process.env so backend functions can access credentials
  process.env.RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;
  process.env.SMTP_HOST = env.SMTP_HOST;
  process.env.SMTP_PORT = env.SMTP_PORT;
  process.env.SMTP_USER = env.SMTP_USER;
  process.env.SMTP_PASS = env.SMTP_PASS;
  process.env.SMTP_TO = env.SMTP_TO;
  process.env.SHIPROCKET_EMAIL = env.SHIPROCKET_EMAIL;
  process.env.SHIPROCKET_PASSWORD = env.SHIPROCKET_PASSWORD;
  process.env.SHIPROCKET_PICKUP_LOCATION = env.SHIPROCKET_PICKUP_LOCATION;

  return {
    plugins: [
      react(),
      {
        name: 'custom-api-middleware',
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
            if (req.url.startsWith('/api/contact')) {
              try {
                await contactHandler(req, res);
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            if (req.url.startsWith('/api/shiprocket-pickup')) {
              try {
                await shiprocketPickupHandler(req, res);
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
