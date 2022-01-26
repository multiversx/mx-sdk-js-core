import { assert } from "chai";
import {WalletProvider} from "./walletProvider";
import {Transaction} from "../transaction";
import {Address} from "../address";
import { isOnBrowserTests } from "../testutils";

declare global {
  namespace NodeJS {
    interface Global {
      window?: {
        location: {
          href: string
        }
      };
    }
  }
}

describe("test wallet provider", () => {
  before(function() {
    if (isOnBrowserTests()) {
      this.skip();
    }
  });

  beforeEach(function() {
    global.window = {
      location: {
        href: "http://return-to-wallet"
      }
    };
  });

  after(function() {
    if (isOnBrowserTests()) {
      // Do nothing.
    } else {
      delete global.window;
    }
  });

  it('login redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");

    const returnUrl = await walletProvider.login();
    assert.equal(returnUrl, "http://mocked-wallet.com/hook/login?callbackUrl=http://return-to-wallet");

    const returnUrlWithCallback = await walletProvider.login({callbackUrl: "http://another-callback"});
    assert.equal(returnUrlWithCallback, "http://mocked-wallet.com/hook/login?callbackUrl=http://another-callback");

    const returnUrlWithToken = await walletProvider.login({callbackUrl: "http://another-callback", token: "test-token"});
    assert.equal(returnUrlWithToken, "http://mocked-wallet.com/hook/login?callbackUrl=http://another-callback&token=test-token");
  });

  it('logout redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");

    await walletProvider.logout();
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/logout?callbackUrl=http://return-to-wallet");

    await walletProvider.logout({callbackUrl: "http://another-callback"});
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/logout?callbackUrl=http://another-callback");
  });

  it('send transaction redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");
    const mockTransaction = new Transaction({
      receiver: Address.Zero(),
    });

    await walletProvider.sendTransaction(mockTransaction);
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/transaction?receiver=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&value=0&gasLimit=50000&gasPrice=1000000000&callbackUrl=http://return-to-wallet");

    await walletProvider.sendTransaction(mockTransaction, {callbackUrl: "http://another-callback"});
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/transaction?receiver=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&value=0&gasLimit=50000&gasPrice=1000000000&callbackUrl=http://another-callback");
  });

  it('sign transaction redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");
    const mockTransaction = new Transaction({
      receiver: Address.Zero(),
    });

    await walletProvider.signTransaction(mockTransaction);
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/sign?receiver=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&value=0&gasLimit=50000&gasPrice=1000000000&callbackUrl=http://return-to-wallet");

    await walletProvider.signTransaction(mockTransaction, {callbackUrl: "http://another-callback"});
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/sign?receiver=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&value=0&gasLimit=50000&gasPrice=1000000000&callbackUrl=http://another-callback");
  });

  it('sign multiple transactions redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");
    const mockTransactions = [
      new Transaction({
        receiver: Address.Zero(),
      }),
      new Transaction({
        receiver: Address.Zero(),
      }),
    ];

    await walletProvider.signTransactions(mockTransactions);
    assert.equal(window.location.href, `http://mocked-wallet.com/hook/sign?nonce%5B0%5D=0&nonce%5B1%5D=0&value%5B0%5D=0&value%5B1%5D=0&receiver%5B0%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&receiver%5B1%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender%5B0%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender%5B1%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&gasPrice%5B0%5D=1000000000&gasPrice%5B1%5D=1000000000&gasLimit%5B0%5D=50000&gasLimit%5B1%5D=50000&data%5B0%5D=&data%5B1%5D=&chainID%5B0%5D=T&chainID%5B1%5D=T&version%5B0%5D=1&version%5B1%5D=1&callbackUrl=http://return-to-wallet`);

    await walletProvider.signTransactions(mockTransactions, {callbackUrl: "http://another-callback"});
    assert.equal(window.location.href, `http://mocked-wallet.com/hook/sign?nonce%5B0%5D=0&nonce%5B1%5D=0&value%5B0%5D=0&value%5B1%5D=0&receiver%5B0%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&receiver%5B1%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender%5B0%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender%5B1%5D=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&gasPrice%5B0%5D=1000000000&gasPrice%5B1%5D=1000000000&gasLimit%5B0%5D=50000&gasLimit%5B1%5D=50000&data%5B0%5D=&data%5B1%5D=&chainID%5B0%5D=T&chainID%5B1%5D=T&version%5B0%5D=1&version%5B1%5D=1&callbackUrl=http://another-callback`);
  });
});
