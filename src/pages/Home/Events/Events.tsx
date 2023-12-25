import { useEffect, useState } from "react";
import PostCard from "../../../components/PostCard/PostCard";
import { nostrApiType } from "../../../types/types";
import axios from "axios";
import { nip19 } from "@nostrband/nostr-tools";
import { extractNostrStrings } from "../../../utils/formatLink";
import NDK, { NDKEvent } from "@nostrband/ndk";
import { Spinner } from "react-bootstrap";

const Events = ({ ndk }: { ndk: NDK | null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<nostrApiType[]>([]);
  const [taggedProfiles, setTaggedProfiles] = useState<(NDKEvent | string)[]>(
    [],
  );
  const fetchPosts = async () => {
    if (ndk instanceof NDK) {
      try {
        setIsLoading(true);
        const { data } = await axios.get<{ notes: nostrApiType[] }>(
          `${process.env.REACT_APP_API_URL}/trending/notes`,
        );

        const postsLinks = data.notes
          .map((post: nostrApiType) => extractNostrStrings(post.event.content))
          .flat();
        const notNpubLinks = postsLinks.filter((r) => !r.startsWith("npub"));
        const npubs = postsLinks.filter((r) => r.startsWith("npub"));
        const pubkeys = npubs.map((npub) => nip19.decode(npub).data);

        const postsTaggedUsers = Array.from(
          //@ts-ignore
          await ndk.fetchEvents({ kinds: [0], authors: pubkeys }),
        );
        const allPostsTagged = [...notNpubLinks, ...postsTaggedUsers];

        setTaggedProfiles(allPostsTagged);
        setPosts(data.notes);
        // console.log(data);
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    }
  };
  useEffect(() => {
    fetchPosts();
  }, [ndk]);

  return (
    <>
      {posts && posts.length ? (
        posts.map((post) => {
          const authorContent = post?.author?.content
            ? JSON.parse(post.author.content)
            : {};
          return (
            <PostCard
              taggedProfiles={taggedProfiles}
              key={post.id}
              name={
                authorContent?.display_name
                  ? authorContent?.display_name
                  : authorContent?.name
              }
              about={post.event.content}
              picture={authorContent?.picture}
              pubkey={post.pubkey}
              eventId={post.event.id}
              createdDate={post.event.created_at}
              thread={""}
            />
          );
        })
      ) : (
        <Spinner />
      )}
    </>
  );
};

export default Events;
