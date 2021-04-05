import { GetServerSideProps } from "next";
import { getSession, session } from "next-auth/client";
import Head from "next/head";
import { RichText } from "prismic-dom";

import { getPrismicClient } from "../../services/prismic";
import styles from "./post.module.scss";

interface PostProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}

export default function Post({ post }: PostProps) {
  return (
    <>
      <Head>{post.title} | Ignews</Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: post.content }}
          ></div>
        </article>
      </main>
    </>
  );
}

//Toda pagina que é statica não é protegida
export const getServerSideProps: GetServerSideProps = async ({
  req,
  params,
}) => {
  //vamos utilizar o ServerSide pois mesmo que faça a requisição toda vez é a unica forma de sabermos
  //com certeza que quem irá ver os posts está logado
  //Busca nos cookies de session para saber se o user está logado
  const session = await getSession({ req });
  const { slug } = params;
//se não tiver subscrição vai pra main page
  if (!session?.activeSubscription) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const prismic = getPrismicClient(req);

  //busca por UID que no caso é o slug, está como String pois foi definido como UM slug e não um array de slugs,
  // e entre {} podemos passar varias querys, no caso iremos deixar vazio.
  const response = await prismic.getByUID("post", String(slug), {});

  //Formatando os dados do post

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content), //retornara as tags html..
    updatedAt: new Date(response.last_publication_date).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ),
  };
  return {
    props: {
      post,
    },
  };
};
