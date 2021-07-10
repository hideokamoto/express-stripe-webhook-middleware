import request from 'supertest';
import Stripe from 'stripe';
import express from 'express';
import { StripeWebhookMiddlewareFactory } from '../src/index';

class MockStripe {
  public webhooks = {
    constructEvent: (payload: any) => {
      return payload;
    },
  };
}

const createExpressApp = (stripe: any) => {
  const app = express();
  const factory = new StripeWebhookMiddlewareFactory(
    'process.env.STRIPE_WEBHOOK_SECRET_KEY',
    stripe
  );
  app.use(factory.create());
  app.post('/webhook', async (request, response) => {
    response.status(200).send('Webhook works');
  });
  return app;
};

describe('StripeWebhookMiddlewareFactory', () => {
  it('should throw signature error when use a real Stripe SDK', async () => {
    const app = createExpressApp(new Stripe('a', { apiVersion: '2020-08-27' }));
    const response = await request(app).post('/webhook');
    expect(response.status).toEqual(400);
    expect(response.text).toEqual(
      'Webhook Error: Unable to extract timestamp and signatures from header'
    );
  });
  it('should return any response when constructEvent has been passed', async () => {
    const app = createExpressApp(new MockStripe() as any);
    const response = await request(app).post('/webhook');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('Webhook works');
  });
});
