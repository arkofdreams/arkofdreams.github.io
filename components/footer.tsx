import { faDiscord, faFacebookSquare, faInstagramSquare, faTwitterSquare } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Footer() {
  return (
    <footer className="flex flex-row py-4">
      <div className="basis-4/12">Copyright 2021  Ark of Dreams Innovative Impact Ventures, Inc.</div>
      <div className="basis-8/12">
        <ul className="flex flex-row justify-end">
          <li className="px-4">
            <FontAwesomeIcon icon={faFacebookSquare} size="2x"></FontAwesomeIcon>
          </li>
          <li className="px-4">
            <FontAwesomeIcon icon={faTwitterSquare} size="2x"></FontAwesomeIcon>
          </li>
          <li className="px-4">
            <FontAwesomeIcon icon={faInstagramSquare} size="2x"></FontAwesomeIcon>
          </li>
          <li className="px-4">
            <FontAwesomeIcon icon={faDiscord} size="2x"></FontAwesomeIcon>
          </li>
        </ul>
      </div>
    </footer>
  );
}


