// Functionality copied from "https://github.com/multiversx/mx-governance-service".

import BigNumber from "bignumber.js";
import CryptoJS from "crypto-js";
import MerkleTree from "merkletreejs";
import { ArgSerializer, BigUIntValue } from "../abi";
import { Address } from "../core";

export class AddressVotingPower {
    address: string = "";
    balance: string = "";
}

export class MerkleTreeUtils {
    private tree: MerkleTree;
    private leaves: AddressVotingPower[];

    constructor(leaves: AddressVotingPower[]) {
        const hashes = leaves.map((x) => this.encodeLeaf(x));
        const tree = new MerkleTree(hashes, CryptoJS.SHA256, {
            sortPairs: true,
        });

        this.tree = tree;
        this.leaves = leaves;
    }

    getLeaves(): AddressVotingPower[] {
        return this.leaves;
    }

    verifyProof(leaf: AddressVotingPower): boolean {
        const root = this.tree.getRoot().toString("hex");
        const leafHash = this.encodeLeaf(leaf);
        const proof = this.tree.getProof(leafHash.toString());

        return this.tree.verify(proof, leafHash.toString(), root);
    }

    getProof(leaf: AddressVotingPower): string[] {
        const leafHash = this.encodeLeaf(leaf);
        const proof = this.tree.getHexProof(leafHash.toString());

        return proof;
    }

    getProofBuffer(leaf: AddressVotingPower): Buffer {
        const proof = this.getProof(leaf);
        return Buffer.from(this.concatProof(proof), "hex");
    }

    getUserLeaf(address: string): AddressVotingPower | undefined {
        const leaf = this.leaves.find((x) => x.address === address);
        return leaf;
    }

    getRootHash(): string {
        return this.tree.getHexRoot();
    }

    getTotalBalance(): string {
        // iterate leaves and make sum of balance
        let totalBalance = new BigNumber(0);
        for (const leaf of this.leaves) {
            totalBalance = totalBalance.plus(leaf.balance);
        }
        return totalBalance.toString();
    }

    getDepth(): number {
        return this.tree.getDepth();
    }

    concatProof(proof: string[]): string {
        let concatenatedProof = "";
        for (const node of proof) {
            concatenatedProof += node.substring(2);
        }

        return concatenatedProof;
    }

    private encodeLeaf(x: AddressVotingPower) {
        const address = new Address(x.address);

        const argSerializer = new ArgSerializer();
        const votingPower: BigUIntValue = new BigUIntValue(new BigNumber(x.balance));
        const serializedPower = argSerializer.valuesToStrings([votingPower]);

        const leaf = Buffer.concat([Buffer.from(address.hex(), "hex"), Buffer.from(serializedPower[0], "hex")]);

        return CryptoJS.SHA256(CryptoJS.enc.Hex.parse(leaf.toString("hex")));
    }
}
