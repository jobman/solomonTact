import { Address, toNano } from '@ton/core';
import { SolomonDeal } from '../wrappers/SolomonDeal';
import { NetworkProvider } from '@ton/blueprint';
import {v4 as uuidv4} from 'uuid';

function uuidToBigInt(uuid: string): bigint {
    // Remove the hyphens from the UUID and treat it as a hexadecimal number
    return BigInt(`0x${uuid.replace(/-/g, '')}`);
}

export async function run(provider: NetworkProvider) {
    let deal_id = BigInt('63678032527049305147114596331079473254')
    console.log(`Deal ID BIG INT: ${deal_id}`);
}