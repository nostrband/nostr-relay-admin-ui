import { NDKFilter } from "@nostr-dev-kit/ndk";
import { ruleType } from "../types/types";

export default class Rule implements ruleType {
  id!: number;
  type!: string;
  relays!: string[];
  filter!: NDKFilter;
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
  setRelays(value: string[]) {
    this.relays = value;
  }
  setFilter(filter: NDKFilter) {
    this.filter = filter;
  }
}
