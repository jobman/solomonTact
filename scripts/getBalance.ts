import { toNano } from '@ton/core';
import { SolomonDeal } from '../wrappers/SolomonDeal';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const solomonDeal = provider.open(await SolomonDeal.fromInit());

    let balance = await solomonDeal.getBalance();
    console.log(`Balance: ${Number(balance)/1000000000}`);    

    // run methods on `solomonDeal`
}
