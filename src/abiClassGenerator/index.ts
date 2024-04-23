import { Address } from "../address";

const os = require("os");
const fs = require("fs");
const { Command } = require("commander");

main();

function main() {
    const program = new Command();

    program.version("0.1.0");
    program.name("abi-class-generator");
    setupCli(program);

    try {
        program.parse(process.argv);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

function setupCli(program: any) {
    program
        .command("generate")
        .description("Create a new class from an `abi.json` file")
        .requiredOption("--abi <string>", "path to the abi file")
        .requiredOption("-c, --contract <bech32 address>", "contract address in the bech32 representation")
        .option("--target <string>", "the programming language in which the class will be generated", "ts")
        .option("--no-use-abi", "whether to use an `AbiRegistry` object inside the generated class")
        .action(generate);
}

function generate(cmdObj: any) {
    const abi = loadAbi(asUserPath(cmdObj.abi));
    const contract = Address.fromBech32(cmdObj.contract);
    const target = cmdObj.target;
    const useAbiObject = cmdObj.useAbi;
}

function asUserPath(userPath: string) {
    return (userPath || "").replace("~", os.homedir);
}

function loadAbi(abiPath: string) {
    const abi = fs.readFileSync(abiPath);
    return JSON.parse(abi);
}
