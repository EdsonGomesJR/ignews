import { AppProps } from "next/app";
import { Header } from "../components/Header";
import { Provider as NextAuthProvider } from "next-auth/client";

import "../styles/global.scss";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Precisa estar por fora, pq verificar no app todo se o user esta com sessão ativa
    <NextAuthProvider session={pageProps.session}>
      {/* Como header vai estar presente em todas as paginas, ele vai aqui */}
      <Header />
      <Component {...pageProps} />
    </NextAuthProvider>
  );
}

export default MyApp;
