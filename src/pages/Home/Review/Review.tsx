import { Button, Spinner } from "react-bootstrap";
import cl from "./Review.module.css";
import Search from "../../../components/Search/Search";
import { useEffect, useState } from "react";
import { getRuleType, ruleType } from "../../../types/types";
import { sendPostAuth } from "../../../http/http";
import { useAppSelector } from "../../../hooks/redux";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import PostCard from "../../../components/PostCard/PostCard";

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

  const fetchEvents = async (pair: IPair) => {
    try {
      const relays = pair.relay;
      //@ts-ignore
      ndk.explicitRelayUrls = [relays];
      const events = Array.from(await ndk.fetchEvents(pair.filters));
      setEvents((prevState) => [...prevState, ...events]);
      console.log(pair);

      const postsAuthorsPks = events.map((post) => post.pubkey);
      const postsAuthors = Array.from(
        await ndk.fetchEvents({
          kinds: [0],
          authors: postsAuthorsPks,
          limit: 100,
        }),
      );
      setPostsAuthors((prevState) => [...prevState, ...postsAuthors]);
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

  return (
    <>
      <Search isLoading={false} />
      <div className={cl.reviewHeader}>
        <h4>Review</h4>
      </div>
      {events?.length
        ? events.map((post) => {
            const postAuthor = postsAuthors.find(
              (author) => author.pubkey === post.pubkey,
            );
            const authorContent = postAuthor
              ? JSON.parse(postAuthor?.content)
              : {};
            return (
              <PostCard
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
          })
        : ""}
      {isLoading && (
        <div style={{ textAlign: "center" }}>
          <Spinner />
        </div>
      )}
    </>
  );
};

export default Review;
