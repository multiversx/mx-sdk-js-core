import { Address } from "../address";
import { Balance } from "../balance";
import { Hash } from "../hash";
import { GasLimit, GasPrice } from "../networkParams";
import { Nonce } from "../nonce";
import { TransactionHash } from "../transaction";
import { ArgSerializer } from "./argSerializer";
import { EndpointDefinition, TypedValue } from "./typesystem";
import { ReturnCode } from "./returnCode";
import { Result } from "./result";

export class SmartContractResults {
    private readonly items: SmartContractResultItem[] = [];
    private readonly immediate: TypedResult = new TypedResult();
    private readonly resultingCalls: TypedResult[] = [];

    constructor(items: SmartContractResultItem[]) {
        this.items = items;

        if (this.items.length > 0) {
            let immediateResult = this.findImmediateResult();
            if (immediateResult) {
                this.immediate = immediateResult;
            }
            this.resultingCalls = this.findResultingCalls();
        }
    }

    static empty(): SmartContractResults {
        return new SmartContractResults([]);
    }

    static fromHttpResponse(smartContractResults: any[]): SmartContractResults {
        let items = (smartContractResults || []).map((item: any) => SmartContractResultItem.fromHttpResponse(item));
        return new SmartContractResults(items);
    }

    private findImmediateResult(): TypedResult | undefined {
        let immediateItem = this.items.filter(item => isImmediateResult(item))[0];
        if (immediateItem) {
            return new TypedResult(immediateItem);
        }
        return undefined;
    }

    private findResultingCalls(): TypedResult[] {
        let otherItems = this.items.filter(item => !isImmediateResult(item));
        let resultingCalls = otherItems.map(item => new TypedResult(item));
        return resultingCalls;
    }

    getImmediate(): TypedResult {
        return this.immediate;
    }

    getResultingCalls(): TypedResult[] {
        return this.resultingCalls;
    }

    getAllResults(): TypedResult[] {
        return this.items.map(item => new TypedResult(item));
    }
}

function isImmediateResult(item: SmartContractResultItem): boolean {
    return item.nonce.valueOf() != 0;
}

export class SmartContractResultItem {
    hash: Hash = Hash.empty();
    nonce: Nonce = new Nonce(0);
    value: Balance = Balance.Zero();
    receiver: Address = new Address();
    sender: Address = new Address();
    data: string = "";
    previousHash: Hash = Hash.empty();
    originalHash: Hash = Hash.empty();
    gasLimit: GasLimit = new GasLimit(0);
    gasPrice: GasPrice = new GasPrice(0);
    callType: number = 0;
    returnMessage: string = "";

    static fromHttpResponse(response: {
        hash: string,
        nonce: number,
        value: string,
        receiver: string,
        sender: string,
        data: string,
        prevTxHash: string,
        originalTxHash: string,
        gasLimit: number,
        gasPrice: number,
        callType: number,
        returnMessage: string
    }): SmartContractResultItem {
        let item = new SmartContractResultItem();

        item.hash = new TransactionHash(response.hash);
        item.nonce = new Nonce(response.nonce || 0);
        item.value = Balance.fromString(response.value);
        item.receiver = new Address(response.receiver);
        item.sender = new Address(response.sender);
        item.data = response.data || "";
        item.previousHash = new TransactionHash(response.prevTxHash);
        item.originalHash = new TransactionHash(response.originalTxHash);
        item.gasLimit = new GasLimit(response.gasLimit);
        item.gasPrice = new GasPrice(response.gasPrice);
        item.callType = response.callType;
        item.returnMessage = response.returnMessage;

        return item;
    }

    getDataTokens(): Buffer[] {
        return new ArgSerializer().stringToBuffers(this.data);
    }
}

export class TypedResult extends SmartContractResultItem implements Result.IResult {
    /**
    * If available, will provide typed output arguments (with typed values).
    */
    endpointDefinition?: EndpointDefinition;

    constructor(init?: Partial<SmartContractResultItem>) {
        super();
        Object.assign(this, init);
    }

    assertSuccess() {
        Result.assertSuccess(this);
    }

    isSuccess(): boolean {
        return this.getReturnCode().isSuccess();
    }

    getReturnCode(): ReturnCode {
        let tokens = this.getDataTokens();
        if (tokens.length < 2) {
            return ReturnCode.None;
        }
        let returnCodeToken = tokens[1];
        return ReturnCode.fromBuffer(returnCodeToken);
    }

    outputUntyped(): Buffer[] {
        this.assertSuccess();

        // Skip the first 2 SCRs (eg. the @6f6b from @6f6b@2b).
        return this.getDataTokens().slice(2);
    }

    setEndpointDefinition(endpointDefinition: EndpointDefinition) {
        this.endpointDefinition = endpointDefinition;
    }

    getEndpointDefinition(): EndpointDefinition | undefined {
        return this.endpointDefinition;
    }

    getReturnMessage(): string {
        return this.returnMessage;
    }

    outputTyped(): TypedValue[] {
        return Result.outputTyped(this);
    }

    unpackOutput(): any {
        return Result.unpackOutput(this);
    }
}
