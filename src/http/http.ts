import NDK, { NDKEvent, NDKNip07Signer } from "@nostrband/ndk";
import axios from "axios";
import { sha256 } from "js-sha256";

const signer = new NDKNip07Signer();

export const sendPostAuth = async (
  ndk: NDK,
  pubkey: string,
  url: string,
  method: string,
  body?: string,
  ruleId?: number,
) => {
  const authEvent = new NDKEvent(ndk, {
    pubkey: pubkey as string,
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    content: "",
    tags: [
      ["u", url],
      ["method", method],
    ],
  });
  if (body) {
    authEvent.tags.push(["payload", sha256(body)]);
  }

  authEvent.sig = await authEvent.sign(signer);
  const encodedString = btoa(JSON.stringify(authEvent.rawEvent()));

  if (method === "GET") {
    const { data } = await axios.get("http://localhost:4000/rules", {
      headers: {
        Authorization: `Nostr ${encodedString}`,
      },
    });
    return data;
  }
  if (method === "DELETE") {
    const { data } = await axios.delete(
      `http://localhost:4000/rules/${ruleId}`,
      {
        headers: {
          Authorization: `Nostr ${encodedString}`,
        },
      },
    );
    return data;
  }
  if (method === "POST" && body) {
    const { data } = await axios.post(
      `http://localhost:4000/rules`,
      JSON.parse(body),
      {
        headers: {
          Authorization: `Nostr ${encodedString}`,
        },
      },
    );
    return data;
  }

  return null;
};
