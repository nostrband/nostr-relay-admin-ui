import "./Search.css";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { Button } from "react-bootstrap";
import { Search as SearchIcon } from "react-bootstrap-icons";
import Spinner from "react-bootstrap/Spinner";
import { FC, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import React from "react";

type searchTypes = {
  isLoading: boolean;
  placeholder?: string;
};

const Search: FC<searchTypes> = ({ isLoading, placeholder }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(
    searchParams.get("q") ? searchParams.get("q") : "",
  );

  const [resultQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(searchParams.get("q"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("q")]);

  useEffect(() => {
    if (resultQuery) {
      setInputValue(resultQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
