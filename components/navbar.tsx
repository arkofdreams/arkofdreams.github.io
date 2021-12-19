import Image from "next/image";

export default function NavBar() {
  return (
    <div className="flex flex-row8 mb-12">
      <div className="basis-4/12 mt-8">
        <Image src="/white-logo.png" alt="white logo ark of dreams" width="240px" height="50px" />
      </div>
      <div className="basis-8/12 mt-8">
        <ul className="flex flex-row justify-end navbar">
          <li className="px-4">Home</li>
          <li className="px-4">NFT</li>
          <li className="px-4">Token Sale</li>
          <li className="px-4">White Paper</li>
          <li className="px-4">Metamask</li>
        </ul>
      </div>
    </div>
  );
}
