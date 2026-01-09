import * as fs from "fs";
import { MerkleTreeUtils } from "./markle-tree.utils";

import { promises } from "fs";
import path from "path";

describe("export governance proofs JSON file", function () {
    it.only("should work", async function () {
        this.timeout(7_200_000);

        const markleTreeHatom = await createMerkleTree(
            "snapshots/erd1qqqqqqqqqqqqqpgq2khda0rx207gvlqg92dq5rh0z03a8dqf78ssu0qlcc/2.json",
            "e8fe84b2dcf17376a30cb99b4097a5493d94a81d39138874591762fb68506255",
        );

        const markleTreeXLend = await createMerkleTree(
            "snapshots/erd1qqqqqqqqqqqqqpgqdnpmeseu3j5t7grds9dfj8ttt70pev66ah0sydkq9x/2.json",
            "8d45b99f1b9ccb1eb5abb0c817fc160be792543dcbdbc53a6a2281b047e72ff2",
        );

        exportLeaves(
            markleTreeHatom,
            "governance_proofs/mainnet/erd1qqqqqqqqqqqqqpgq2khda0rx207gvlqg92dq5rh0z03a8dqf78ssu0qlcc/2.json",
        );
        exportLeaves(
            markleTreeXLend,
            "governance_proofs/mainnet/erd1qqqqqqqqqqqqqpgqdnpmeseu3j5t7grds9dfj8ttt70pev66ah0sydkq9x/2.json",
        );
    });
});

// Functionality copied from "https://github.com/multiversx/mx-governance-service".
async function createMerkleTree(snapshot: string, rootHash: string): Promise<MerkleTreeUtils> {
    const jsonContent: string = await promises.readFile(snapshot, {
        encoding: "utf8",
    });

    const leaves = JSON.parse(jsonContent);
    const newMT = new MerkleTreeUtils(leaves);
    if (newMT.getRootHash() !== `0x${rootHash}`) {
        throw new Error("Computed root hash doesn't match the provided root hash.");
    }

    return newMT;
}

function exportLeaves(tree: MerkleTreeUtils, file: string) {
    const output: any[] = [];
    const leaves = tree.getLeaves();

    for (const element of leaves) {
        const addressLeaf = tree.getUserLeaf(element.address);
        if (!addressLeaf) {
            throw new Error(`Cannot get leaf for ${element.address}`);
        }

        const proofBuffer = tree.getProofBuffer(addressLeaf);

        output.push({
            address: element.address,
            balance: element.balance,
            proof: proofBuffer.toString("hex"),
        });
    }

    const dirname = path.dirname(file);

    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }

    fs.writeFileSync(file, JSON.stringify(output, null, 4));
    console.log(`Saved file: ${file}.`);
}
