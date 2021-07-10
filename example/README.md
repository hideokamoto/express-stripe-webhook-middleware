# Example

This is an experimental project to test the library.

## Step1: Install packages

Install libraries.

```bash
$ npm install
```

## Step2: Put your Stripe API keys

Open `.env` file, and replace api key from dummy to your account one.

```bash
$ vim .env
STRIPE_SECRET_API_KEY=sk_test_XXXXXXX
STRIPE_WEBHOOK_SECRET_KEY=whsec_XXXXXXX
```

## Step3: Start the express server

You can start the demo server by this command.

```bash
$ node index.js
```

## Step4: Listen and forward Stripe Webhook request by using Stripe CLI

Stripe CLI can forward the Webhook request to your localhost server.

```bash
$ stripe listen --forward-to localhost:4242/webhook
```

## Step5: Execute Stripe Webhook event by using Stripe CLI

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