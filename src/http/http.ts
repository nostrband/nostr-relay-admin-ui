import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
import axios from "axios";
import { sha256 } from "js-sha256";

const signer = new NDKNip07Signer();

export const sendPostAuth = async <T>(
  ndk: NDK,
  pubkey: string,
  url: string,
  method: string,
  body?: string,
  id?: number | string,
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
    const configs = {
      headers: {
        Authorization: `Nostr ${encodedString}`,
      },
    };
    if (body) {
      Object.defineProperty(configs, "params", {
        value: JSON.parse(body),
        enumerable: true,
      });
    }

    const { data } = await axios.get<T>(url, configs);
    return data;
  }
  if (method === "DELETE") {
    const { data } = await axios.delete(`${url}/${id}`, {
      headers: {
        Authorization: `Nostr ${encodedString}`,
      },
    });
    return data;
  }
  if (method === "POST" && body) {
    const { data } = await axios.post(`${url}`, JSON.parse(body), {
      headers: {
        Authorization: `Nostr ${encodedString}`,
      },
    });
    return data;
  }
  if (method === "PUT" && body) {
    const currentUrl = url.includes("rules") ? `${url}/${id}` : url;
    const { data } = await axios.put(currentUrl, JSON.parse(body), {
      headers: {
        Authorization: `Nostr ${encodedString}`,
      },
    });
    return data;
  }

  return null;
};
