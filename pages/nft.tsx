import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Footer from "../components/footer";
import NavBar from "../components/navbar";

const NFT: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Ark of Dreams - NFT</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4">
        <NavBar />
        <main>
          {/* Main NFT */}
          <div className="max-w-md bg-white shadow-lg rounded-xl my-20 mx-auto">
            {/* Image Section */}
            <Image
              src="/img_pet.png"
              alt="pet"
              width="450px"
              height="320px"
              className="rounded-t-xl"
            />
            {/* Button Section */}
            <div className="flex  flex-row justify-center">
              <div className="text-2xl p-4 bg-[#00BBF9] text-white w-14 h-14 rounded-full flex flex-items-center justify-items-center text-center border-2 border-[#03A7DD] -mt-8 z-20">
                <FontAwesomeIcon icon={faMinus}></FontAwesomeIcon>
              </div>
              <div className="text-3xl mx-2 pt-2 bg-white w-48 h-14 text-[#096D8E] rounded-full  text-center shadow-lg shadow-[#b1ebff] align-middle -mt-8 z-20 font-semibold">
                Mint 2/5
              </div>
              <div className="text-2xl p-4 bg-[#00BBF9] text-white w-14 h-14 rounded-full flex flex-items-center justify-items-center text-center border-2 border-[#03A7DD] -mt-8 z-20">
                <FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
              </div>
            </div>
            {/* Price Section */}
            <div className="flex flex-row text-center mt-12 text-lg font-semibold text-[#240046]">
              <div className="basis-5/12 text-right">400 BUSD per pet</div>
              <div className="basis-2/12 text-2xl text-[#A8ABFF]">|</div>
              <div className="basis-5/12 text-left">10/5,000 available</div>
            </div>
            {/* Mint Section */}
            <div className="flex flex-row text-center mt-8 py-6 bg-[#7544EB] rounded-b-xl">
              <div className="basis-6/12 text-center text-white font-bold text-xl mt-2">
                800 BUSD
              </div>
              <div className="basis-6/12 text-center">
                <div className="mx-auto pt-2 bg-white w-36 h-12 text-xl text-[#5415EA] rounded-full  text-center  align-middle font-semibold">
                  Mint
                </div>
              </div>
            </div>
          </div>

          {/* NFT List */}
          <div>
            <ul className=" flex flex-row justify-center mt-8">
              <li className="px-2">
                <div className="max-w-md py-4 px-8 bg-white shadow-lg rounded-lg my-20">
                  <div>
                    <h2 className="text-gray-800 text-3xl font-semibold">
                      NFT 1
                    </h2>
                  </div>
                </div>
              </li>
              <li className="px-2">
                <div className="max-w-md py-4 px-8 bg-white shadow-lg rounded-lg my-20">
                  <div>
                    <h2 className="text-gray-800 text-3xl font-semibold">
                      NFT 2
                    </h2>
                  </div>
                </div>
              </li>
              <li className="px-2">
                <div className="max-w-md py-4 px-8 bg-white shadow-lg rounded-lg my-20">
                  <div>
                    <h2 className="text-gray-800 text-3xl font-semibold">
                      NFT 3
                    </h2>
                  </div>
                </div>
              </li>
              <li className="px-2">
                <div className="max-w-md py-4 px-8 bg-white shadow-lg rounded-lg my-20">
                  <div>
                    <h2 className="text-gray-800 text-3xl font-semibold">
                      NFT 4
                    </h2>
                  </div>
                </div>
              </li>
              <li className="px-2">
                <div className="max-w-md py-4 px-8 bg-white shadow-lg rounded-lg my-20">
                  <div>
                    <h2 className="text-gray-800 text-3xl font-semibold">
                      NFT 5
                    </h2>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default NFT;
