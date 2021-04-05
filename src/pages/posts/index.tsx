import { GetStaticProps } from "next";
import Head from "next/head";
import React from "react";
import Link from "next/link";
import Prismic from "@prismicio/client";
import { RichText } from "prismic-dom";
import { getPrismicClient } from "../../services/prismic";
import styles from "./styles.module.scss";
//aqui vai o que há dentro dos posts, conforme passado no ServerStaticProps
type Post = {
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string; //string pq ja esta formatada
};
//como post é um array, separa o tipo de dados que recebe ali no type
interface PostsProps {
  posts: Post[];
}

export default function Posts({ posts }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {/* quando quer mostrar algo diretamente usa os parentes, pois chaves daria erro */}
          {posts.map((post) => (
            <Link key={post.slug} href={`/posts/${post.slug}`}>
              <a>
                <time>{post.updatedAt}</time>
                <strong> {post.title}</strong>
                <p>{post.excerpt} </p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at("document.type", "post")],
    {
      fetch: ["post.title", "post.content"],
      pageSize: 100,
    }
  );

  const posts = response.results.map((post) => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      //percorre o array de content até achar o primeiro paragrafo, pois
      //pode ser que a postagem comece com uma imagem e portanto para o resumo precisamos do paragrafo
      //caso o paragrafo seja encontrado, se não.. retorna uma string vazia
      excerpt:
        post.data.content.find((content) => content.type === "paragraph")
          ?.text ?? "",
      updatedAt: new Date(post.last_publication_date).toLocaleDateString(
        "pt-BR",

        { year: "numeric", day: "2-digit", month: "long" }
      ),
    };
  });

  return {
    props: {
      posts,
    },
  };
};
