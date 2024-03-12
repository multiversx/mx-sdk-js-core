import { assert } from "chai";
import { TypeFormulaParser } from "./typeFormulaParser";

describe("test type formula parser", () => {
    it("should parse expression", async () => {
        const parser = new TypeFormulaParser();

        const testVectors = [
            ["i64", "i64"],
            ["  i64  ", "i64"],
            ["utf-8 string", "utf-8 string"],
            ["MultiResultVec<MultiResult2<Address, u64>>", "MultiResultVec<MultiResult2<Address, u64>>"],
            ["tuple3<i32, bytes, Option<i64>>", "tuple3<i32, bytes, Option<i64>>"],
            ["tuple2<i32, i32>", "tuple2<i32, i32>"],
            ["tuple2<i32,i32>  ", "tuple2<i32, i32>"],
            ["tuple<List<u64>, List<u64>>", "tuple<List<u64>, List<u64>>"],
        ];

        for (const [inputExpression, expectedExpression] of testVectors) {
            const typeFormula = parser.parseExpression(inputExpression);
            const outputExpression = typeFormula.toString();
            assert.equal(outputExpression, expectedExpression);
        }
    });
});
