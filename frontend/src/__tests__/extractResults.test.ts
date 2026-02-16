import { describe, it, expect } from "vitest";
import { extractResults } from "@/lib/api";

describe("extractResults", () => {
    it("returns array directly when data is already an array", () => {
        const data = [{ id: 1 }, { id: 2 }];
        expect(extractResults(data)).toEqual(data);
    });

    it("extracts results from paginated DRF response", () => {
        const items = [{ id: 1 }, { id: 2 }];
        const paginated = { count: 2, next: null, previous: null, results: items };
        expect(extractResults(paginated)).toEqual(items);
    });

    it("returns empty array for null/undefined", () => {
        expect(extractResults(null)).toEqual([]);
        expect(extractResults(undefined)).toEqual([]);
    });

    it("returns empty array for non-array, non-paginated objects", () => {
        expect(extractResults({ foo: "bar" })).toEqual([]);
        expect(extractResults("string")).toEqual([]);
        expect(extractResults(42)).toEqual([]);
    });

    it("returns empty array when results is not an array", () => {
        expect(extractResults({ results: "not an array" })).toEqual([]);
    });
});
