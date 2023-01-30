// import { IAddress, IGasLimit } from "../../interface";
// import { addressToHex, utf8ToHex } from "../codec";
// import { BuilderBase, IBaseArgs, IBaseConfig } from "./baseBuilder";

// https://docs.multiversx.com/tokens/nft-tokens#roles

// ESDTRoleNFTCreate : this role allows one to create a new NFT
// ESDTRoleNFTBurn : this role allows one to burn quantity of a specific NFT
// ESDTRoleNFTUpdateAttributes : this role allows one to change the attributes of a specific NFT
// ESDTRoleNFTAddURI : this role allows one add URIs for a specific NFT
// ESDTTransferRole : this role enables transfer only to specified addresses. The owner of the NFT and the address with the ESDTTransferRole should be located on the same shard. The addresses with the transfer role can transfer anywhere.

// interface IESDTSetSpecialRoleConfig extends IBaseConfig {
//     gasLimitSetSpecialRole: IGasLimit;
//     esdtContractAddress: IAddress;
// }

// interface IESDTSetSpecialRoleArgs extends IBaseArgs {
//     manager: IAddress;
//     user: IAddress;
//     tokenIdentifier: string;
//     addRoleLocalMint: boolean;
//     addRoleLocalBurn: boolean;
// }


// export class ESDTSetSpecialRoleBuilder extends BuilderBase {
//     private readonly executionGasLimit: IGasLimit;
//     private readonly user: IAddress;
//     private readonly tokenIdentifier: string;
//     private readonly addRoleLocalMint: boolean;
//     private readonly addRoleLocalBurn: boolean;

//     constructor(config: IESDTSetSpecialRoleConfig, args: IESDTSetSpecialRoleArgs) {
//         super(config, args);
//         this.executionGasLimit = config.gasLimitSetSpecialRole;

//         this.sender = args.manager;
//         this.receiver = config.esdtContractAddress;

//         this.user = args.user;
//         this.tokenIdentifier = args.tokenIdentifier;
//         this.addRoleLocalMint = args.addRoleLocalMint;
//         this.addRoleLocalBurn = args.addRoleLocalBurn;
//     }

//     protected estimateExecutionGas(): IGasLimit {
//         return this.executionGasLimit;
//     }

//     protected buildTransactionPayloadParts(): string[] {
//         return [
//             "setSpecialRole",
//             utf8ToHex(this.tokenIdentifier),
//             addressToHex(this.user),
//             ...(this.addRoleLocalMint ? [utf8ToHex("ESDTRoleLocalMint")] : []),
//             ...(this.addRoleLocalBurn ? [utf8ToHex("ESDTRoleLocalBurn")] : []),
//         ]
//     }
// }
