import * as os from "os";
import * as fs from "fs";
import { Command } from "commander";
import { Address } from "../address";
import { Generator } from "./generator";

main();

function main() {
    const program = new Command();

    program.version("0.1.0");
    program.name("abi-class-generator");
    setupCli(program);

    try {
        program.parse(process.argv);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
    }
}

function setupCli(program: any) {
    program
        .command("generate")
        .description("Create a new class from an `abi.json` file")
        .requiredOption("--abi <string>", "path to the abi file")
        .requiredOption("--contract <bech32 address>", "contract address in the bech32 representation")
        .requiredOption("--chain <chainID>", "the chain ID of the network")
        .requiredOption("--network-provider <API/PROXY>", "the url of a network-provider")
        .option("--target <string>", "the programming language in which the class will be generated", "ts")
        .option("--path <string>", "where to save the output file")
        .action(generate);
}

async function generate(cmdObj: any) {
    const abi = await loadAbi(asUserPath(cmdObj.abi));
    const contract = Address.fromBech32(cmdObj.contract);
    const chainID = String(cmdObj.chain);
    const url = String(cmdObj.networkProvider);
    const target = String(cmdObj.target);
    const outputPath = String(cmdObj.path || process.cwd());

    const generator = new Generator({
        abi: abi,
        contractAddress: contract,
        chainID: chainID,
        networkProviderUrl: url,
        targetLanguage: target,
        outputPath: outputPath,
    });
    generator.generate();
}

function asUserPath(userPath: string): string {
    return (userPath || "").replace("~", os.homedir);
}

async function loadAbi(abiPath: string): Promise<any> {
    const abi = await fs.promises.readFile(abiPath, { encoding: "utf8" });
    return JSON.parse(abi);
}
