import { toShares } from "./conversionUtils";

describe("toShares", () => {
    it("should convert amount to shares", () => {
        const shares = toShares("3");

        expect(shares.toString()).toBe("30000000000000000");
    });
});
