import BigNumber from "bignumber.js";
import { Transaction } from "../transaction";
import { IAddress } from "../interface";
import { ErrInvalidInnerTransaction } from "../errors";

interface IConfig {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
}

export class RelayedTransactionsFactory {
    private readonly config: IConfig;

    constructor(config: IConfig) {
        this.config = config;
    }

    createRelayedV1Transaction(options: { innerTransaction: Transaction; relayerAddress: IAddress }) {
        if (!options.innerTransaction.getGasLimit()) {
            throw new ErrInvalidInnerTransaction("The gas limit is not set for the inner transaction");
        }
    }
}
