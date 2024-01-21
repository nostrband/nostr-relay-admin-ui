import { useEffect, useLayoutEffect, useState } from "react";
import TagInput from "../../../components/TagInput/TagInput";
import cl from "./Settings.module.css";
import { ruleType } from "../../../types/types";
import { Button, Form, Table } from "react-bootstrap";
import {
  Check2Square,
  Gear,
  Pencil,
  PlusCircle,
  XSquare,
} from "react-bootstrap-icons";
import { useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import ReactModal from "react-modal";
import {
  allLetters,
  kindsSuggestions,
  relaysSuggestions,
} from "../../../utils/inputSuggestions";
import Rule from "../../../models/RuleModel";

const animatedComponents = makeAnimated();

type tagType = {
  value: number;
  label: string;
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
  const [types, setTypes] = useState<tagType[]>([]);
  const [selectedRelays, setSelectedRelays] = useState<tagType[]>([]);
  const [authors, setAuthors] = useState<string>("");
  const [ids, setIds] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [sinceDate, setSinceDate] = useState<Date | null>(null);
  const [isModal, setIsModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [selectTypeValue, setSelectTypeValue] = useState<OptionType | null>();
  const [letterValues, setLetterValues] = useState<{ [key: string]: string }>(
    {},
  );
  const [selectedLetters, setSelectedLetters] = useState<OptionType[] | null>(
    null,
  );
  const [isEditActive, setIsEditActive] = useState(false);
  const [isEditRelays, setIsEditRelays] = useState(false);
  const [modalType, setModalType] = useState("editType");
  const [rules, setRules] = useState<ruleType[]>([
    {
      id: 1,
      name: "Rule 1",
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
      id: 2,
      name: "Rule 2",
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
      id: 3,
      name: "Rule 3",
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

  const handleLetterChange = (selectedOptions: OptionType[] | null) => {
    setSelectedLetters(selectedOptions);
  };
  const handleTypeChange = (selectedOption: OptionType | null) => {
    setSelectTypeValue(selectedOption);
  };

  const handleValueChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    letter: string,
  ) => {
    const newLetterValues = { ...letterValues, [letter]: event.target.value };
    setLetterValues(newLetterValues);
  };

  useLayoutEffect(() => {
    const rule = selectedRule;
    if (rule) {
      setSelectedRule(rule);
    } else {
      const importRule = rules.find((r) => r.id === 1);
      setSelectedRule(importRule);
    }
  }, []);

  const closeModal = () => setIsModal(false);

  useEffect(() => {
    const rule = selectedRule;
    setSelectedRule(rule);
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
    setRuleName(rule?.name ?? "");
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
  }, [selectedRule]);

  useEffect(() => {
    const currentRule = rules.find(
      (rule) => rule.id === Number(searchParams.get("ruleId")),
    );
    if (currentRule) {
      const updatedLetterValues: { [key: string]: string } = {};
      Object.keys(currentRule.filter).forEach((key) => {
        const value = currentRule.filter[key]?.[0] || "";
        updatedLetterValues[key] = value;
      });

      setLetterValues(updatedLetterValues);
    }
  }, [selectedRule]);

  const cancelRelaysEdit = () => {
    setIsEditRelays(false);
  };

  const theDayBeforeStartDate = new Date(startDate ?? "");
  const theDayAfterSinceDate = new Date(sinceDate ?? "");

  const openAddModal = () => {
    setSelectedRule(new Rule());
    setIsEditActive(true);
    setModalType("addModal");
    setIsModal(true);
  };

  const addRule = () => {
    const newRule = new Rule();
    newRule.setName(ruleName);
    newRule.setType(selectTypeValue?.value ?? "");
    newRule.filter = {
      kinds: kinds.map((k) => k.label),
      relays: relays.map((r) => r.label),
    };
    setRules((prevState) => [...prevState, newRule]);
    setIsModal(false);
    setIsEditActive(false);
    setModalType("editType");
  };

  return (
    <div className={cl.settings}>
      <h4>Settings</h4>
      <div className={cl.relays}>
        <h5>Relays</h5>

        <div className={cl.relaysControl}>
          <div className={cl.relaysControlInput}>
            <TagInput
              disabled={!isEditRelays}
              tags={relays}
              setTags={setRelays}
              suggestions={relaysSuggestions}
              placeholder="Default relays"
            />
          </div>
          <div className={cl.relaysBtn}>
            {!isEditRelays ? (
              <Button onClick={() => setIsEditRelays(true)}>
                <Gear />
              </Button>
            ) : (
              <>
                <Button variant="outline-success">
                  <Check2Square />
                </Button>
                <Button onClick={cancelRelaysEdit} variant="outline-danger">
                  <XSquare />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={cl.rules}>
        <div className={cl.rulesHeader}>
          <h5>Rules</h5>
          <Button onClick={openAddModal} size="sm" variant="outline-success">
            <PlusCircle />
          </Button>
        </div>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Rule</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, index) => {
              return (
                <tr
                  key={rule.id}
                  onClick={() => {
                    setSelectedRule(rule);
                    setModalType("editType");
                    setIsModal(true);
                  }}
                >
                  <td>{index + 1}</td>
                  <td>{rule.name}</td>
                  <td>{rule.type}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <ReactModal
          onAfterOpen={() => {
            document.body.style.overflow = "hidden";
          }}
          onAfterClose={() => {
            document.body.style.overflow = "auto";
          }}
          ariaHideApp={false}
          className={cl.modal}
          style={{ overlay: { zIndex: 6, background: "rgba(0,0,0,0.4)" } }}
          contentLabel="Embed"
          isOpen={isModal}
          onRequestClose={closeModal}
        >
          {selectedRule && (
            <div className={cl.selectedRule}>
              <Form.Group
                className="mb-1"
                controlId="exampleForm.ControlInput1"
              >
                <Form.Control
                  disabled={!isEditActive}
                  placeholder="Rule name"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
                <Form.Label>Example: Rule 1</Form.Label>
                <Select
                  required
                  value={selectTypeValue}
                  placeholder="Type"
                  onChange={handleTypeChange}
                  options={[
                    { value: "import", label: "Import" },
                    { value: "review", label: "Review" },
                    { value: "block", label: "Block" },
                  ]}
                />
                <Form.Label>Example: import, review or block</Form.Label>
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
                {!isEditActive && modalType === "editType" ? (
                  <Button onClick={() => setIsEditActive(true)}>
                    <Pencil />
                  </Button>
                ) : (
                  <>
                    {modalType === "editType" ? (
                      <Button variant="success">Save</Button>
                    ) : (
                      <Button variant="success" onClick={addRule} type="submit">
                        Add Rule
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      style={{ marginLeft: ".5rem" }}
                      onClick={() => {
                        setIsEditActive(false);
                        setIsModal(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </ReactModal>
      </div>
    </div>
  );
};

export default Settings;
