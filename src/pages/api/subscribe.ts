import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { stripe } from "../../services/stripe";
import { query as q } from 'faunadb';
import { fauna } from "../../services/fauna";

type User = {
  ref: {
    id: string;
  }
  data: {
    stripe_customer_id: string
  }
}
export default  async (req: NextApiRequest, res: NextApiResponse) => {
  //verificar se o method da requisição é POST
  if (req.method === 'POST') {
    //criar um custumer dentro do painel do stripe, para isso precisa verificar qual o usuario logado
    const session = await getSession({ req });
   

    //pega os dados do user no fauna
    //setamos a typagem de User aqui
    const user = await fauna.query<User>(
      q.Get(
        q.Match(
          q.Index('user_by_email'),
          q.Casefold(session.user.email)
        )
      )
    )

    //verificar se já tem o user
    let customerId = user.data.stripe_customer_id;

    if (!customerId) {

       const stripeCustomer = await stripe.customers.create({
      email: session.user.email,
      //toda vez que clicavamos no subscribe adicionada o mesmo cliente, vamos resolver
      //passando o id do stripe para o bd e de lá verificando se já tem, se tiver não cria um novo
      //metadata
       });
      // atualizar os dados do user 
    //acusara o ref como não existindo no objeto para isso criamos o type ali em cima
    await fauna.query(
      q.Update(
        q.Ref(q.Collection('users'), user.ref.id),
        {
          data: {
            stripe_customer_id: stripeCustomer.id
          }
        }
      )
      )
      //recebe o valor e é utilzada em  stripeCheckoutSession
      customerId = stripeCustomer.id;
    }


    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: customerId, //id no stripe, não no banco de dados!
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        { price: 'price_1IahIHJ3GiNrfnm6rL1360uV', quantity: 1 }
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    })
    return res.status(200).json({sessionId: stripeCheckoutSession.id})
   }
  else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed')
  }
}