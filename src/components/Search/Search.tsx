import "./Search.css";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { Button } from "react-bootstrap";
import { Search as SearchIcon } from "react-bootstrap-icons";
import Spinner from "react-bootstrap/Spinner";
import { FC, useEffect, useRef, useState } from "react";
import {
  useNavigate,
  useSearchParams,
  createSearchParams,
} from "react-router-dom";
import React from "react";
import { formatDate } from "../../utils/formatDate";
import { getKindNumber } from "../../utils/helper";

type searchTypes = {
  isLoading: boolean;
  placeholder?: string;
};

type tagType = {
  value: number;
  label: string;
};

const Search: FC<searchTypes> = ({ isLoading, placeholder }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(
    searchParams.get("q") ? searchParams.get("q") : "",
  );
  const [selectValue, setSelectValue] = useState(
    searchParams.get("type") ? searchParams.get("type") : "",
  );
  const [allSearch, setAllSearch] = useState("");
  const [author, setAuthor] = useState("");
  const [following, setFollowing] = useState("");
  const [lang, setLang] = useState("");
  const [lna, setLna] = useState("");
  const [nip05, setNip05] = useState("");
  const [isSpam, setIsSpam] = useState(false);
  const [resultQuery, setResultQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [sinceDate, setSinceDate] = useState<Date | null>(null);
  const [isValidAuthor, setIsValidAuthor] = useState(true);
  const [isValidFollowing, setIsValidFollowing] = useState(true);
  const [newTags, setNewTags] = useState<tagType[]>([]);
  const [langs, setLangs] = useState<tagType[]>([]);
  const [kinds, setKinds] = useState<tagType[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(searchParams.get("q"));
  }, [searchParams.get("q")]);

  useEffect(() => {
    const tagsWithHash = newTags.map((tag) => "#" + tag.label).join(" ");
    const kindsNumbers = kinds
      .map((kind) => "kind:" + getKindNumber(kind.label))
      .join(" ");

    setResultQuery(
      `${allSearch ? allSearch + " " : ""}${
        author && isValidAuthor ? "by:" + author + " " : ""
      }${following && isValidFollowing ? "following:" + following + " " : ""}${
        langs ? langs.map((lang) => "lang:" + lang.label).join(" ") + " " : ""
      }${lna ? "lna:" + lna + " " : ""}${nip05 ? "nip05:" + nip05 + " " : ""}${
        newTags ? tagsWithHash + " " : ""
      }${kinds ? kindsNumbers + " " : ""}${
        sinceDate
          ? "since:" +
            formatDate(
              new Date(
                Date.UTC(
                  sinceDate.getFullYear(),
                  sinceDate.getMonth(),
                  sinceDate.getDate(),
                ),
              ),
            ) +
            " "
          : ""
      }${
        startDate
          ? "until:" +
            formatDate(
              new Date(
                Date.UTC(
                  startDate.getFullYear(),
                  startDate.getMonth(),
                  startDate.getDate(),
                ),
              ),
            ) +
            " "
          : ""
      }${isSpam ? "-filter:spam" : ""}`.trim(),
    );
  }, [
    allSearch,
    author,
    following,
    lang,
    lna,
    nip05,
    isSpam,
    newTags,
    sinceDate,
    startDate,
    isValidFollowing,
    isValidAuthor,
    langs,
    kinds,
  ]);

  useEffect(() => {
    if (resultQuery) {
      setInputValue(resultQuery);
    }
  }, [resultQuery]);

  const searchHandleByEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchParams.set("q", inputValue ?? "");
      setSearchParams(searchParams);
    }
  };

  const searchHandle = () => {
    searchParams.set("q", inputValue ?? "");
    setSearchParams(searchParams);
  };

  const searchAdvanceHandle = () => {
    navigate({
      pathname: "/",
      search: resultQuery
        ? createSearchParams({ q: resultQuery }).toString()
        : "",
    });
  };

  const theDayBeforeStartDate = new Date(startDate ?? "");
  const theDayAfterSinceDate = new Date(sinceDate ?? "");

  const handleLanguage = (lang: string) => {
    if (allSearch.includes(`lang:${lang}`)) {
      setAllSearch((prevState) => prevState.replace(`lang:${lang}`, ""));
    } else {
      setAllSearch((prevState) =>
        prevState.concat(` lang:${lang}`).trimStart(),
      );
    }
  };

  return (
    <>
      {
        <InputGroup className="mb-3" id="search-input">
          <Form.Control
            className="searchInput"
            value={inputValue ? inputValue : ""}
            ref={inputRef}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              placeholder
                ? `${placeholder}`
                : "Keyword, hashtag, pubkey or post ID"
            }
            aria-label="Recipient's username"
            aria-describedby="basic-addon2"
            onKeyDown={searchHandleByEnter}
          />
          {isLoading && (
            <div className="loader">
              <Spinner size="sm" animation="border" color="var(--body-color)" />
            </div>
          )}

          {/* <div
            id="dropdown-basic"
            style={{ borderColor: theme === "dark" ? "white" : "#6c757d" }}
          >
            <Form.Select
              className="seachSelect"
              color="white"
              onChange={(e) => setSelectValue(e.currentTarget.value)}
              value={selectValue ? selectValue : ""}
            >
              <option value="">All</option>
              <option value="posts">Posts</option>
              <option value="profiles">Profiles</option>
              <option value="zaps">Zaps</option>
            </Form.Select>
          </div> */}
          <Button
            className="btn"
            id="search-btn"
            variant={"outline-secondary"}
            onClick={searchHandle}
          >
            <SearchIcon color={"black"} />
          </Button>
        </InputGroup>
      }
    </>
  );
};

export default Search;
