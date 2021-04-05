import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from 'stripe';
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/managesubscription";

async function buffer(readable: Readable) {
  //recebe um readable string
  const chunks = []; //coloca os pedaços dessa string nesse array

  for await (const chunk of readable) {
    //para cada vez que receber um valor da requisição
    //armazena dentro de chunk
    //o for await aguarda as novas requisições e vai inserindo nos chunks
    chunks.push(
      typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    );
  }

  // e converte no buffer
  return Buffer.concat(chunks);
}

//desabilita o entedimento padrão do next
//entende que toda requisição vem como um JSON ou envio de formulario..
// mas nesse caso estara vindo como stream, por isso desabilitamos 
export const config = {
  api: {
    bodyParser: false,
  }
}
//Set é um array mas não pode ter nada duplicado dentro
const relevantsEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);
export default async (req: NextApiRequest, res: NextApiResponse) => {

  if (req.method === 'POST') {
    
    const buf = await buffer(req); //nesse buf teremos todas as nossas requisições
    const secret = req.headers['stripe-signature'] //vai ser usada para comparar se é o mesmo valor que vem da req

    let event: Stripe.Event; //eventos que vem do webhook

    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err){
      return res.status(400).send(`Webhook error: ${err.message}`);
    }
  //event.type retorna os eventos que aparecem no log do terminal, tipo o checkout.session.complete
    const { type } = event;
    if (relevantsEvents.has(type)) {
      try {
        switch (type) {
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':

            const subscription = event.data.object as Stripe.Subscription;
            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
              false
            )
           
          case 'checkout.session.completed':
            //tipar para saber o que está dentro dela
            const checkoutSession = event.data.object as Stripe.Checkout.Session 
            
            
            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            )
          break;
        default:
          throw new Error('Unhandled event.')
      }
      } catch (err) {
        res.json({ error: 'Webhook handler failed.'})
      }
    }

    res.status(200).json({ ok: true });
  }
  else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
  }
 
 
  
}