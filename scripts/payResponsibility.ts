import { Address, toNano } from '@ton/core';
import { SolomonDeal } from '../wrappers/SolomonDeal';
import { NetworkProvider } from '@ton/blueprint';
import {v4 as uuidv4} from 'uuid';

function uuidToBigInt(uuid: string): bigint {
    return BigInt(`0x${uuid.replace(/-/g, '')}`);
}

export async function run(provider: NetworkProvider) {
    const solomonDeal = provider.open(await SolomonDeal.fromInit());

    let deal_id = BigInt('63678032527049305147114596331079473254')
    console.log(`Deal ID BIG INT: ${deal_id}`);

    await solomonDeal.send(
        provider.sender(),
        {
            value: toNano('1'),
        },
        {
            $$type: 'PayResponsibility',
            id: deal_id,
        }
    )  

}