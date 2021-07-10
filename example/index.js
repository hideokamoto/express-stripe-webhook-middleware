const Stripe = require('stripe');
const express = require('express');
require('dotenv').config()

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY, {
  apiVersion: '2020-08-27',
});
const {
    StripeWebhookMiddlewareFactory
} = require('../dist/index')

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
 