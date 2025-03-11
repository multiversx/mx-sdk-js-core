import { Address, AddressComputer } from "../core/address";
import { Compatibility } from "../core/compatibility";
import { TRANSACTION_MIN_GAS_PRICE } from "../core/constants";
import { ErrContractHasNoAddress } from "../core/errors";
import { Transaction } from "../core/transaction";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { guardValueIsSet } from "../core/utils";
import { SmartContractTransactionsFactory } from "./../smartContracts/smartContractTransactionsFactory";
import { CodeMetadata } from "./codeMetadata";
import { ContractFunction } from "./function";
import { Interaction } from "./interaction";
import {
    CallArguments,
    DeployArguments,
    ICodeMetadata,
    ISmartContract,
    QueryArguments,
    UpgradeArguments,
} from "./interface";
import { NativeSerializer } from "./nativeSerializer";
import { Query } from "./query";
import { EndpointDefinition, TypedValue } from "./typesystem";

interface IAbi {
    constructorDefinition: EndpointDefinition;

    getEndpoints(): EndpointDefinition[];
    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}

/**
 * * @deprecated component. Use "SmartContractTransactionsFactory" or "SmartContractController", instead.
 *
 * An abstraction for deploying and interacting with Smart Contracts.
 */
export class SmartContract implements ISmartContract {
    private address: Address = Address.empty();
    private abi?: IAbi;

    /**
     * This object contains a function for each endpoint defined by the contract.
     * (a bit similar to web3js's "contract.methods").
     */
    public readonly methodsExplicit: { [key: string]: (args?: TypedValue[]) => Interaction } = {};

    /**
     * This object contains a function for each endpoint defined by the contract.
     * (a bit similar to web3js's "contract.methods").
     *
     * This is an alternative to {@link methodsExplicit}.
     * Unlike {@link methodsExplicit}, automatic type inference (wrt. ABI) is applied when using {@link methods}.
     */
    public readonly methods: { [key: string]: (args?: any[]) => Interaction } = {};

    /**
     * Create a SmartContract object by providing its address on the Network.
     */
    constructor(options: { address?: Address; abi?: IAbi } = {}) {
        this.address = options.address || Address.empty();
        this.abi = options.abi;

        if (this.abi) {
            this.setupMethods();
        }
    }

    private setupMethods() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let contract = this;
        let abi = this.getAbi();

        for (const definition of abi.getEndpoints()) {
            let functionName = definition.name;

            // For each endpoint defined by the ABI, we attach a function to the "methods" and "methodsAuto" objects,
            // a function that receives typed values as arguments
            // and returns a prepared contract interaction.
            this.methodsExplicit[functionName] = function (args?: TypedValue[]) {
                let func = new ContractFunction(functionName);
                let interaction = new Interaction(contract, func, args || []);
                return interaction;
            };

            this.methods[functionName] = function (args?: any[]) {
                let func = new ContractFunction(functionName);
                // Perform automatic type inference, wrt. the endpoint definition:
                let typedArgs = NativeSerializer.nativeToTypedValues(args || [], definition);
                let interaction = new Interaction(contract, func, typedArgs || []);
                return interaction;
            };
        }
    }

    /**
     * Sets the address, as on Network.
     */
    setAddress(address: Address) {
        this.address = address;
    }

    /**
     * Gets the address, as on Network.
     */
    getAddress(): Address {
        return this.address;
    }

    private getAbi(): IAbi {
        guardValueIsSet("abi", this.abi);
        return this.abi!;
    }

    getEndpoint(name: string | ContractFunction): EndpointDefinition {
        return this.getAbi().getEndpoint(name);
    }

    /**
     * Creates a {@link Transaction} for deploying the Smart Contract to the Network.
     */
    deploy({
        deployer,
        code,
        codeMetadata,
        initArguments,
        value,
        gasLimit,
        gasPrice,
        chainID,
    }: DeployArguments): Transaction {
        Compatibility.guardAddressIsSetAndNonZero(
            deployer,
            "'deployer' of SmartContract.deploy()",
            "pass the actual address to deploy()",
        );

        const config = new TransactionsFactoryConfig({ chainID: chainID.valueOf() });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: this.abi,
        });

        const bytecode = Buffer.from(code.toString(), "hex");
        const metadataAsJson = this.getMetadataPropertiesAsObject(codeMetadata);

        const transaction = factory.createTransactionForDeploy(deployer, {
            bytecode: bytecode,
            gasLimit: BigInt(gasLimit.valueOf()),
            arguments: initArguments ?? [],
            isUpgradeable: metadataAsJson.upgradeable,
            isReadable: metadataAsJson.readable,
            isPayable: metadataAsJson.payable,
            isPayableBySmartContract: metadataAsJson.payableBySc,
        });

        transaction.chainID = chainID;
        transaction.value = value ?? 0n;
        transaction.gasPrice = gasPrice ?? BigInt(TRANSACTION_MIN_GAS_PRICE);

        return transaction;
    }

    private getMetadataPropertiesAsObject(codeMetadata?: ICodeMetadata): {
        upgradeable: boolean;
        readable: boolean;
        payable: boolean;
        payableBySc: boolean;
    } {
        let metadata: CodeMetadata;
        if (codeMetadata) {
            metadata = CodeMetadata.newFromBytes(Buffer.from(codeMetadata.toString(), "hex"));
        } else {
            metadata = new CodeMetadata();
        }
        const metadataAsJson = metadata.toJSON() as {
            upgradeable: boolean;
            readable: boolean;
            payable: boolean;
            payableBySc: boolean;
        };

        return metadataAsJson;
    }

    /**
     * Creates a {@link Transaction} for upgrading the Smart Contract on the Network.
     */
    upgrade({
        caller,
        code,
        codeMetadata,
        initArguments,
        value,
        gasLimit,
        gasPrice,
        chainID,
    }: UpgradeArguments): Transaction {
        Compatibility.guardAddressIsSetAndNonZero(
            caller,
            "'caller' of SmartContract.upgrade()",
            "pass the actual address to upgrade()",
        );

        this.ensureHasAddress();

        const config = new TransactionsFactoryConfig({ chainID: chainID.valueOf() });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: this.abi,
        });

        const bytecode = Uint8Array.from(Buffer.from(code.toString(), "hex"));
        const metadataAsJson = this.getMetadataPropertiesAsObject(codeMetadata);

        const transaction = factory.createTransactionForUpgrade(caller, {
            contract: this.getAddress(),
            bytecode: bytecode,
            gasLimit: BigInt(gasLimit.valueOf()),
            arguments: initArguments ?? [],
            isUpgradeable: metadataAsJson.upgradeable,
            isReadable: metadataAsJson.readable,
            isPayable: metadataAsJson.payable,
            isPayableBySmartContract: metadataAsJson.payableBySc,
        });

        transaction.chainID = chainID;
        transaction.value = value ?? 0n;
        transaction.gasPrice = gasPrice ?? BigInt(TRANSACTION_MIN_GAS_PRICE);

        return transaction;
    }

    /**
     * Creates a {@link Transaction} for calling (a function of) the Smart Contract.
     */
    call({ func, args, value, gasLimit, receiver, gasPrice, chainID, caller }: CallArguments): Transaction {
        Compatibility.guardAddressIsSetAndNonZero(
            caller,
            "'caller' of SmartContract.call()",
            "pass the actual address to call()",
        );

        this.ensureHasAddress();

        const config = new TransactionsFactoryConfig({ chainID: chainID.valueOf() });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: this.abi,
        });

        args = args || [];
        value = value || 0n;

        const transaction = factory.createTransactionForExecute(caller, {
            contract: receiver ? receiver : this.getAddress(),
            function: func.toString(),
            gasLimit: gasLimit,
            arguments: args,
        });

        transaction.chainID = chainID;
        transaction.value = value;
        transaction.gasPrice = gasPrice ?? BigInt(TRANSACTION_MIN_GAS_PRICE);

        return transaction;
    }

    createQuery({ func, args, value, caller }: QueryArguments): Query {
        this.ensureHasAddress();

        return new Query({
            address: this.getAddress(),
            func: func,
            args: args,
            value: value,
            caller: caller,
        });
    }

    private ensureHasAddress() {
        if (!this.getAddress().toBech32()) {
            throw new ErrContractHasNoAddress();
        }
    }

    /**
     * Computes the address of a Smart Contract.
     * The address is computed deterministically, from the address of the owner and the nonce of the deployment transaction.
     *
     * @param owner The owner of the Smart Contract
     * @param nonce The owner nonce used for the deployment transaction
     */
    static computeAddress(owner: Address, nonce: bigint): Address {
        const addressComputer = new AddressComputer();
        return addressComputer.computeContractAddress(owner, BigInt(nonce.valueOf()));
    }
}
