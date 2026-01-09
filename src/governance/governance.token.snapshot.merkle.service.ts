export class GovernanceTokenSnapshotMerkleService {
    private readonly rootHash: string;
    private readonly name: string;

    constructor(rootHash: string, name: string) {
        this.rootHash = rootHash;
        this.name = name;
    }
}
