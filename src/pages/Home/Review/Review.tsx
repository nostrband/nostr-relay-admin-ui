import { Button } from "react-bootstrap";
import cl from "./Review.module.css";
import Search from "../../../components/Search/Search";
import { useEffect, useState } from "react";
import { Filter, getRuleType, ruleType } from "../../../types/types";
import { sendPostAuth } from "../../../http/http";
import { useAppSelector } from "../../../hooks/redux";

const Review = () => {
  const store = useAppSelector((store) => store.userReducer);
  const ndk = useAppSelector((store) => store.connectionReducer.ndk);
  const [defaultRelays, setDefaulRelays] = useState<string[]>([]);
  const [reviewRules, setReviewRules] = useState<ruleType[]>([]);

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

  useEffect(() => {
    if (store.pubkey) {
      fetchRules();
      fetchDefaultRelays();
    }
  }, [store.pubkey]);

  useEffect(() => {
    if (reviewRules) {
      const allRelays = Array.from(
        new Set(reviewRules.map((rule) => rule.filter.relays).flat()),
      );
      const relayFilter: { [key: string]: Filter[] } = {};

      for (const relay of allRelays) {
        if (relay) {
          Object.defineProperty(relayFilter, relay, {
            value: [],
            enumerable: true,
            writable: true,
          });
        }
      }

      if (Object.keys(relayFilter).length) {
        for (const relay in relayFilter) {
          for (let i = 0; i < reviewRules.length; i++) {
            if (reviewRules[i]?.relays?.includes(relay)) {
              relayFilter[relay] = [
                ...relayFilter[relay],
                reviewRules[i].filter,
              ];
            }
          }
        }
      }

      console.log(relayFilter);
    }
  }, [reviewRules]);

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
