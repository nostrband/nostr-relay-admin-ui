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
  Trash,
  X,
  XSquare,
} from "react-bootstrap-icons";
import { useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import Select from "react-select";
import ReactModal from "react-modal";
import {
  allLetters,
  kindsSuggestions,
  relaysSuggestions,
} from "../../../utils/inputSuggestions";
import Rule from "../../../models/Rule.model";
import { sendPostAuth } from "../../../http/http";
import { useAppSelector } from "../../../hooks/redux";
import { dateToUnix } from "nostr-react";
import { toast } from "react-toastify";
import { ThreeDots } from "react-loader-spinner";
import { getKindName, getKindNumber } from "../../../utils/helper";
import { NDKFilter } from "@nostr-dev-kit/ndk";

type tagType = {
  value: number;
  label: string;
};

interface OptionType {
  value: string;
  label: string;
}

interface TableData {
  letter: string;
  value: string;
}

const Settings = () => {
  const [relays, setRelays] = useState<tagType[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRule, setSelectedRule] = useState<ruleType>();
  const [kinds, setKinds] = useState<tagType[]>([]);
  const [types, setTypes] = useState<tagType[]>([]);
  const [selectedRelays, setSelectedRelays] = useState<tagType[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [ids, setIds] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [untilDate, setUntilDate] = useState<Date | null>(null);
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
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [rules, setRules] = useState<ruleType[]>([]);
  const [isFormValidate, setIsFormValidate] = useState(false);
  const { ndk } = useAppSelector((store) => store.connectionReducer);
  const [isLoading, setIsLoading] = useState(false);
  const store = useAppSelector((store) => store.userReducer);
  const url = `${process.env.REACT_APP_API_URL_RULES}/rules`;
  const urlRelays = `${process.env.REACT_APP_API_URL_RULES}/relays`;

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

  const fetchRules = async () => {
    if (store.pubkey) {
      const data: ruleType[] = await sendPostAuth(
        ndk,
        store.pubkey,
        url,
        "GET",
      );
      setRules(data);
    }
  };
  const fetchRelays = async () => {
    if (store.pubkey) {
      try {
        setIsLoading(isLoading);
        const data: string[] = await sendPostAuth(
          ndk,
          store.pubkey,
          urlRelays,
          "GET",
        );
        const relays: tagType[] = data?.length
          ? data.map((relay, index) => {
              const value = relaysSuggestions.find((r) => relay === r.label)
                ?.value;
              return {
                value: value ?? index,
                label: relay,
              };
            })
          : [];
        setRelays(relays);
      } catch (err) {
        toast.error(`${err}`, { autoClose: 3000 });
      } finally {
        setIsLoading(false);
      }
    }
    setIsEditRelays(false);
  };

  useLayoutEffect(() => {
    const rule = selectedRule;
    if (rule) {
      setSelectedRule(rule);
    } else {
      const importRule = rules.find((r) => r.id === 1);
      setSelectedRule(importRule);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ruleName.length && selectTypeValue?.value) {
      setIsFormValidate(true);
    } else {
      setIsFormValidate(false);
    }
  }, [ruleName, selectTypeValue]);

  const getAvailableLetters = (index: number) => {
    const usedLetters = tableData.map((data) => data.letter);
    return allLetters.filter(
      (letter) =>
        !usedLetters.includes(letter) || usedLetters[index] === letter,
    );
  };

  const handleAddRow = () => {
    const available = getAvailableLetters(tableData.length);
    if (available.length === 0) {
      alert("All letters are used.");
      return;
    }

    const newLetter = available[0];
    setTableData((prevData) => [...prevData, { letter: newLetter, value: "" }]);
  };

  const handleTableValueChange = (index: number, value: string) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      newData[index].value = value;
      return newData;
    });
  };

  const handleTableLetterChange = (index: number, letter: string) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      newData[index].letter = letter;
      return newData;
    });
  };

  const closeModal = () => setIsModal(false);

  useEffect(() => {
    fetchRules();
    fetchRelays();
  }, [store.pubkey]);

  useEffect(() => {
    const rule = selectedRule;
    let ruleFilter: NDKFilter = {};
    let ruleRelays: string[] = [];
    if (typeof selectedRule?.filter === "string") {
      ruleFilter = JSON.parse(selectedRule?.filter);
    }
    if (typeof selectedRule?.relays === "string") {
      ruleRelays = JSON.parse(selectedRule?.relays);
    }
    const { authors, kinds, ids, since, until, limit, ...ruleLetters } =
      ruleFilter;
    const newTableData: TableData[] = [];
    for (const key in ruleLetters) {
      newTableData.push({
        letter: key.split("#")[1],
        //@ts-ignore
        value: `${ruleLetters[key]}`,
      });
    }
    setTableData(newTableData);
    setSelectedRule(rule);
    setKinds(
      ruleFilter.kinds?.map((k, i) => {
        return { value: i, label: getKindName(k) };
      }) ?? [],
    );
    setSelectedRelays(
      ruleRelays.map((k, i) => {
        return { value: i, label: k };
      }) ?? [],
    );
    setRuleName(rule?.name ?? "");
    const ruleType = rule?.type;
    if (ruleType) {
      handleTypeChange({ value: ruleType, label: ruleType });
    }
    setStartDate(ruleFilter.since ? new Date(ruleFilter.since * 1000) : null);
    setUntilDate(ruleFilter.until ? new Date(ruleFilter.until * 1000) : null);
    if (rule) {
      const updatedSelectedLetters = allLetters
        .filter(
          (letter) =>
            (ruleFilter[`#${letter}`] as string[] | undefined)?.[0] !==
            undefined,
        )
        .map((letter) => ({ value: `#${letter}`, label: `#${letter}` }));
      setSelectedLetters(updatedSelectedLetters);

      Object.keys(ruleFilter).forEach((key) => {
        //@ts-ignore
        const value = (ruleFilter[key] as string[] | undefined)?.[0] || "";
        setLetterValues((prevValues) => ({ ...prevValues, [key]: value }));
      });
    }
    setAuthors(ruleFilter.authors ?? []);
    setIds(ruleFilter.ids?.toString() ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRule]);

  useEffect(() => {
    const currentRule = selectedRule;
    let ruleFilter: NDKFilter = {};
    if (typeof selectedRule?.filter === "string") {
      ruleFilter = JSON.parse(selectedRule?.filter);
    }

    if (currentRule) {
      const updatedLetterValues: { [key: string]: string } = {};
      Object.keys(ruleFilter).forEach((key) => {
        //@ts-ignore
        const value = (ruleFilter[key] as string[] | undefined)?.[0] || "";
        updatedLetterValues[key] = value;
      });

      setLetterValues(updatedLetterValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRule]);

  const cancelRelaysEdit = () => {
    setIsEditRelays(false);
  };

  const theDayBeforeStartDate = new Date(startDate ?? "");
  const theDayAfterUntilDate = new Date(untilDate ?? "");

  const openAddModal = () => {
    setSelectedRule(new Rule());
    setIsEditActive(true);
    setModalType("addModal");
    setIsModal(true);
  };

  const addRule = async () => {
    const newRule = new Rule();
    const filter: NDKFilter = {};
    filter.limit = 100;
    if (kinds.length) {
      Object.defineProperty(filter, "kinds", {
        value: Array.from(new Set(kinds.map((k) => getKindNumber(k.label)))),
        enumerable: true,
      });
    }
    if (ids.length) {
      Object.defineProperty(filter, "ids", {
        value: ids,
        enumerable: true,
      });
    }
    if (authors.length) {
      Object.defineProperty(filter, "authors", {
        value: authors,
        enumerable: true,
      });
    }
    if (startDate) {
      Object.defineProperty(filter, "since", {
        value: dateToUnix(startDate),
        enumerable: true,
      });
    }
    if (untilDate) {
      Object.defineProperty(filter, "until", {
        value: dateToUnix(untilDate),
        enumerable: true,
      });
    }

    for (let i = 0; i < tableData.length; i++) {
      if (tableData[i].letter) {
        Object.defineProperty(filter, `#${tableData[i].letter}`, {
          value: [tableData[i].value],
          enumerable: true,
        });
      }
    }

    newRule.setName(ruleName);
    newRule.setType(selectTypeValue?.value ?? "");
    newRule.setRelays(
      selectedRelays.length
        ? selectedRelays.map((r) => r.label)
        : relays.map((r) => r.label),
    );
    newRule.filter = filter;

    if (store.pubkey) {
      try {
        const res = await sendPostAuth(
          ndk,
          store.pubkey,
          url,
          "POST",
          JSON.stringify(newRule),
        );
        toast.success(`Added new rule: ${res.name}!`, { autoClose: 3000 });
        console.log(res);
      } catch (err) {
        toast.error(`${err}!`, { autoClose: 3000 });
      }
    }
    fetchRules();
    setIsModal(false);
    setIsEditActive(false);
    setModalType("editType");
  };

  const updateRule = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number,
  ) => {
    e.stopPropagation();
    const filter: NDKFilter = {};
    if (kinds.length) {
      Object.defineProperty(filter, "kinds", {
        value: Array.from(new Set(kinds.map((k) => getKindNumber(k.label)))),
        enumerable: true,
      });
    }
    if (ids.length) {
      Object.defineProperty(filter, "ids", {
        value: ids,
        enumerable: true,
      });
    }
    if (authors.length) {
      console.log(authors);

      Object.defineProperty(filter, "authors", {
        value: authors,
        enumerable: true,
      });
    }

    if (startDate) {
      Object.defineProperty(filter, "since", {
        value: dateToUnix(startDate),
        enumerable: true,
      });
    }

    if (untilDate) {
      Object.defineProperty(filter, "until", {
        value: dateToUnix(untilDate),
        enumerable: true,
      });
    }
    for (let i = 0; i < tableData.length; i++) {
      if (tableData[i].letter) {
        Object.defineProperty(filter, `#${tableData[i].letter}`, {
          value: [tableData[i].value],
          enumerable: true,
        });
      }
    }
    filter.limit = 30;
    const updatedRule: ruleType = {
      id: id,
      name: ruleName,
      type: selectTypeValue?.value ?? "import",
      relays: selectedRelays.length
        ? selectedRelays.map((r) => r.label)
        : relays.map((r) => r.label),
      filter: filter,
    };

    if (store.pubkey) {
      try {
        const res = await sendPostAuth(
          ndk,
          store.pubkey,
          url,
          "PUT",
          JSON.stringify(updatedRule),
          id,
        );
        toast.success(`Rule ${res.name} updated!`, { autoClose: 3000 });
        fetchRules();
      } catch (err) {
        toast.error(`${err}`, { autoClose: 3000 });
      }
    }
    setIsEditActive(false);
    setIsModal(false);
  };

  const removeRule = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number,
  ) => {
    e.stopPropagation();
    if (store.pubkey) {
      const res = await sendPostAuth(ndk, store.pubkey, url, "DELETE", "", id);
      console.log(res);
      if (res.success) {
        fetchRules();
      }
    }
  };

  const saveRelays = async () => {
    const updatedRelays = relays.map((relay) => relay.label);
    if (store.pubkey) {
      try {
        const res = await sendPostAuth(
          ndk,
          store.pubkey,
          urlRelays,
          "PUT",
          JSON.stringify({ relay_array: updatedRelays }),
        );
        console.log(res);
        toast.success(`Default relays updated successfully!`, {
          autoClose: 3000,
        });
        fetchRelays();
      } catch (err) {
        toast.error(`${err}`, { autoClose: 3000 });
      }
    }
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
                <Button onClick={saveRelays} variant="outline-success">
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
        {!isLoading ? (
          rules.length ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rule</th>
                  <th>Type</th>
                  <th></th>
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
                      style={{ cursor: "pointer" }}
                    >
                      <td>{index + 1}</td>
                      <td>{rule.name}</td>
                      <td>{rule.type}</td>
                      <td align="center" width={"10px"}>
                        {
                          <Button
                            size="sm"
                            onClick={(e) => removeRule(e, rule.id)}
                            variant="outline-danger"
                          >
                            <Trash />
                          </Button>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            "No rules found"
          )
        ) : (
          <div className={cl.loader}>
            <ThreeDots
              visible={true}
              height="80"
              width="80"
              color="gray"
              radius="9"
              ariaLabel="three-dots-loading"
              wrapperStyle={{}}
              wrapperClass=""
            />
          </div>
        )}

        <ReactModal
          onAfterOpen={() => {
            document.body.style.overflow = "hidden";
          }}
          onAfterClose={() => {
            document.body.style.overflow = "auto";
          }}
          ariaHideApp={false}
          className={cl.modal}
          style={{
            overlay: { zIndex: 6, background: "rgba(0,0,0,0.4)" },
            content: { overflow: "auto", maxHeight: "80vh" },
          }}
          contentLabel="Embed"
          isOpen={isModal}
          onRequestClose={closeModal}
        >
          <Button
            size="sm"
            onClick={closeModal}
            className={cl.modalCloseButton}
            variant="danger"
          >
            <X size="22" />
          </Button>
          {selectedRule && (
            <div className={cl.selectedRule}>
              <Form>
                <Form.Group
                  className="mb-1"
                  controlId="exampleForm.ControlInput1"
                >
                  <Form.Control
                    required
                    disabled={!isEditActive}
                    placeholder="Rule name"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                  />
                  <Form.Label>Example: Rule 1</Form.Label>
                </Form.Group>
                <Select
                  required
                  value={selectTypeValue}
                  placeholder="Type"
                  isDisabled={!isEditActive}
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
                <Form.Group>
                  <Form.Control
                    disabled={!isEditActive}
                    placeholder="Authors"
                    value={authors}
                    onChange={(e) =>
                      setAuthors(e.target.value.length ? [e.target.value] : [])
                    }
                  />
                  <Form.Label>Example: npub1xxx</Form.Label>
                </Form.Group>
                <Form.Group>
                  <Form.Control
                    disabled={!isEditActive}
                    placeholder="Ids"
                    value={ids}
                    onChange={(e) => setIds(e.target.value)}
                  />
                  <Form.Label>Example: note1xxx</Form.Label>
                </Form.Group>
                <div className="datePicker">
                  <div className="date-picker-wrapper">
                    <DatePicker
                      readOnly={!isEditActive}
                      placeholderText="Since"
                      className="datePickerInput"
                      selected={untilDate}
                      onChange={setUntilDate}
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
                        untilDate !== null
                          ? theDayAfterUntilDate.setDate(
                              untilDate.getDate() + 1,
                            )
                          : new Date("2023-01-01")
                      }
                    />
                  </div>
                </div>
                {tableData.length ? (
                  <Table striped bordered hover size="sm" className="mt-3">
                    <thead>
                      <tr>
                        <th>Letter</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((data, index) => (
                        <tr key={index}>
                          <td>
                            <Form.Select
                              disabled={!isEditActive}
                              value={data.letter}
                              onChange={(e) =>
                                handleTableLetterChange(index, e.target.value)
                              }
                            >
                              {getAvailableLetters(index).map((letter) => (
                                <option key={letter} value={letter}>
                                  #{letter}
                                </option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Control
                              disabled={!isEditActive}
                              type="text"
                              value={data.value}
                              onChange={(e) =>
                                handleTableValueChange(index, e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  ""
                )}
                <Button
                  variant="light"
                  className="mt-1"
                  disabled={!isEditActive}
                  onClick={handleAddRow}
                >
                  Add Tag
                </Button>

                <div className={cl.controlPanel}>
                  {!isEditActive && modalType === "editType" ? (
                    <Button onClick={() => setIsEditActive(true)}>
                      <Pencil />
                    </Button>
                  ) : (
                    <>
                      {modalType === "editType" ? (
                        <Button
                          variant="success"
                          onClick={(e) => updateRule(e, selectedRule.id)}
                          disabled={!isFormValidate}
                        >
                          Save
                        </Button>
                      ) : (
                        <Button onClick={addRule} disabled={!isFormValidate}>
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
              </Form>
            </div>
          )}
        </ReactModal>
      </div>
    </div>
  );
};

export default Settings;
