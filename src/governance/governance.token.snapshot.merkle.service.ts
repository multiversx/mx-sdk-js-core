// Functionality copied from "https://github.com/multiversx/mx-governance-service".

import { promises } from "fs";
import { MerkleTreeUtils } from "./markle-tree.utils";

export class GovernanceTokenSnapshotMerkleService {
    private static merkleTrees: MerkleTreeUtils[];

    constructor() {
        GovernanceTokenSnapshotMerkleService.merkleTrees = [];
    }

    async getMerkleTree(rootHash: any): Promise<MerkleTreeUtils> {
        return GovernanceTokenSnapshotMerkleService.merkleTrees[rootHash] || this.createMerkleTree(rootHash);
    }

    async getAddressBalance(roothash: string, address: string): Promise<string> {
        const merkleTree = await this.getMerkleTree(roothash);
        return merkleTree.getLeaves().find((leaf) => leaf.address === address)?.balance ?? "0";
    }

    private async createMerkleTree(rootHash: any): Promise<MerkleTreeUtils> {
        const jsonContent: string = await promises.readFile(`snapshots/${rootHash}.json`, {
            encoding: "utf8",
        });
        const leaves = JSON.parse(jsonContent);
        const newMT = new MerkleTreeUtils(leaves);
        if (newMT.getRootHash() !== `0x${rootHash}`) {
            throw new Error("Computed root hash doesn't match the provided root hash.");
        }

        GovernanceTokenSnapshotMerkleService.merkleTrees[rootHash] = newMT;
        return newMT;
    }
}
