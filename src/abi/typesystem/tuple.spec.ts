import { assert } from "chai";
import { ErrInvalidTuple } from "../../core/errors";
import { U32Value } from "./numerical";
import { Tuple } from "./tuple";

describe("test tuple error handling", () => {
    it("should throw ErrInvalidTuple for empty items", () => {
        assert.throws(() => Tuple.fromItems([]), ErrInvalidTuple, "Cannot create tuple from empty items array");
    });

    it("should create tuple from valid items", () => {
        const items = [new U32Value(1), new U32Value(2)];
        const tuple = Tuple.fromItems(items);
        assert.equal(tuple.getFields().length, 2);
    });

    it("should create tuple from single item", () => {
        const items = [new U32Value(42)];
        const tuple = Tuple.fromItems(items);
        assert.equal(tuple.getFields().length, 1);
    });
});
