# Express Stripe Webhook Middleware

You can easy to verify the Webhook request from Stripe.

## Install

```bash
$ yarn add express-stripe-webhook-middleware
```

## Usage

```javascript
const Stripe = require('stripe');
const express = require('express');
const { StripeWebhookMiddlewareFactory } = require('express-stripe-webhook-middleware')
require('dotenv').config()

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY, {
  apiVersion: '2020-08-27',
});

/**
 * Examples
 */
 const app = express();
 const webhookRouter = express.Router();
 const factory = new StripeWebhookMiddlewareFactory(process.env.STRIPE_WEBHOOK_SECRET_KEY, stripe)
 webhookRouter.use(
   '/webhook',
   factory.create()
 );
 
 webhookRouter.post('/webhook', (request, response) => {
   const payload = request.body;
   console.log('=====');
   console.log(payload);
   response.status(200).send('Webhook done!');
 });
 
 
 app.post('/webhook', webhookRouter);
 app.get('/', async (req, res) => {
   const data = stripe.customers.list();
   res.status(200).send(JSON.stringify(data));
 });
 app.listen(4242, () => console.log('start'));
 
```

## Try it out!

You can test the package on the `example/` directory

### Clone the project

``` bash
$ git clone git@github.com:hideokamoto/express-stripe-webhook-middleware.git
$ cd express-stripe-webhook-middleware
$ npm install
```

### Step1: Install packages

Install libraries.

```bash
$ cd example
$ npm install
```

### Step2: Put your Stripe API keys

Open `.env` file, and replace api key from dummy to your account one.

```bash
$ vim .env
STRIPE_SECRET_API_KEY=sk_test_XXXXXXX
STRIPE_WEBHOOK_SECRET_KEY=whsec_XXXXXXX
```

### Step3: Start the express server

You can start the demo server by this command.

```bash
$ node index.js
```

### Step4: Listen and forward Stripe Webhook request by using Stripe CLI

Stripe CLI can forward the Webhook request to your localhost server.

```bash
$ stripe listen --forward-to localhost:4242/webhook
```

### Step5: Execute Stripe Webhook event by using Stripe CLI

Trigger test webhook event from Stripe CLI.

```bash
$ stripe trigger payment_intent.created
```

Then, you can see the request body on the server log.

```bash
 % node index.js
start
=====
{
  id: 'evt_1JBeVwDHnG67uihbF0mxej38',
  object: 'event',
  api_version: '2020-08-27',
  created: 1625917112,
  data: {
    object: {
      id: 'pi_1JBeVwDHnG67uihb1LH7ioR2',
      object: 'payment_intent',
      amount: 2000,
      amount_capturable: 0,
      amount_received: 0,
      application: null,
      application_fee_amount: null,
...
```