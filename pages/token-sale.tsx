import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Footer from "../components/footer";
import NavBar from "../components/navbar";

const TokenSale: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Ark of Dreams - Token Sale</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavBar />
      <main>
        <h1 className="text-3xl font-bold underline">Token Page</h1>
      </main>
      <Footer />
    </div>
  );
};

export default TokenSale;
