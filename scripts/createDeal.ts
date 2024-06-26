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

    const uuid = uuidv4();
    let deal_id: bigint;
    console.log(`Deal ID: ${uuid}`);
    deal_id = uuidToBigInt(uuid);
    console.log(`Deal ID BIG INT: ${deal_id}`);

    const days = 1
    const now = new Date();
    now.setDate(now.getDate() + days);
    const future_date = Math.floor(now.getTime() / 1000);

    await solomonDeal.send(
        provider.sender(),
        {
            value: toNano('1'),
        },
        {
            $$type: 'MakeDeal',
            id: deal_id,
            producer: Address.parse('0QAu9_8dAXldyafPdkeFpRu7lxXLzUekp6HTVlap6GCc_4OI'),
            producerResponsibility: toNano('0.2'),
            expirationTime: BigInt(future_date),
            amount: toNano('0.5'),
            fee: toNano('0.01'),
        }
    )  

    // run methods on `solomonDeal`
}