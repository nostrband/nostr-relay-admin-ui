import { useEffect, useMemo, useState } from "react";
import PostCard from "../../../components/PostCard/PostCard";
import { nip19 } from "nostr-tools";
import { extractNostrStrings } from "../../../utils/formatLink";
import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";
import { Button, Spinner } from "react-bootstrap";
import cl from "./Events.module.css";
import { useSearchParams } from "react-router-dom";
import { dateToUnix } from "nostr-react";
import { useAppSelector } from "../../../hooks/redux";

const Events = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<NDKEvent[]>([]);
  const [postsAuthors, setPostsAuthors] = useState<NDKEvent[]>([]);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [taggedProfiles, setTaggedProfiles] = useState<(NDKEvent | string)[]>(
    [],
  );
  const [limitPosts, setLimitPosts] = useState<number>(10);
  const [searchParams] = useSearchParams();
  const [isBottom, setIsBottom] = useState<boolean>(false);
  const search = searchParams.get("q");
  const ndk = useAppSelector((store) => store.connectionReducer.ndk);

  const handleScroll = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollBottom = scrollTop + windowHeight;
    if (scrollBottom >= documentHeight) {
      setIsBottom(true);
    } else {
      setIsBottom(false);
    }
  };

  const cleanSearch = useMemo(() => {
    return search
      ?.split(" ")
      .filter((str) =>
        str.includes("following:")
          ? !str.match(/following:npub[0-9a-zA-Z]+/g)
          : !str.match(/by:npub[0-9a-zA-Z]+/g),
      )
      .join(" ")
      .replace(/#[a-zA-Z0-9_]+/g, "")
      .replace(/lang:[a-zA-Z0-9_]+/g, "")
      .replace(/since:\d{4}-\d{2}-\d{2}/g, "")
      .replace(/until:\d{4}-\d{2}-\d{2}/g, "")
      .replace(/kind:\d+/g, "");
  }, [search]);

  const tagsWithHash = search
    ?.split(" ")
    .filter((s) => s.match(/#[a-zA-Z0-9_]+/g)?.toString());
  const tags = tagsWithHash?.map((tag) => tag.replace("#", ""));
  const langsWithPrefix = search
    ?.split(" ")
    .filter((s) => s.match(/lang:[a-zA-Z]+/g)?.toString());
  const langs = langsWithPrefix?.map((lang) => lang.replace("lang:", ""));
  const since = search?.match(/since:\d{4}-\d{2}-\d{2}/)
    ? dateToUnix(
        new Date(
          search?.match(/since:\d{4}-\d{2}-\d{2}/)![0].replace(/-/g, "/"),
        ),
      )
    : "";
  const until = search?.match(/until:\d{4}-\d{2}-\d{2}/)
    ? dateToUnix(
        new Date(
          search?.match(/until:\d{4}-\d{2}-\d{2}/)![0].replace(/-/g, "/"),
        ),
      )
    : "";

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMorePosts = () => {
    setLimitPosts((prevState) => prevState + 10);
  };
  useEffect(() => {
    if (isBottom) {
      if (postsCount - posts.length > 0 && !isLoading) {
        getMorePosts();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBottom]);
  useEffect(() => {
    if (ndk instanceof NDK) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limitPosts]);

  const fetchTaggedUsers = async (posts: NDKEvent[]) => {
    const postsLinks = posts
      .map((post) => extractNostrStrings(post.content))
      .flat();
    const notNpubLinks = postsLinks.filter((r) => !r.startsWith("npub"));
    const npubs = postsLinks.filter((r) => r.startsWith("npub"));
    const pubkeys = npubs.map((npub) => nip19.decode(npub).data);

    const postsTaggedUsers = Array.from(
      //@ts-ignore
      await ndk.fetchEvents({ kinds: [0], authors: pubkeys }),
    );
    const allPostsTagged = [...notNpubLinks, ...postsTaggedUsers];
  };
  const fetchPosts = async () => {
    try {
      if (ndk instanceof NDK) {
        setIsLoading(true);
        const filter = { kinds: [1], limit: limitPosts };
        if (cleanSearch?.trim()) {
          Object.defineProperty(filter, "search", {
            value: cleanSearch.trimStart().trimEnd(),
            enumerable: true,
          });
        }

        if (tags?.length) {
          Object.defineProperty(filter, "#t", {
            value: tags,
            enumerable: true,
          });
        }

        if (since) {
          Object.defineProperty(filter, "since", {
            value: since,
            enumerable: true,
          });
          if (!until) {
            Object.defineProperty(filter, "until", {
              value: dateToUnix(new Date()),
              enumerable: true,
            });
          }
        }

        if (until) {
          Object.defineProperty(filter, "until", {
            value: until,
            enumerable: true,
          });
        }

        if (langs?.length) {
          Object.defineProperty(filter, "@lang", {
            value: langs,
            enumerable: true,
          });
        }

        if (search?.includes("following:")) {
          const userNpub = search?.match(/npub[0-9a-zA-Z]+/g)![0];
          const userPk = userNpub ? nip19.decode(userNpub).data : "";

          const userContacts = await ndk.fetchEvent({
            kinds: [3],
            //@ts-ignore
            authors: [userPk],
          });
          const followingPubkeys = userContacts
            ? userContacts?.tags.slice(0, 500).map((contact) => contact[1])
            : [];

          if (followingPubkeys.length) {
            Object.defineProperty(filter, "authors", {
              value: followingPubkeys,
              enumerable: true,
            });
          }
          const posts = Array.from(await ndk.fetchEvents(filter));
          const countFilter = { ...filter, limit: 10000 };
          const postsCount = await ndk.pool.relays
            .get("wss://relay.nostr.band")
            ?.connectivity?.relay?.count([countFilter]);
          console.log("Posts counts: ", postsCount);
          setPostsCount(postsCount?.count ?? 0);
          const postsAuthorsPks = posts.map((post) => post.pubkey);
          const postsAuthors = Array.from(
            await ndk.fetchEvents({
              kinds: [0],
              authors: postsAuthorsPks,
              limit: 10,
            }),
          );
          fetchTaggedUsers(posts);
          setPosts(posts);
          setPostsAuthors(postsAuthors);
        } else if (search?.includes("by:")) {
          const userNpub = search?.match(/npub[0-9a-zA-Z]+/g)![0];
          const userPk = userNpub ? nip19.decode(userNpub).data.toString() : "";

          if (userPk) {
            Object.defineProperty(filter, "authors", {
              value: [userPk],
              enumerable: true,
            });
          }

          console.log("postsFilter", filter);

          const posts = Array.from(await ndk.fetchEvents(filter));
          fetchTaggedUsers(posts);
          const countFilter = { ...filter, limit: 10000 };
          const postsCount = await ndk.pool.relays
            .get("wss://relay.nostr.band")
            ?.connectivity?.relay?.count([countFilter]);
          setPostsCount(postsCount?.count ?? 0);

          const postsAuthorsPks = posts.map((post) => post.pubkey);
          const postsAuthors = Array.from(
            await ndk.fetchEvents({
              kinds: [0],
              authors: postsAuthorsPks,
              limit: 10,
            }),
          );
          setPosts(posts);
          setPostsAuthors(postsAuthors);
        } else {
          const posts = Array.from(await ndk.fetchEvents(filter));
          fetchTaggedUsers(posts);
          const postsAuthorsPks = posts.map((post) => post.pubkey);
          const postsAuthors = Array.from(
            await ndk.fetchEvents({ kinds: [0], authors: postsAuthorsPks }),
          );
          setPosts(posts);
          setPostsAuthors(postsAuthors);
          const countFilter = { ...filter, limit: 10000 };
          const postsCount = await ndk.pool.relays
            .get("wss://relay.nostr.band")
            ?.connectivity?.relay?.count([countFilter]);
          setPostsCount(postsCount?.count ?? 0);
        }

        setIsLoading(false);
      }
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    if (ndk instanceof NDK) {
      if (limitPosts !== 10) {
        setLimitPosts(10);
      } else {
        fetchPosts();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ndk, searchParams.get("q")]);

  return (
    <>
      <div className={cl.eventsHeader}>
        <h4>Events</h4>
        <Button variant="outline-danger">Delete all</Button>
      </div>
      {posts?.length
        ? posts.map((post) => {
            const postAuthor = postsAuthors.find(
              (author) => author.pubkey === post.pubkey,
            );
            const authorContent = postAuthor
              ? JSON.parse(postAuthor?.content)
              : {};
            return (
              <PostCard
                type="events"
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

export default Events;
