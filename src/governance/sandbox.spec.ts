import * as fs from "fs";
import { GovernanceTokenSnapshotMerkleService } from "./governance.token.snapshot.merkle.service";

describe("export governance proofs JSON file", function () {
    it.only("should not deserialize", async function () {
        this.timeout(7_200_000);

        const thisGovernanceMerkle = new GovernanceTokenSnapshotMerkleService();

        const rootHash = "785141c50d4a7bcd983467e181e73eec1d77a4149bdee503063fadb11149a9bf";
        const governanceMerkle = await thisGovernanceMerkle.getMerkleTree(rootHash);

        const output: any[] = [];
        const leaves = governanceMerkle.getLeaves();

        let index = 0;

        for (const element of leaves) {
            index++;

            if (index % 1_000 == 0) {
                console.log(`${index} out of ${leaves.length} ...`);
            }

            const addressLeaf = governanceMerkle.getUserLeaf(element.address);
            if (!addressLeaf) {
                throw new Error(`Cannot get leaf for ${element.address}`);
            }

            const proofBuffer = governanceMerkle.getProofBuffer(addressLeaf);

            output.push({
                address: element.address,
                balance: element.balance,
                proof: proofBuffer.toString("hex"),
            });
        }

        fs.writeFileSync("proofs.json", JSON.stringify(output, null, 4));
    });
});
