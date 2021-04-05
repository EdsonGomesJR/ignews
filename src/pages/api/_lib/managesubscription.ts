import { FaUnderline } from "react-icons/fa";
import { query as q} from 'faunadb';
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";


export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  //Essa func salva no banco de dados

  //1 - buscar o usuario no faunadb com o customer_id, para buscar esse id que ta como
  //stripe_customer_id, temos que criar um indice no faunadb 
  //2 - salvar os dados na nova collection subscriptions no faunadb .
  //3 buscar informações no fauna é atraves das ref

  const userRef = await fauna.query(
    //usar o select para pegar uma informação especifica do campo ref no fauna
    q.Select("ref",
       q.Get(
        q.Match(
          q.Index('user_by_stripe_customer_id'),
          customerId
        )
      )
    )
  )

  //pegar todos os dados da subscriptions

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id, //poderia ter mais itens, como temos um pegamos o da pos 0
  }
  //se for uma createAction = subscribe
  if (createAction) {
      await fauna.query(
      q.Create(
        q.Collection('subscriptions'),
        {data: subscriptionData}
      )
    )
   }
  else {
    //Replace substitui a subscription no bd por completa
    await fauna.query(
      q.Replace(
        q.Select(
          "ref",
          q.Get(
            q.Match(
              q.Index('subscription_by_id'),
              subscriptionId,
            )
          )
        ), {
          data: subscriptionData
        }
      )
    )

  }
  
}