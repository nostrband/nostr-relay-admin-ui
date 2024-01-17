import { useEffect, useState } from "react";
import TagInput from "../../../components/TagInput/TagInput";
import cl from "./Settings.module.css";
import { ruleType } from "../../../types/types";
import { Button, Form } from "react-bootstrap";
import {
  Download,
  EyeFill,
  LockFill,
  Pencil,
} from "react-bootstrap-icons";
import { useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import Select, { ActionMeta } from "react-select";
import makeAnimated from "react-select/animated";

const animatedComponents = makeAnimated();

type tagType = {
  value: number;
  label: string;
};

type letterType = {
  key: string;
  value: string[];
};

interface OptionType {
  value: string;
  label: string;
}

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
  const [letterValues, setLetterValues] = useState<{ [key: string]: string }>(
    {},
  );
  const [selectedLetters, setSelectedLetters] = useState<OptionType[] | null>(
    null,
  );
  const [isEditActive, setIsEditActive] = useState(false);
  const [rules, setRules] = useState<ruleType[]>([
    {
      type: "import",
      filter: {
        relays: ["Реле 1"],
        kinds: ["Profiles"],
        authors: ["author1, author2"],
        ids: ["id1, id2"],
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
        "#f": ["valueF"],
        "#j": ["valueJ"],
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

  const handleLetterChange = (
    selectedOptions: OptionType[] | null,
    actionMeta: ActionMeta<OptionType>,
  ) => {
    setSelectedLetters(selectedOptions);
  };

  const handleValueChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    letter: string,
  ) => {
    const newLetterValues = { ...letterValues, [letter]: event.target.value };
    setLetterValues(newLetterValues);
  };

  useEffect(() => {
    setIsEditActive(false);
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
    if (rule) {
      const updatedSelectedLetters = allLetters
        .filter((letter) => rule.filter[`#${letter}`]?.[0] !== undefined)
        .map((letter) => ({ value: `#${letter}`, label: `#${letter}` }));
      setSelectedLetters(updatedSelectedLetters);

      Object.keys(rule.filter).forEach((key) => {
        const value = rule.filter[key]?.[0] || "";
        setLetterValues((prevValues) => ({ ...prevValues, [key]: value }));
      });
    }
    setAuthors(rule?.filter.authors?.toString() ?? "");
    setIds(rule?.filter.ids?.toString() ?? "");
    setSelectedRule(rule);
  }, [searchParams.get("rule")]);

  useEffect(() => {
    const currentRule = rules.find(
      (rule) => rule.type === searchParams.get("rule"),
    );
    if (currentRule) {
      const updatedLetterValues: { [key: string]: string } = {};

      // Только те буквы, которые есть в текущем правиле
      Object.keys(currentRule.filter).forEach((key) => {
        const value = currentRule.filter[key]?.[0] || "";
        updatedLetterValues[key] = value;
      });

      setLetterValues(updatedLetterValues);
    }
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
            disabled={!isEditActive}
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
                  disabled={!isEditActive}
                  suggestions={kindsSuggestions}
                  placeholder="Kind"
                  tags={kinds}
                  setTags={setKinds}
                />
                <Form.Label>Example: profiles, posts</Form.Label>
                <TagInput
                  disabled={!isEditActive}
                  suggestions={relaysSuggestions}
                  placeholder="Relays"
                  tags={selectedRelays}
                  setTags={setSelectedRelays}
                />
                <Form.Label>
                  Example: wss://relay.nostr.band, relay.damus.io
                </Form.Label>
                <Form.Control
                  disabled={!isEditActive}
                  placeholder="Authors"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                />
                <Form.Label>Example: npub1xxx</Form.Label>
                <Form.Control
                  disabled={!isEditActive}
                  placeholder="Ids"
                  value={ids}
                  onChange={(e) => setIds(e.target.value)}
                />
                <Form.Label>Example: note1xxx</Form.Label>
                <div className="datePicker">
                  <div className="date-picker-wrapper">
                    <DatePicker
                      readOnly={!isEditActive}
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
                      readOnly={!isEditActive}
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
                <Select
                  isDisabled={!isEditActive}
                  className={cl.selectDropdown}
                  components={animatedComponents}
                  isMulti
                  //@ts-ignore
                  options={allLetters.map((letter) => ({
                    value: `#${letter}`,
                    label: `#${letter}`,
                  }))}
                  value={selectedLetters}
                  //@ts-ignore
                  onChange={handleLetterChange}
                />
                {selectedLetters && selectedLetters.length > 0 && (
                  <div>
                    {selectedLetters.map(({ value: letter }, index) => (
                      <div key={letter}>
                        <Form.Label className="mt-3 mb-0">
                          Enter values for {letter} separated by commas:
                        </Form.Label>
                        <Form.Control
                          disabled={!isEditActive}
                          type="text"
                          placeholder={`e.g., value1, value2, value3...`}
                          value={letterValues[letter] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleValueChange(e, letter)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>
              <div className={cl.controlPanel}>
                {!isEditActive ? (
                  <Button onClick={() => setIsEditActive(true)}>
                    <Pencil />
                  </Button>
                ) : (
                  <>
                    <Button variant="success">Save</Button>
                    <Button
                      variant="danger"
                      style={{ marginLeft: ".5rem" }}
                      onClick={() => setIsEditActive(false)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
