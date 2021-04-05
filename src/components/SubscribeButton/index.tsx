import { signIn, useSession } from "next-auth/client";
import { useRouter } from "next/router";
import { api } from "../../services/api";
import { getStripeJs } from "../../services/stripejs";
import styles from "./styles.module.scss";

interface SubscribeButtonProps {
  priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  //verificar se o user ta logado pelo session do next auth
  const [session] = useSession();
  const router = useRouter();
  async function handleSubscribe() {
    if (!session) {
      signIn("github");
      return;
    }
    //criar a checkout session

    //se tiver subscrição vai para posts assim que clicar
    if (session.activeSubscription) {
      router.push("/posts");
      return;
    }

    try {
      const response = await api.post("/subscribe");
      const { sessionId } = response.data;

      const stripe = await getStripeJs();
      //passa a chave do sessionId com o valor do sessionId, como são iguais fica somente um
      // { sessionId : batata}
      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      alert(err.message);
    }
  }
  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe now
    </button>
  );
}
