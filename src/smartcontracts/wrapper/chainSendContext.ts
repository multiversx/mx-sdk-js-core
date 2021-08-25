import { Balance, ContractLogger, IProvider, SendContext } from "../..";
import { TestWallet } from "../../testutils";

export class ChainSendContext {
    readonly context: SendContext;

    constructor(context: SendContext) {
        this.context = context;
    }

    sender(caller: TestWallet): this {
        this.context.sender(caller);
        return this;
    }

    gas(gas: number): this {
        this.context.gas(gas);
        return this;
    }

    autoGas(baseGas: number): this {
        this.context.autoGas(baseGas);
        return this;
    }

    value(value: Balance): this {
        this.context.value(value);
        return this;
    }

    logger(logger: ContractLogger | null): this {
        this.context.logger(logger);
        return this;
    }

    getProvider(): IProvider {
        return this.context.getProvider();
    }
}
