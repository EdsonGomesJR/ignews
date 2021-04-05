import { GetStaticPaths, GetStaticProps } from "next";
import { getSession, session, useSession } from "next-auth/client";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { RichText } from "prismic-dom";
import { useEffect } from "react";

import { getPrismicClient } from "../../../services/prismic";
import styles from "../post.module.scss";

interface PostPreviewProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}

export default function PostPreview({ post }: PostPreviewProps) {
  //como usamos StaticProps, para saber se o usario está logado será por aqui

  const [session] = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.activeSubscription) {
      router.push(`/posts/${post.slug}`);
    }
  }, [session]);

  return (
    <>
      <Head>{post.title} | Ignews</Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div
            className={`${styles.postContent} ${styles.previewContent}`} // assim atribui duas class para a tag
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className={styles.continueReading}>
            Wanna continue reading?
            <Link href="/">
              <a href=" "> Subscribe now! 🤗</a>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
//quais previews de posts quer gerar durante a build, vazio carrega todos os posts
export const getStaticPaths: GetStaticPaths = async () => {
  //mas poderia fazer a chamada dos melhores posts do blog

  return {
    paths: [],
    fallback: "blocking",
  };
};
//Como o preview é publico a pag será estatica, pois não precisa verificar se o user está logado
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  //busca por UID que no caso é o slug, está como String pois foi definido como UM slug e não um array de slugs,
  // e entre {} podemos passar varias querys, no caso iremos deixar vazio.
  const response = await prismic.getByUID("post", String(slug), {});

  //Formatando os dados do post

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(0, 3)), //retornara as tags html.. retorna os 3 primeiros items do conteudo
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
    redirect: 60 * 30, //de quanto em quanto tempo será atualizado, 30 minutes
  };
};
