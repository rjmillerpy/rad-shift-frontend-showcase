import { interiorsById } from "@/app/amble/data/townTypes";
import type { InteriorMap } from "@/app/amble/data/schema";

const room = (id: string) => ({ id }) as InteriorMap;

describe("interiorsById", () => {
  it("keys each interior by its own id", () => {
    const a = room("a");
    const b = room("b");
    expect(interiorsById([a, b])).toEqual({ a, b });
  });

  it("is empty for no interiors", () => {
    expect(interiorsById([])).toEqual({});
  });
});
