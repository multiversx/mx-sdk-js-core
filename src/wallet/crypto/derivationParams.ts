import scryptsy from "scryptsy";

export class ScryptKeyDerivationParams {
  /**
   * numIterations
   */
  n = 4096;

  /**
   * memFactor
   */
  r = 8;

  /**
   * pFactor
   */
  p = 1;

  dklen = 32;

  constructor(n = 4096, r = 8, p = 1, dklen = 32) {
    this.n = n;
    this. r = r;
    this.p = p;
    this.dklen = dklen;
  }

  /**
   * Will take about:
   *  - 80-90 ms in Node.js, on a i3-8100 CPU @ 3.60GHz
   *  - 350-360 ms in browser (Firefox), on a i3-8100 CPU @ 3.60GHz
   */
  public generateDerivedKey(password: Buffer, salt: Buffer): Buffer {
    return scryptsy(password, salt, this.n, this.r, this.p, this.dklen);
  }
}
