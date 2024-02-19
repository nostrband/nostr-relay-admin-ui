import { Button, Spinner } from "react-bootstrap";
import cl from "./Review.module.css";
import Search from "../../../components/Search/Search";
import { useEffect, useState } from "react";
import { getRuleType, ruleType } from "../../../types/types";
import { sendPostAuth } from "../../../http/http";
import { useAppSelector } from "../../../hooks/redux";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import PostCard from "../../../components/PostCard/PostCard";
import ZapTransfer from "../../../components/ZapTransfer/ZapTransfer";
import { getKindName } from "../../../utils/helper";
import { getZapAmount } from "../../../utils/zapFunctions";
import { getTag } from "../../../utils/getTags";

interface IPair {
  relay: string;
  filters: NDKFilter[];
}

const Review = () => {
  const store = useAppSelector((store) => store.userReducer);
  const ndk = useAppSelector((store) => store.connectionReducer.ndk);
  const [postsAuthors, setPostsAuthors] = useState<NDKEvent[]>([]);
  const [defaultRelays, setDefaulRelays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewRules, setReviewRules] = useState<ruleType[]>([]);
  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [receivedZaps, setReceivedZaps] = useState<NDKEvent[]>([]);
  const [amountReceivedZaps, setAmountReceivedZaps] = useState<number[]>([]);
  const [sentAuthors, setSentAuthors] = useState<NDKEvent[]>([]);
  const [createdTimes, setCreatedTimes] = useState<number[]>([]);
  const [sendersComments, setSendersComments] = useState<any[]>([]);
  const [zappedPosts, setZappedPosts] = useState<NDKEvent[]>([]);
  const [providers, setProviders] = useState<NDKEvent[]>([]);
  const [receiverAuthors, setReceiverAuthors] = useState<NDKEvent[]>([]);

  const fetchDefaultRelays = async () => {
    try {
      const url = `${process.env.REACT_APP_API_URL_RULES}/relays`;
      const data = await sendPostAuth<string[]>(ndk, store.pubkey, url, "GET");
      setDefaulRelays(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRules = async () => {
    try {
      const url = `${process.env.REACT_APP_API_URL_RULES}/rules`;
      const data: getRuleType[] = await sendPostAuth(
        ndk,
        store.pubkey,
        url,
        "GET",
      );
      const newData: ruleType[] = data.map((rule) => {
        return { ...rule, filter: JSON.parse(rule.filter) };
      });
      const reviewRules = newData.filter(
        (rule) => rule.type.toLowerCase() === "review",
      );
      setReviewRules(reviewRules);
    } catch (err) {
      console.log(err);
    }
  };

  function generatePairs(relays: string[], rules: ruleType[]): IPair[] {
    const pairs: IPair[] = [];

    relays.forEach((relay) => {
      const relevantRules = rules.filter((rule) => rule.relays.includes(relay));
      if (relevantRules.length > 0) {
        pairs.push({
          relay,
          filters: relevantRules.map((rule) => {
            if (typeof rule.filter === "string") {
              return JSON.parse(rule.filter);
            }
            return rule.filter;
          }),
        });
      }
    });

    return pairs;
  }

  useEffect(() => {
    if (store.pubkey) {
      fetchRules();
      fetchDefaultRelays();
    }
  }, [store.pubkey]);

  function removeDuplicates(array: NDKEvent[]) {
    return array.filter(
      (item, index, self) =>
        index === self.findIndex((obj) => obj["id"] === item["id"]),
    );
  }

  const fetchEvents = async (pair: IPair) => {
    try {
      const relays = pair.relay;
      //@ts-ignore
      ndk.explicitRelayUrls = [relays];
      const events = Array.from(await ndk.fetchEvents(pair.filters));
      setEvents((prevState) => removeDuplicates([...prevState, ...events]));

      ndk.explicitRelayUrls = ["wss://relay.nostr.band"];
      const postsAuthorsPks = events.map((post) => post.pubkey);
      const postsAuthors = Array.from(
        await ndk.fetchEvents({
          kinds: [0],
          authors: postsAuthorsPks,
          limit: events.length,
        }),
      );
      setPostsAuthors((prevState) => [...prevState, ...postsAuthors]);

      const zaps = events.filter((event) => event.kind === 9735);
      setReceivedZaps(zaps);
      const providersPubkyes = zaps.map((zap) => zap.pubkey);
      const providers = providersPubkyes.length
        ? Array.from(
            await ndk.fetchEvents({
              kinds: [0],
              authors: providersPubkyes,
            }),
          )
        : [];

      setProviders(providers);

      const zapsAmount = zaps.map((zap) => {
        return getZapAmount(zap);
      });
      setAmountReceivedZaps(zapsAmount);

      const postsIds = zaps.map((zap) => {
        return zap.tags.find((item) => item[0] === "e")
          ? zap.tags.find((item) => item[0] === "e")![1]
          : "";
      });
      const zappedPosts = postsIds.length
        ? Array.from(
            await ndk.fetchEvents({
              kinds: [1],
              ids: postsIds,
            }),
          )
        : [];
      setZappedPosts(zappedPosts);

      const sendersPubkeys = zaps.map((zap) => {
        const cleanJSON = zap.tags
          .find((item) => item[0] === "description")![1]
          .replace(/[^\x20-\x7E]/g, "");
        return JSON.parse(cleanJSON).pubkey;
      });
      // console.log(sendersPubkeys);

      const sendersComments = zaps.map((zap) => {
        const cleanJSON = zap.tags
          .find((item) => item[0] === "description")![1]
          .replace(/[^\x20-\x7E]/g, "");
        return JSON.parse(cleanJSON).content;
      });
      setSendersComments(sendersComments);

      const createdTimes = zaps.map((zap) => {
        return zap.created_at ? zap.created_at : 0;
      });
      setCreatedTimes(createdTimes);

      const sendersArr = sendersPubkeys.length
        ? Array.from(
            await ndk.fetchEvents({
              kinds: [0],
              authors: sendersPubkeys,
            }),
          )
        : [];

      // console.log(sendersArr);
      const senders = sendersArr.map((sender) => {
        return sender;
      });
      setSentAuthors(senders);

      const receiversPubkeys = zaps.map((zap) => {
        return zap.tags.find((item) => item[0] === "p")![1];
      });

      const receiversArr = receiversPubkeys.length
        ? Array.from(
            await ndk.fetchEvents({
              kinds: [0],
              authors: receiversPubkeys,
            }),
          )
        : [];

      const receivers = receiversArr.map((receiver) => {
        return receiver;
      });
      setReceiverAuthors(receivers);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    try {
      if (reviewRules) {
        setIsLoading(true);
        const allRelays = Array.from(
          new Set(
            reviewRules
              .map((rule) => {
                if (typeof rule.relays === "string") {
                  return JSON.parse(rule.relays);
                }
                return rule.relays;
              })
              .flat(),
          ),
        );
        const pairs = generatePairs(allRelays, reviewRules);
        for (const pair of pairs) {
          fetchEvents(pair);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, [reviewRules]);

  let indexOfZaps = -1;

  return (
    <>
      <Search isLoading={false} />
      <div className={cl.reviewHeader}>
        <h4>Review</h4>
      </div>
      {events.map((post) => {
        if (post.kind === 9735) {
          indexOfZaps++;
          const cleanJSON = post.tags
            .find((item) => item[0] === "description")![1]
            .replace(/[^\x20-\x7E]/g, "");
          const pk = JSON.parse(cleanJSON).pubkey;
          const sender = sentAuthors.find((item) => {
            return item.pubkey === pk;
          });
          const senderContent = sender ? JSON.parse(sender.content) : "";

          const zappedPost = zappedPosts.find((item) => {
            const e = post.tags.find((item) => item[0] === "e")
              ? post.tags.find((item) => item[0] === "e")![1]
              : "";
            return item.id === e;
          });

          const pr = providers.find(
            (provider) => provider.pubkey === post.pubkey,
          );
          const provider = pr ? JSON.parse(pr.content) : "";

          const pkey = post.tags.find((item) => item[0] === "p")![1];

          const receiver = receiverAuthors.find((item) => item.pubkey === pkey);

          const receiverContent = receiver ? JSON.parse(receiver.content) : "";

          return (
            <ZapTransfer
              key={indexOfZaps}
              created={createdTimes[indexOfZaps]}
              sender={senderContent}
              amount={amountReceivedZaps[indexOfZaps]}
              receiver={receiverContent}
              comment={sendersComments[indexOfZaps]}
              zappedPost={zappedPost ? zappedPost.content : ""}
              provider={provider}
              eventId={zappedPost ? zappedPost?.id : ""}
              senderPubkey={pk}
              mode={""}
            />
          );
        } else if (post.kind === 1) {
          const postAuthor = postsAuthors.find(
            (author) => author.pubkey === post.pubkey,
          );
          const authorContent = postAuthor
            ? JSON.parse(postAuthor.content)
            : {};

          return (
            <PostCard
              type="review"
              key={post.id}
              name={
                authorContent.display_name
                  ? authorContent.display_name
                  : authorContent.name
              }
              picture={authorContent.picture}
              about={post.content}
              pubkey={post.pubkey}
              eventId={post.id}
              createdDate={post.created_at ? post.created_at : 0}
              thread={""}
            />
          );
        } else {
          const postAuthor = postsAuthors.find(
            (author) => author.pubkey === post.pubkey,
          );
          const authorContent = postAuthor
            ? JSON.parse(postAuthor.content)
            : {};
          const title = getTag(post.tags, ["title", "name"]);
          const body = getTag(post.tags, [
            "summary",
            "description",
            "alt",
          ]).slice(0, 300);

          return (
            <PostCard
              type="review"
              kindName={getKindName(post.kind ?? 0)}
              key={post.id}
              name={
                authorContent.display_name
                  ? authorContent.display_name
                  : authorContent.name
              }
              picture={authorContent.picture}
              about={body || post.content}
              title={title}
              pubkey={post.pubkey}
              eventId={post.id}
              createdDate={post.created_at ? post.created_at : 0}
              thread={""}
            />
          );
        }
      })}
      {isLoading && (
        <div style={{ textAlign: "center" }}>
          <Spinner />
        </div>
      )}
    </>
  );
};

export default Review;
