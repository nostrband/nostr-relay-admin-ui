import NDK from "@nostrband/ndk";
import Events from "./Events/Events";

const Home = ({ ndk }: { ndk: NDK | null }) => {
  return <Events ndk={ndk} />;
};

export default Home;
