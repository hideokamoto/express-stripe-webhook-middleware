import type Stripe from 'stripe';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { raw } from 'body-parser';

export type Logger = (message?: unknown, ...optionalParams: unknown[]) => void;

export interface StripeWebhookMiddlewareOptions {
  /**
   * Custom logger function for error logging
   * @default console.error
   */
  logger?: Logger;

  /**
   * Custom error handler function
   * If not provided, sends a 400 response with the error message
   */
  onError?: (error: Error, req: Request, res: Response) => void;
}

/**
 * Factory class for creating Express middleware that verifies Stripe webhook signatures
 *
 * @example
 * ```typescript
 * import Stripe from 'stripe';
 * import express from 'express';
 * import { StripeWebhookMiddlewareFactory } from 'express-stripe-webhook-middleware';
 *
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
 * const factory = new StripeWebhookMiddlewareFactory(
 *   process.env.STRIPE_WEBHOOK_SECRET,
 *   stripe
 * );
 *
 * const app = express();
 * app.post('/webhook', ...factory.create(), (req, res) => {
 *   const event = req.body as Stripe.Event;
 *   console.log('Received event:', event.type);
 *   res.json({ received: true });
 * });
 * ```
 */
export class StripeWebhookMiddlewareFactory {
  private readonly endpointSecret: string;
  private readonly stripe: Stripe;
  private readonly log: Logger;
  private readonly onError?: (error: Error, req: Request, res: Response) => void;

  /**
   * Creates a new StripeWebhookMiddlewareFactory instance
   *
   * @param endpointSecret - Stripe webhook secret key (starts with `whsec_`)
   * @param client - Stripe SDK client instance
   * @param options - Optional configuration
   */
  constructor(
    endpointSecret: string,
    client: Stripe,
    options?: StripeWebhookMiddlewareOptions
  ) {
    this.endpointSecret = endpointSecret;
    this.stripe = client;
    this.log = options?.logger ?? console.error;
    this.onError = options?.onError;
  }

  /**
   * Creates an array of middleware handlers for Stripe webhook verification
   *
   * Returns an array containing:
   * 1. body-parser middleware to parse raw body
   * 2. Stripe signature verification middleware
   *
   * @returns Array of Express request handlers
   */
  public create(): RequestHandler[] {
    const { endpointSecret, stripe, log, onError } = this;

    const rawBodyParser = raw({ type: 'application/json' });

    const verifySignature: RequestHandler = (
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      const sig = req.headers['stripe-signature'];

      if (!sig) {
        const error = new Error('Missing stripe-signature header');
        log(error);
        if (onError) {
          onError(error, req, res);
          return;
        }
        res.status(400).send(`Webhook Error: ${error.message}`);
        return;
      }

      try {
        const event = stripe.webhooks.constructEvent(
          req.body as Buffer,
          sig,
          endpointSecret
        );
        req.body = event;
        next();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log(error);
        if (onError) {
          onError(error, req, res);
          return;
        }
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    };

    return [rawBodyParser, verifySignature];
  }
}

/**
 * Creates Stripe webhook verification middleware
 *
 * This is a convenience function that creates a factory and returns the middleware
 *
 * @param endpointSecret - Stripe webhook secret key (starts with `whsec_`)
 * @param client - Stripe SDK client instance
 * @param options - Optional configuration
 * @returns Array of Express request handlers
 *
 * @example
 * ```typescript
 * import Stripe from 'stripe';
 * import express from 'express';
 * import { createStripeWebhookMiddleware } from 'express-stripe-webhook-middleware';
 *
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
 * const app = express();
 *
 * app.post(
 *   '/webhook',
 *   ...createStripeWebhookMiddleware(process.env.STRIPE_WEBHOOK_SECRET, stripe),
 *   (req, res) => {
 *     const event = req.body as Stripe.Event;
 *     res.json({ received: true });
 *   }
 * );
 * ```
 */
export function createStripeWebhookMiddleware(
  endpointSecret: string,
  client: Stripe,
  options?: StripeWebhookMiddlewareOptions
): RequestHandler[] {
  const factory = new StripeWebhookMiddlewareFactory(
    endpointSecret,
    client,
    options
  );
  return factory.create();
}
