import { GetStaticProps } from "next";
import Head from "next/head";
import { SubscribeButton } from "../components/SubscribeButton";
import { stripe } from "../services/stripe";
import styles from "./home.module.scss";

//client-side - quando nao precisa de indexação, info carregada a partir de uma ação do usuario
//Server-side demora um pouco mais pra carregar - funciona tbm bem com a indexação mas precisamos de dados em tempo real, do usario acessando por exemplo
//Static site generation -> ecommerce, pq todos verão a mesma pag, e os motores de busca funcionam melhor a indexação
interface HomeProps {
  product: {
    priceId: string;
    amount: number;
  };
}

export default function Home({ product }: HomeProps) {
  return (
    <>
      <Head>
        {/* o que colocar nesse head, joga lá no document. no head de lá */}
        <title>Home | ig.news</title>
      </Head>
      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span> 👏 Hey, welcome</span>
          <h1>
            News about <br />
            the <span>React</span> world.
          </h1>
          <p>
            Get access to all the publications <br />
            <span>for {product.amount} month</span>
          </p>
          {/* por enquanto não esta utilizando o priceID, que servirá para ir para o product referente ao ID passado */}
          <SubscribeButton priceId={product.priceId} />
        </section>
        <img src="/images/avatar.svg" alt="Girl coding" />
      </main>
    </>
  );
}

//é executado na camada do next, não do browser, ou seja por ex: um log nesas função não aparecerá
export const getStaticProps: GetStaticProps = async () => {
  //GetStatic para pessoas que irão ver o mesmo conteudo! (SSG) e o SSR (Server side rendering para pág dinamicas)
  //buscar o valor do preço lá na plataforma do stripe, passando o id no retrieve, esse que vc pega lá
  const price = await stripe.prices.retrieve("price_1IahIHJ3GiNrfnm6rL1360uV", {
    expand: ["product"], //pega todas as infos do produto price.product, se fosse usar
  });
  const product = {
    priceId: price.id,
    amount: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price.unit_amount / 100), //sempre vem em centavos, por isso converter..é uma dica para vc salvar seus preços em centavos nos BD da vida e converter quando chamar
  };
  //passamos esse product no construtor da home
  return {
    props: {
      product,
    },
    revalidate: 60 * 60 * 24, //24 hours
  };
};
