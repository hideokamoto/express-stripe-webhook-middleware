import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import Stripe from 'stripe';
import express, { type Request, type Response } from 'express';
import {
  StripeWebhookMiddlewareFactory,
  createStripeWebhookMiddleware,
} from '../src/index';

class MockStripe {
  public webhooks = {
    constructEvent: (payload: Buffer, sig: string, secret: string) => {
      if (sig === 'invalid') {
        throw new Error('Invalid signature');
      }
      return {
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: { object: {} },
      };
    },
  };
}

const createExpressApp = (stripe: Stripe, options?: any) => {
  const app = express();
  const factory = new StripeWebhookMiddlewareFactory(
    'whsec_test_secret',
    stripe,
    options
  );
  app.post('/webhook', ...factory.create(), async (req, res) => {
    res.status(200).send('Webhook works');
  });
  return app;
};

describe('StripeWebhookMiddlewareFactory', () => {
  describe('Basic functionality', () => {
    it('should successfully verify valid webhook signature', async () => {
      const app = createExpressApp(new MockStripe() as any);
      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'valid_signature')
        .send(Buffer.from('test'));

      expect(response.status).toEqual(200);
      expect(response.text).toEqual('Webhook works');
    });

    it('should reject webhook without stripe-signature header', async () => {
      const app = createExpressApp(new MockStripe() as any);
      const response = await request(app).post('/webhook').send(Buffer.from('test'));

      expect(response.status).toEqual(400);
      expect(response.text).toContain('Missing stripe-signature header');
    });

    it('should reject webhook with invalid signature', async () => {
      const app = createExpressApp(new MockStripe() as any);
      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'invalid')
        .send(Buffer.from('test'));

      expect(response.status).toEqual(400);
      expect(response.text).toContain('Webhook Error: Invalid signature');
    });
  });

  describe('Real Stripe SDK', () => {
    it('should throw signature error with real Stripe SDK and no signature', async () => {
      const app = createExpressApp(
        new Stripe('sk_test_fake', { apiVersion: '2024-12-18.acacia' })
      );
      const response = await request(app).post('/webhook').send(Buffer.from('test'));

      expect(response.status).toEqual(400);
      expect(response.text).toContain('Missing stripe-signature header');
    });

    it('should throw signature error with real Stripe SDK and invalid signature', async () => {
      const app = createExpressApp(
        new Stripe('sk_test_fake', { apiVersion: '2024-12-18.acacia' })
      );
      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'invalid')
        .send(Buffer.from('test'));

      expect(response.status).toEqual(400);
      expect(response.text).toContain('Webhook Error:');
    });
  });

  describe('Custom logger', () => {
    it('should use custom logger when provided', async () => {
      const mockLogger = vi.fn();
      const app = createExpressApp(new MockStripe() as any, {
        logger: mockLogger,
      });

      await request(app)
        .post('/webhook')
        .set('stripe-signature', 'invalid')
        .send(Buffer.from('test'));

      expect(mockLogger).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Custom error handler', () => {
    it('should use custom error handler when provided', async () => {
      const mockErrorHandler = vi.fn((error: Error, req: Request, res: Response) => {
        res.status(500).json({ error: 'Custom error handler' });
      });

      const app = createExpressApp(new MockStripe() as any, {
        onError: mockErrorHandler,
      });

      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'invalid')
        .send(Buffer.from('test'));

      expect(mockErrorHandler).toHaveBeenCalled();
      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ error: 'Custom error handler' });
    });

    it('should handle missing signature with custom error handler', async () => {
      const mockErrorHandler = vi.fn((error: Error, req: Request, res: Response) => {
        res.status(401).json({ error: error.message });
      });

      const app = createExpressApp(new MockStripe() as any, {
        onError: mockErrorHandler,
      });

      const response = await request(app).post('/webhook').send(Buffer.from('test'));

      expect(mockErrorHandler).toHaveBeenCalled();
      expect(response.status).toEqual(401);
      expect(response.body.error).toContain('Missing stripe-signature header');
    });
  });

  describe('createStripeWebhookMiddleware helper', () => {
    it('should create middleware using helper function', async () => {
      const app = express();
      const stripe = new MockStripe() as any;

      app.post(
        '/webhook',
        ...createStripeWebhookMiddleware('whsec_test', stripe),
        (req, res) => {
          res.status(200).send('Helper works');
        }
      );

      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'valid')
        .send(Buffer.from('test'));

      expect(response.status).toEqual(200);
      expect(response.text).toEqual('Helper works');
    });

    it('should handle errors with helper function', async () => {
      const app = express();
      const stripe = new MockStripe() as any;

      app.post(
        '/webhook',
        ...createStripeWebhookMiddleware('whsec_test', stripe),
        (req, res) => {
          res.status(200).send('Helper works');
        }
      );

      const response = await request(app).post('/webhook').send(Buffer.from('test'));

      expect(response.status).toEqual(400);
      expect(response.text).toContain('Missing stripe-signature header');
    });
  });

  describe('Body parsing', () => {
    it('should properly parse raw body as Buffer', async () => {
      const app = express();
      const stripe = new MockStripe() as any;
      let receivedBody: any;

      app.post(
        '/webhook',
        ...createStripeWebhookMiddleware('whsec_test', stripe),
        (req, res) => {
          receivedBody = req.body;
          res.status(200).json(req.body);
        }
      );

      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'valid')
        .send(Buffer.from('test'));

      expect(response.status).toEqual(200);
      expect(receivedBody).toHaveProperty('id', 'evt_test');
      expect(receivedBody).toHaveProperty('type', 'payment_intent.succeeded');
    });
  });
});
