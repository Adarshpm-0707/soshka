import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import createOrderHandler from './api/create-order.js'
import verifyPaymentHandler from './api/verify-payment.js'
import contactHandler from './api/contact.js'
import shiprocketPickupHandler from './api/shiprocket-pickup.js'
import sendOrderConfirmationHandler from './api/send-order-confirmation.js'
import checkEtaHandler from './api/check-eta.js'

// Trigger dev server middleware reload to refresh ES modules (email fallback prioritization update)
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
  process.env.SHIPROCKET_CHANNEL_ID = env.SHIPROCKET_CHANNEL_ID;

  return {
    plugins: [
      react(),
      {
        name: 'custom-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url ? req.url.split('?')[0] : '';
            if (url.startsWith('/api/')) {
              console.log(`[Dev Server Middleware] Incoming request: ${req.method} ${req.url}`);
              try {
                if (url.startsWith('/api/create-order')) {
                  await createOrderHandler(req, res);
                  return;
                }
                if (url.startsWith('/api/verify-payment')) {
                  await verifyPaymentHandler(req, res);
                  return;
                }
                if (url.startsWith('/api/contact')) {
                  await contactHandler(req, res);
                  return;
                }
                if (url.startsWith('/api/shiprocket-pickup')) {
                  await shiprocketPickupHandler(req, res);
                  return;
                }
                if (url.startsWith('/api/send-order-confirmation')) {
                  await sendOrderConfirmationHandler(req, res);
                  return;
                }
                if (url.startsWith('/api/check-eta')) {
                  await checkEtaHandler(req, res);
                  return;
                }
              } catch (err) {
                console.error(`[Dev Server Middleware Error] ${url}:`, err);
                if (!res.headersSent) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message || 'Internal API Server Error' }));
                }
                return;
              }
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
      strictPort: true,
      open: true,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://bmbegjxfkpyenndfbcdj.supabase.co wss://bmbegjxfkpyenndfbcdj.supabase.co https://api.razorpay.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;",
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      }
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three')) {
                return 'vendor-three';
              }
              if (id.includes('gsap')) {
                return 'vendor-gsap';
              }
              if (id.includes('lenis')) {
                return 'vendor-lenis';
              }
              if (id.includes('@supabase') || id.includes('websocket')) {
                return 'vendor-supabase';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-core';
            }
          }
        }
      }
    }
  };
})
