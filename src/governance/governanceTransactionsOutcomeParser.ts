import { ArgSerializer } from "../abi";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers";

export class GovernanceTransactionsOutcomeParser {
    private parser: SmartContractTransactionsOutcomeParser;
    private addressHrp: string;
    private serializer: ArgSerializer;

    constructor(options: { addressHrp: string }) {
        this.addressHrp = options.addressHrp;
        this.parser = new SmartContractTransactionsOutcomeParser();
        this.serializer = new ArgSerializer();
    }

    parseProposeProposal(transactionOnNetwork: TransactionOnNetwork);
}
