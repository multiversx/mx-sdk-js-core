import {TestWallets} from "./testutils";
import {SignableMessage} from "./signableMessage";

describe("test signable message", () => {
  let wallets = new TestWallets();
  let alice = wallets.alice;
  it("should sign a message", function() {
   alice.signer.sign(new SignableMessage({
     value: Buffer.from("test message")
   }));
  });
});