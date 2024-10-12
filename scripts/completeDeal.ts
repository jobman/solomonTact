import { Address, toNano } from '@ton/core';
import { SolomonDeal } from '../wrappers/SolomonDeal';
import { NetworkProvider } from '@ton/blueprint';
import {v4 as uuidv4} from 'uuid';

function uuidToBigInt(uuid: string): bigint {
    // Remove the hyphens from the UUID and treat it as a hexadecimal number
    return BigInt(`0x${uuid.replace(/-/g, '')}`);
}

export async function run(provider: NetworkProvider) {
    const solomonDeal = provider.open(await SolomonDeal.fromInit());

    let deal_id = BigInt('230313423462225198301034280778135084527')
    console.log(`Deal ID BIG INT: ${deal_id}`);

    await solomonDeal.send(
        provider.sender(),
        {
            value: toNano('1'),
        },
        {
            $$type: 'CompleteTheDeal',
            id: deal_id,
        }
    )  

    // run methods on `solomonDeal`
}