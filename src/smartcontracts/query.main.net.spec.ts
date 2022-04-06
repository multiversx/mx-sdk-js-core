import { assert } from "chai";
import { Address } from "../address";
import { ContractFunction } from "./function";
import { SmartContract } from "./smartContract";
import { AddressValue } from "./typesystem";
import { chooseProxyProvider } from "../interactive";

describe("test queries on mainnet", function () {
    let provider = chooseProxyProvider("elrond-mainnet");
    let delegationContract = new SmartContract({ address: new Address("erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt") });

    it("delegation: should getTotalStakeByType", async () => {
        let query = delegationContract.createQuery({
            func: new ContractFunction("getTotalStakeByType")
        });

        let response = await provider.queryContract(query);

        assert.isTrue(response.isSuccess());
        assert.lengthOf(response.getReturnDataParts(), 5);
    });

    it("delegation: should getNumUsers", async () => {
        let query = delegationContract.createQuery({
            func: new ContractFunction("getNumUsers")
        });

        let response = await provider.queryContract(query);

        assert.isTrue(response.isSuccess());
        assert.lengthOf(response.getReturnDataParts(), 1);
        assert.isAtLeast(response.gasUsed.valueOf(), 1000000);
        assert.isAtMost(response.gasUsed.valueOf(), 50000000);
    });

    it("delegation: should getFullWaitingList", async function () {
        this.timeout(20000);

        let query = delegationContract.createQuery({
            func: new ContractFunction("getFullWaitingList")
        });

        let response = await provider.queryContract(query);

        assert.isTrue(response.isSuccess());
        assert.isAtLeast(response.getReturnDataParts().length, 42);
    });

    it("delegation: should getClaimableRewards", async function () {
        this.timeout(5000);

        // First, expect an error (bad arguments):
        let query = delegationContract.createQuery({
            func: new ContractFunction("getClaimableRewards")
        });

        let response = await provider.queryContract(query);

        assert.include(response.returnCode.toString(), "user error");
        assert.include(response.returnMessage, "wrong number of arguments");

        // Then do a successful query:
        query = delegationContract.createQuery({
            func: new ContractFunction("getClaimableRewards"),
            args: [new AddressValue(new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"))]
        });

        response = await provider.queryContract(query);

        assert.isTrue(response.isSuccess());
        assert.isAtLeast(response.getReturnDataParts().length, 1);
    });
});
