const Stripe = require('stripe');
const express = require('express');
const { createStripeWebhookMiddleware } = require('../dist/index.cjs');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const app = express();

// Webhook endpoint
app.post(
  '/webhook',
  ...createStripeWebhookMiddleware(process.env.STRIPE_WEBHOOK_SECRET_KEY, stripe),
  (req, res) => {
    const event = req.body;

    console.log('=====');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    console.log('=====');

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('💰 PaymentIntent succeeded!');
        break;
      case 'payment_intent.created':
        console.log('📝 PaymentIntent created!');
        break;
      case 'payment_method.attached':
        console.log('🔗 PaymentMethod attached!');
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Stripe Webhook Server is running',
  });
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log('\nTo test locally, run:');
  console.log('  stripe listen --forward-to localhost:' + PORT + '/webhook');
});
 