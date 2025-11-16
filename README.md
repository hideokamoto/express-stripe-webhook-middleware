# Express Stripe Webhook Middleware

[![npm version](https://badge.fury.io/js/express-stripe-webhook-middleware.svg)](https://www.npmjs.com/package/express-stripe-webhook-middleware)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, type-safe Express middleware for verifying Stripe webhook signatures. Built with TypeScript and Vite.

## Features

- ✅ **Type-safe**: Full TypeScript support with strict type checking
- 🔒 **Secure**: Automatic signature verification using Stripe's SDK
- 🎯 **Simple API**: Easy to use with Express applications
- 🔧 **Flexible**: Custom error handlers and logging
- ⚡ **Modern**: Built with Vite and latest dependencies
- 🧪 **Well-tested**: Comprehensive test coverage with Vitest

## Installation

```bash
npm install express-stripe-webhook-middleware stripe express
# or
yarn add express-stripe-webhook-middleware stripe express
# or
pnpm add express-stripe-webhook-middleware stripe express
```

## Quick Start

### TypeScript

```typescript
import Stripe from 'stripe';
import express from 'express';
import { createStripeWebhookMiddleware } from 'express-stripe-webhook-middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const app = express();

app.post(
  '/webhook',
  ...createStripeWebhookMiddleware(process.env.STRIPE_WEBHOOK_SECRET!, stripe),
  (req, res) => {
    const event = req.body as Stripe.Event;

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('PaymentIntent was successful!');
        break;
      case 'payment_method.attached':
        console.log('PaymentMethod was attached to a Customer!');
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

app.listen(4242, () => console.log('Server running on port 4242'));
```

### JavaScript (CommonJS)

```javascript
const Stripe = require('stripe');
const express = require('express');
const { createStripeWebhookMiddleware } = require('express-stripe-webhook-middleware');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.post(
  '/webhook',
  ...createStripeWebhookMiddleware(process.env.STRIPE_WEBHOOK_SECRET, stripe),
  (req, res) => {
    const event = req.body;
    console.log('Received event:', event.type);
    res.json({ received: true });
  }
);

app.listen(4242);
```

## Advanced Usage

### Using the Factory Pattern

```typescript
import { StripeWebhookMiddlewareFactory } from 'express-stripe-webhook-middleware';

const factory = new StripeWebhookMiddlewareFactory(
  process.env.STRIPE_WEBHOOK_SECRET!,
  stripe
);

app.post('/webhook', ...factory.create(), (req, res) => {
  const event = req.body as Stripe.Event;
  // Handle event
  res.json({ received: true });
});
```

### Custom Error Handling

```typescript
const factory = new StripeWebhookMiddlewareFactory(
  process.env.STRIPE_WEBHOOK_SECRET!,
  stripe,
  {
    onError: (error, req, res) => {
      console.error('Webhook error:', error.message);
      res.status(400).json({
        error: 'Webhook signature verification failed',
        message: error.message
      });
    }
  }
);

app.post('/webhook', ...factory.create(), (req, res) => {
  res.json({ received: true });
});
```

### Custom Logger

```typescript
import pino from 'pino';

const logger = pino();

const factory = new StripeWebhookMiddlewareFactory(
  process.env.STRIPE_WEBHOOK_SECRET!,
  stripe,
  {
    logger: (error) => logger.error({ error }, 'Webhook verification failed')
  }
);
```

## Why This Package?

[Stripe recommends verifying webhook signatures](https://stripe.com/docs/webhooks/signatures) to ensure the requests actually come from Stripe.

### Without This Package

Following Stripe's official example, you need to manually set up body parsing and signature verification:

```javascript
const stripe = require('stripe')('sk_test_...');
const bodyParser = require('body-parser');
const app = require('express')();

app.post('/webhook', bodyParser.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, 'whsec_...');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded!');
      break;
    // ... more cases
  }

  res.json({ received: true });
});
```

### With This Package

Much cleaner and type-safe:

```typescript
import { createStripeWebhookMiddleware } from 'express-stripe-webhook-middleware';

app.post(
  '/webhook',
  ...createStripeWebhookMiddleware('whsec_...', stripe),
  (req, res) => {
    const event = req.body as Stripe.Event;

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded!');
        break;
    }

    res.json({ received: true });
  }
);
```

## API Reference

### `createStripeWebhookMiddleware(endpointSecret, stripe, options?)`

Convenience function that creates and returns the middleware array.

**Parameters:**
- `endpointSecret` (string): Your Stripe webhook secret (starts with `whsec_`)
- `stripe` (Stripe): Stripe SDK instance
- `options` (optional): Configuration options
  - `logger`: Custom logger function
  - `onError`: Custom error handler

**Returns:** `RequestHandler[]` - Array of Express middleware

### `StripeWebhookMiddlewareFactory`

Factory class for creating the middleware.

**Constructor:**
```typescript
new StripeWebhookMiddlewareFactory(
  endpointSecret: string,
  stripe: Stripe,
  options?: StripeWebhookMiddlewareOptions
)
```

**Methods:**
- `create()`: Returns `RequestHandler[]`

## Testing Your Webhooks

### Using Stripe CLI

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)

2. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:4242/webhook
```

3. Trigger test events:
```bash
stripe trigger payment_intent.succeeded
```

### Example Test Server

```typescript
import Stripe from 'stripe';
import express from 'express';
import { createStripeWebhookMiddleware } from 'express-stripe-webhook-middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const app = express();

app.post(
  '/webhook',
  ...createStripeWebhookMiddleware(process.env.STRIPE_WEBHOOK_SECRET!, stripe),
  (req, res) => {
    const event = req.body as Stripe.Event;
    console.log('✅ Received event:', event.type);
    res.json({ received: true });
  }
);

app.listen(4242, () => {
  console.log('🚀 Webhook server running on http://localhost:4242');
});
```

## Requirements

- Node.js >= 18
- Express ^4.18.0 || ^5.0.0
- Stripe SDK ^14.0.0 || newer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Hidetaka Okamoto](https://github.com/hideokamoto)

## Changelog

### v0.2.0
- 🚀 Migrated from TSDX to Vite
- 📦 Updated to latest dependencies (Stripe SDK v17+, TypeScript 5.7)
- ✨ Added `createStripeWebhookMiddleware` helper function
- 🔧 Added custom error handler support via `onError` option
- 🎯 Improved type safety with strict TypeScript settings
- ✅ Enhanced test coverage with Vitest
- 📝 Comprehensive JSDoc documentation
- ⚡ Better error handling for missing signatures
- 🔄 Now exports both ESM and CommonJS formats

### v0.1.0
- Initial release with TSDX