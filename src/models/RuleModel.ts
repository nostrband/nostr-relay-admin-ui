import { Filter, ruleType } from "../types/types";

export default class Rule implements ruleType {
  id!: number;
  type!: string;
  filter!: {
    [key: string]: string[] | number | undefined;
    relays?: string[] | undefined;
    kinds?: string[] | undefined;
    ids?: string[] | undefined;
    authors?: string[] | undefined;
  };
  name!: string;

  constructor() {
    this.id = Math.random() * 100 * Date.now();
    this.type = "";
    this.filter = {};
    this.name = "";
  }

  setName(value: string) {
    this.name = value;
  }
  setType(value: string) {
    this.type = value;
  }
  setFilter(filter: Filter) {
    this.filter = filter;
  }
}
