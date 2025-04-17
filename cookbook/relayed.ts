import path from "path"; // md-ignore
import { Account, Address, DevnetEntrypoint, Transaction } from "../src"; // md-ignore
// md-start
(async () => {
    // ### Relayed transactions
    // We are currently on the `third iteration (V3)` of relayed transactions. V1 and V2 will soon be deactivated, so we will focus on V3.

    // For V3, two new fields have been added to transactions:
    // - relayer
    // - relayerSignature

    // Signing Process:
    // 1. The relayer must be set before the sender signs the transaction.
    // 2. Once the sender has signed, the relayer can also sign the transaction and broadcast it.

    // **Important Consideration**:
    // Relayed V3 transactions require an additional `50,000` gas.
    // Let’s see how to create a relayed transaction:

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const walletsPath = path.join("../src", "testdata", "testwallets");
        const bob = await Account.newFromPem(path.join(walletsPath, "bob.pem"));
        const grace = Address.newFromBech32("erd1r69gk66fmedhhcg24g2c5kn2f2a5k4kvpr6jfw67dn2lyydd8cfswy6ede");
        const mike = await Account.newFromPem(path.join(walletsPath, "mike.pem"));

        // fetch the nonce of the network // md-as-comment
        bob.nonce = await entrypoint.recallAccountNonce(bob.address);

        const transaction = new Transaction({
            chainID: "D",
            sender: bob.address,
            receiver: grace,
            relayer: mike.address,
            gasLimit: 110_000n,
            data: Buffer.from("hello"),
            nonce: bob.getNonceThenIncrement(),
        });

        // sender signs the transaction // md-as-comment
        transaction.signature = await bob.signTransaction(transaction);

        // relayer signs the transaction // md-as-comment
        transaction.relayerSignature = await mike.signTransaction(transaction);

        // broadcast the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Creating relayed transactions using controllers
    // We can create relayed transactions using any of the available controllers.
    // Each controller includes a relayer argument, which must be set if we want to create a relayed transaction.

    // Let’s issue a fungible token using a relayed transaction:

    // ```js
    {
        // create the entrypoint and the token management controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createTokenManagementController();

        // create the issuer of the token // md-as-comment
        const walletsPath = path.join("../src", "testdata", "testwallets");
        const alice = await Account.newFromPem(path.join(walletsPath, "alice.pem"));

        // Carol will be our relayer, that means she is paying the gas for the transaction // md-as-comment
        const frank = await Account.newFromPem(path.join(walletsPath, "frank.pem"));

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const transaction = await controller.createTransactionForIssuingFungible(alice, alice.getNonceThenIncrement(), {
            tokenName: "NEWFNG",
            tokenTicker: "FNG",
            initialSupply: 1_000_000_000000n,
            numDecimals: 6n,
            canFreeze: false,
            canWipe: true,
            canPause: false,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: false,
            relayer: frank.address,
        });

        // relayer also signs the transaction // md-as-comment
        transaction.relayerSignature = await frank.signTransaction(transaction);

        // broadcast the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Creating relayed transactions using factories
    // Unlike controllers, `transaction factories` do not have a `relayer` argument. Instead, the **relayer must be set after creating the transaction**.
    // This approach is beneficial because the **transaction is not signed by the sender at the time of creation**, allowing flexibility in setting the relayer before signing.

    // Let’s issue a fungible token using the `TokenManagementTransactionsFactory`:

    // ```js
    {
        // create the entrypoint and the token management factory // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createTokenManagementTransactionsFactory();

        // create the issuer of the token // md-as-comment
        const walletsPath = path.join("../src", "testdata", "testwallets");
        const alice = await Account.newFromPem(path.join(walletsPath, "alice.pem"));

        // carol will be our relayer, that means she is paying the gas for the transaction // md-as-comment
        const frank = await Account.newFromPem(path.join(walletsPath, "frank.pem"));

        const transaction = await factory.createTransactionForIssuingFungible(alice.address, {
            tokenName: "NEWFNG",
            tokenTicker: "FNG",
            initialSupply: 1_000_000_000000n,
            numDecimals: 6n,
            canFreeze: false,
            canWipe: true,
            canPause: false,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: false,
        });

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);
        transaction.nonce = alice.getNonceThenIncrement();

        // set the relayer // md-as-comment
        transaction.relayer = frank.address;

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // relayer also signs the transaction // md-as-comment
        transaction.relayerSignature = await frank.signTransaction(transaction);

        // broadcast the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```
})().catch((e) => {
    console.log({ e });
});
