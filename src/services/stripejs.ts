//PARTE FRONTEND DE CONEXÃO DO STRIPE colocando o 
//NEXT_PUBLIC no env a chave torna-se visivel para o front

//instalar @stripe/stripe-js

import { loadStripe } from '@stripe/stripe-js';

export async function getStripeJs() {
  const stripeJs = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

  return stripeJs;
  
}