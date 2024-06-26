import { toNano } from '@ton/core';
import { SolomonDeal } from '../wrappers/SolomonDeal';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const solomonDeal = provider.open(await SolomonDeal.fromInit());

    await solomonDeal.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(solomonDeal.address);

    // run methods on `solomonDeal`
}
