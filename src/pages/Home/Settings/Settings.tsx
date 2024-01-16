import { useEffect, useState } from "react";
import TagInput from "../../../components/TagInput/TagInput";
import cl from "./Settings.module.css";
import { ruleType } from "../../../types/types";
import { Button, Form } from "react-bootstrap";
import { Download, EyeFill, LockFill } from "react-bootstrap-icons";
import { useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";

type tagType = {
  value: number;
  label: string;
};

type letterType = {
  key: string;
  value: string[];
};

const Settings = () => {
  const [relays, setRelays] = useState<tagType[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRule, setSelectedRule] = useState<ruleType>();
  const [kinds, setKinds] = useState<tagType[]>([]);
  const [selectedRelays, setSelectedRelays] = useState<tagType[]>([]);
  const [authors, setAuthors] = useState<string>("");
  const [ids, setIds] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [sinceDate, setSinceDate] = useState<Date | null>(null);
  const [letters, setLetters] = useState<letterType[]>([]);
  const [rules, setRules] = useState<ruleType[]>([
    {
      type: "import",
      filter: {
        relays: ["Реле 1"],
        kinds: ["Profiles"],
        authors: ["author1"],
        "#a": ["valueA"],
        "#b": ["valueB"],
      },
    },
    {
      type: "review",
      filter: {
        relays: ["Реле 2"],
        kinds: ["Posts"],
        authors: ["author2"],
        "#c": ["valueC"],
        "#d": ["valueD"],
      },
    },
    {
      type: "block",
      filter: {
        relays: ["Реле 2"],
        kinds: ["kind2"],
        authors: ["author2"],
        "#c": ["valueC"],
        "#d": ["valueD"],
      },
    },
  ]);
  const kindsSuggestions = [
    {
      value: 1,
      label: "Profiles",
    },
    {
      value: 2,
      label: "Posts",
    },
    {
      value: 3,
      label: "Zaps",
    },
  ];
  const relaysSuggestions = [
    {
      value: 1,
      label: "relay.damus.io",
    },
    {
      value: 2,
      label: "relay.nostr.ai",
    },
    {
      value: 3,
      label: "wss://relay.nostr.band",
    },
  ];

  const allLetters = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  useEffect(() => {
    const rule = rules.find((r) => r.type === searchParams.get("rule"));
    setKinds(
      rule?.filter.kinds?.map((k, i) => {
        return { value: i, label: k };
      }) ?? [],
    );
    setSelectedRelays(
      rule?.filter.relays?.map((k, i) => {
        return { value: i, label: k };
      }) ?? [],
    );
    setSelectedRule(rule);
  }, [searchParams.get("rule")]);

  const setSelectedRuleType = (rule: string) => {
    searchParams.set("rule", rule);
    setSearchParams(searchParams);
  };

  const theDayBeforeStartDate = new Date(startDate ?? "");
  const theDayAfterSinceDate = new Date(sinceDate ?? "");

  return (
    <div className={cl.settings}>
      <h4>Settings</h4>
      <div className={cl.settingsContent}>
        <div className={cl.relays}>
          <h5>Relays</h5>
          <TagInput
            tags={relays}
            setTags={setRelays}
            suggestions={relaysSuggestions}
            placeholder="Relays"
          />
        </div>
        <div className={cl.rules}>
          <h5>Rules</h5>
          {/* {rules ? rules.map((rule, index) => {
                return(
                    <div key={index} className={cl.rule}>
                        <div className={cl.ruleType}>
                            Type: <b>{rule.type}</b>
                        </div>
                        <div className={cl.ruleFilter}>
                            Filter: {JSON.stringify(rule.filter, null, 2)}
                        </div>
                    </div>
                );
            }) : ""} */}
          <div>
            <Button
              variant={`${
                searchParams.get("rule") === "import" ? "outline-dark" : "light"
              }`}
              onClick={() => setSelectedRuleType("import")}
            >
              Import <Download />
            </Button>
            <Button
              variant={`${
                searchParams.get("rule") === "review" ? "outline-dark" : "light"
              }`}
              onClick={() => setSelectedRuleType("review")}
            >
              Review <EyeFill />
            </Button>
            <Button
              variant={`${
                searchParams.get("rule") === "block" ? "outline-dark" : "light"
              }`}
              onClick={() => setSelectedRuleType("block")}
            >
              Block <LockFill />
            </Button>
          </div>
          {selectedRule && (
            <div className={cl.selectedRule}>
              <h6>Type: {selectedRule.type}</h6>
              <Form.Group
                className="mb-1"
                controlId="exampleForm.ControlInput1"
              >
                <TagInput
                  suggestions={kindsSuggestions}
                  placeholder="Kind"
                  tags={kinds}
                  setTags={setKinds}
                />
                <Form.Label>Example: profiles, posts</Form.Label>
                <TagInput
                  suggestions={relaysSuggestions}
                  placeholder="Relays"
                  tags={selectedRelays}
                  setTags={setSelectedRelays}
                />
                <Form.Label>
                  Example: wss://relay.nostr.band, relay.damus.io
                </Form.Label>
                <Form.Control
                  placeholder="Authors"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                />
                <Form.Label>Example: npubX</Form.Label>
                <Form.Control
                  placeholder="Ids"
                  value={ids}
                  onChange={(e) => setIds(e.target.value)}
                />
                <Form.Label>Example: noteX</Form.Label>
                <div className="datePicker">
                  <div className="date-picker-wrapper">
                    <DatePicker
                      placeholderText="Since"
                      className="datePickerInput"
                      selected={sinceDate}
                      onChange={setSinceDate}
                      dateFormat="yyyy-MM-dd"
                      maxDate={
                        startDate !== null
                          ? theDayBeforeStartDate.setDate(
                              startDate.getDate() - 1,
                            )
                          : new Date()
                      }
                      minDate={new Date("2023-01-01")}
                    />
                  </div>
                  <div
                    className="date-picker-wrapper"
                    style={{ marginLeft: ".3rem" }}
                  >
                    <DatePicker
                      placeholderText={"Until"}
                      className="datePickerInput"
                      selected={startDate}
                      onChange={setStartDate}
                      dateFormat="yyyy-MM-dd"
                      maxDate={new Date()}
                      minDate={
                        sinceDate !== null
                          ? theDayAfterSinceDate.setDate(
                              sinceDate.getDate() + 1,
                            )
                          : new Date("2023-01-01")
                      }
                    />
                  </div>
                </div>
              </Form.Group>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
