import BN from 'bn.js';
import { SHARE_DENOMINATION } from '../constants';

export function toShares(amount: string) {
    return new BN(amount).mul(SHARE_DENOMINATION);
}
