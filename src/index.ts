import Stripe from 'stripe';
import { NextFunction, Request, Response } from 'express';

export type Logger = (message?: any, ...optionalParams: any[]) => void
export interface StripeWebhookMiddlewareBuilderOptions {
  logger?: Logger;
}

export class StripeWebhookMiddlewareFactory {
  /**
   * Stripe Webhook secret key (start from `whsec_`)
   */
  private readonly endpointSecret: string;

  /**
   * Stripe SDK client
   */
  private readonly stripe: Stripe


  /**
   * Logging function
   */
  private readonly log: Logger;
  

  constructor(endpointSecret: string, client: Stripe, options?: StripeWebhookMiddlewareBuilderOptions) {
    this.endpointSecret = endpointSecret
    this.stripe = client
    this.log = options && options.logger ? options.logger : console.log
  }
  

  public create() {
    const { endpointSecret, stripe, log } = this
    return (req: Request, res: Response, next: NextFunction) => {
      var data = '';
      req.setEncoding('utf8');
      req.on('data', function(chunk) {
        data += chunk;
      });
  
      req.on('end', function() {
        req.body = data;
        const payload = req.body;
        const sig = req.headers['stripe-signature'];
        try {
          req.body = stripe.webhooks.constructEvent(payload, sig as string, endpointSecret);
          next();
        } catch (err) {
          log(err);
          res.status(400).send(`Webhook Error: ${err.message}`);
        }
      });
    };
  }
}


