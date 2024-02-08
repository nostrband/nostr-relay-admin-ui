import { Button } from "react-bootstrap";
import cl from "./Review.module.css";
import Search from "../../../components/Search/Search";
import { useEffect, useState } from "react";
import { ruleType } from "../../../types/types";
import { url } from "inspector";
import { sendPostAuth } from "../../../http/http";
import { useAppSelector } from "../../../hooks/redux";

const Review = () => {
  const store = useAppSelector((store) => store.userReducer);
  const ndk = useAppSelector((store) => store.connectionReducer.ndk);
  const [defaultRelays, setDefaulRelays] = useState<string[]>([]);
  const [rules, setRules] = useState<ruleType[]>([]);

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
      const data: ruleType[] = await sendPostAuth(
        ndk,
        store.pubkey,
        url,
        "GET",
      );
      setRules(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (store.pubkey) {
      fetchRules();
      fetchDefaultRelays();
    }
  }, [store.pubkey]);

  return (
    <>
      <Search isLoading={false} />
      <div className={cl.reviewHeader}>
        <h4>Review</h4>
        <Button variant="outline-danger">Delete all</Button>
      </div>
    </>
  );
};

export default Review;
