import { Spinner } from "react-bootstrap";
import cl from "./Review.module.css";
import Search from "../../../components/Search/Search";
import { useEffect, useState } from "react";
import { getRuleType, ruleType, taskStatus } from "../../../types/types";
import { sendPostAuth } from "../../../http/http";
import { useAppSelector } from "../../../hooks/redux";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import PostCard from "../../../components/PostCard/PostCard";
import ZapTransfer from "../../../components/ZapTransfer/ZapTransfer";
import { getKindName } from "../../../utils/helper";
import { getZapAmount } from "../../../utils/zapFunctions";
import { getTag } from "../../../utils/getTags";
import ProfileItem from "../../../components/ProfileItem/ProfileItem";
import EventWrapper from "../../../components/EventWrapper/EventWrapper";

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
  const [approvedTasks, setApprovedTasks] = useState<string[]>([]);
  const url = `${process.env.REACT_APP_API_URL_RULES}/tasks`;

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

  const fetchEventsStatus = async (eventIds: string[]) => {
    try {
      const res = await sendPostAuth(
        ndk,
        store.pubkey,
        url,
        "GET",
        JSON.stringify(eventIds),
      );
      return res;
    } catch (e) {
      console.log(e);
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
      const tasksStatus: taskStatus[] = await fetchEventsStatus(
        events.map((event) => event.id),
      );
      const removedTasks = tasksStatus
        .filter((task) => task.status === "removed")
        .map((task) => task.eventId);
      const approvedTasks = tasksStatus
        .filter((task) => task.status === "approved")
        .map((task) => task.eventId);
      const filteredEvents = events.filter(
        (event) => !removedTasks.includes(event.id),
      );
      setApprovedTasks(approvedTasks);
      setEvents((prevState) =>
        removeDuplicates([...prevState, ...filteredEvents]),
      );
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

  const onApproveTask = async (id: string) => {
    try {
      const body = { eventId: id, status: "approved" };
      const res = await sendPostAuth(
        ndk,
        store.pubkey,
        url,
        "POST",
        JSON.stringify(body),
      );
      if (res?.id) {
        setApprovedTasks([...approvedTasks, id]);
      }
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  };

  const onRemoveTask = async (id: string) => {
    try {
      const body = { eventId: id, status: "removed" };
      const res = await sendPostAuth(
        ndk,
        store.pubkey,
        url,
        "POST",
        JSON.stringify(body),
      );
      const updatedEvents = events.filter((event) => event.id !== id);
      setEvents(updatedEvents);
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  };

  let indexOfZaps = -1;

  return (
    <>
      <Search isLoading={false} />
      <div className={cl.reviewHeader}>
        <h4>Review</h4>
      </div>
      {events.map((post) => {
        if (post.kind === 0) {
          const profileContent = JSON.parse(post.content);
          const isApproved = approvedTasks.includes(post.id);

          return (
            <EventWrapper
              isApproved={isApproved}
              onApproveTask={() => onApproveTask(post.id)}
              onRemoveTask={() => onRemoveTask(post.id)}
              type="review"
            >
              <ProfileItem
                img={profileContent.picture}
                pubKey={post.pubkey}
                bio={profileContent.about}
                name={
                  profileContent.display_name
                    ? profileContent.display_name
                    : profileContent.name
                }
                key={post.id}
                mail={profileContent.nip05}
              />
            </EventWrapper>
          );
        }
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
          const isApproved = approvedTasks.includes(post.id);

          return (
            <EventWrapper
              key={indexOfZaps}
              isApproved={isApproved}
              onApproveTask={() => onApproveTask(post.id)}
              onRemoveTask={() => onRemoveTask(post.id)}
              type="review"
            >
              <ZapTransfer
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
            </EventWrapper>
          );
        } else if (post.kind === 1) {
          const postAuthor = postsAuthors.find(
            (author) => author.pubkey === post.pubkey,
          );
          const authorContent = postAuthor
            ? JSON.parse(postAuthor.content)
            : {};
          const isApproved = approvedTasks.includes(post.id);

          return (
            <EventWrapper
              key={post.id}
              isApproved={isApproved}
              onApproveTask={() => onApproveTask(post.id)}
              onRemoveTask={() => onRemoveTask(post.id)}
              type="review"
            >
              <PostCard
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
            </EventWrapper>
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
          const isApproved = approvedTasks.includes(post.id);

          return (
            <EventWrapper
              key={post.id}
              isApproved={isApproved}
              onApproveTask={() => onApproveTask(post.id)}
              onRemoveTask={() => onRemoveTask(post.id)}
              type="review"
            >
              <PostCard
                kindName={getKindName(post.kind ?? 0)}
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
            </EventWrapper>
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
