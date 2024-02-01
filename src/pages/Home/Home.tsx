import NDK from "@nostrband/ndk";
import Events from "./Events/Events";
import "./Home.css";
import { Button } from "react-bootstrap";
import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Settings from "./Settings/Settings";

const Home = () => {
  const [searchParams] = useSearchParams();
  const [panel, setPanel] = useState(
    searchParams.get("trending") ? searchParams.get("trending") : "people",
  );

  useEffect(() => {
    if (searchParams.get("panel")) {
      setPanel(searchParams.get("panel"));
    } else {
      setPanel("events");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("panel")]);

  return (
    <div className="home-hero">
      <div className="home-hero__links">
        <Link to={`/?panel=review`}>
          <Button variant={`${panel === "review" ? "primary" : "link"}`}>
            Review
          </Button>
        </Link>
        <Link to={`/?panel=events`}>
          <Button variant={`${panel === "events" ? "primary" : "link"}`}>
            Events
          </Button>
        </Link>
        <Link to={`/?panel=settings`}>
          <Button variant={`${panel === "settings" ? "primary" : "link"}`}>
            Settings
          </Button>
        </Link>
      </div>
      <div className="home-profiles">
        {panel === "events" ? (
          <Events />
        ) : panel === "settings" ? (
          <Settings />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default Home;
