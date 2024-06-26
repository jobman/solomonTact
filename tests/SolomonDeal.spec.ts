import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { SolomonDeal } from '../wrappers/SolomonDeal';
import {v4 as uuidv4} from 'uuid';
import '@ton/test-utils';
import exp from 'constants';

function uuidToBigInt(uuid: string): bigint {
    // Remove the hyphens from the UUID and treat it as a hexadecimal number
    return BigInt(`0x${uuid.replace(/-/g, '')}`);
}


describe('SolomonDeal', () => {
    let blockchain: Blockchain;
    let judgeSystemAccount: SandboxContract<TreasuryContract>;
    let solomonDeal: SandboxContract<SolomonDeal>;
    let consumerAccount: SandboxContract<TreasuryContract>;
    let producerAccount: SandboxContract<TreasuryContract>;
    let contract_operating_balance: bigint;
    let deal_id: bigint;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        judgeSystemAccount = await blockchain.treasury('deployer');
        consumerAccount = await blockchain.treasury('consumer');
        producerAccount = await blockchain.treasury('producer');
        contract_operating_balance = toNano('0.1');
        

        solomonDeal = blockchain.openContract(await SolomonDeal.fromInit());

        

        const deployResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('0.15'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and solomonDeal are ready to use
    });

    it('should create deal', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();

        const uuid = uuidv4();
        deal_id = uuidToBigInt(uuid);

        const days = 1
        const now = new Date();
        now.setDate(now.getDate() + days);
        const future_date = Math.floor(now.getTime() / 1000);

        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        expect(createDealResult.transactions).toHaveTransaction({
            from: consumerAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let contract_balance = await solomonDeal.getBalance();
        expect(contract_balance).toBeLessThanOrEqual(toNano('0.1')+toNano('5')+contract_operating_balance);

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("create deal delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("create deal delta_producer: ", Number(delta_producer)/1000000000);
        console.log("create deal delta_judge: ", Number(delta_judge)/1000000000);
        console.log("create deal delta_contract: ", Number(delta_contract)/1000000000);

    });

    it('producer should pay responsibility', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();


        const days = 1
        const now = new Date();
        now.setDate(now.getDate() + days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const payResponsibilityResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'PayResponsibility',
                id: deal_id,
            }
        );

        expect(payResponsibilityResult.transactions).toHaveTransaction({
            from: producerAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let contract_balance = await solomonDeal.getBalance();
        expect(contract_balance).toBeLessThanOrEqual(toNano('0.1')+toNano('1')+toNano('5')+contract_operating_balance);

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("producer should pay responsibility delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("producer should pay responsibility delta_producer: ", Number(delta_producer)/1000000000);
        console.log("producer should pay responsibility delta_judge: ", Number(delta_judge)/1000000000);
        console.log("producer should pay responsibility delta_contract: ", Number(delta_contract)/1000000000);

    });

    it('complete the deal by customer', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();

        const days = 1
        const now = new Date();
        now.setDate(now.getDate() + days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const payResponsibilityResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'PayResponsibility',
                id: deal_id,
            }
        );

        let producer_account_balance_before_test = await producerAccount.getBalance();

        const completeDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('5') + toNano('0.1'),
            },
            {
                $$type: 'CompleteTheDeal',
                id: deal_id,
            }
        );

        expect(completeDealResult.transactions).toHaveTransaction({
            from: consumerAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let producer_account_balance_after_test = await producerAccount.getBalance();
        expect(producer_account_balance_after_test - producer_account_balance_before_test).toBeGreaterThanOrEqual(toNano('6')-toNano('0.1'));

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("complete the deal by customer delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("complete the deal by customer delta_producer: ", Number(delta_producer)/1000000000);
        console.log("complete the deal by customer delta_judge: ", Number(delta_judge)/1000000000);
        console.log("complete the deal by customer delta_contract: ", Number(delta_contract)/1000000000);

    });

    it('complete the deal by judge system', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();
        
        const days = 1
        const now = new Date();
        now.setDate(now.getDate() + days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const payResponsibilityResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'PayResponsibility',
                id: deal_id,
            }
        );

        let producer_account_balance_before_test = await producerAccount.getBalance();

        const completeDealResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('5') + toNano('0.1'),
            },
            {
                $$type: 'CompleteTheDeal',
                id: deal_id,
            }
        );

        expect(completeDealResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let producer_account_balance_after_test = await producerAccount.getBalance();
        expect(producer_account_balance_after_test - producer_account_balance_before_test).toBeGreaterThanOrEqual(toNano('6')-toNano('0.1'));

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("complete the deal by judge system delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("complete the deal by judge system delta_producer: ", Number(delta_producer)/1000000000);
        console.log("complete the deal by judge system delta_judge: ", Number(delta_judge)/1000000000);
        console.log("complete the deal by judge system delta_contract: ", Number(delta_contract)/1000000000);

    });
        
    it('giveup contract by producer payed responsibility', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();

        const days = 1
        const now = new Date();
        now.setDate(now.getDate() + days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const payResponsibilityResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'PayResponsibility',
                id: deal_id,
            }
        );

        const giveupContractResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'ProducerGiveUpDeal',
                id: deal_id,
            }
        );

        expect(giveupContractResult.transactions).toHaveTransaction({
            from: producerAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("giveup contract by producer payed responsibility delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("giveup contract by producer payed responsibility delta_producer: ", Number(delta_producer)/1000000000);
        console.log("giveup contract by producer payed responsibility delta_judge: ", Number(delta_judge)/1000000000);
        console.log("giveup contract by producer payed responsibility delta_contract: ", Number(delta_contract)/1000000000);

    });

    it('giveup contract by producer without payed responsibility', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();

        const days = 1
        const now = new Date();
        now.setDate(now.getDate() + days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const giveupContractResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'ProducerGiveUpDeal',
                id: deal_id,
            }
        );

        expect(giveupContractResult.transactions).toHaveTransaction({
            from: producerAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("giveup contract by producer without payed responsibility delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("giveup contract by producer without payed responsibility delta_producer: ", Number(delta_producer)/1000000000);
        console.log("giveup contract by producer without payed responsibility delta_judge: ", Number(delta_judge)/1000000000);
        console.log("giveup contract by producer without payed responsibility delta_contract: ", Number(delta_contract)/1000000000);
    });

    it('judge deal producer fault responsibility not payed', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();

        const days = 1
        const now = new Date();
        now.setDate(now.getDate() - days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const judgeDealResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('5') + toNano('0.1'),
            },
            {
                $$type: 'JudgeDeal',
                id: deal_id,
                isProducerFault: true,
            }
        );

        expect(judgeDealResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("judge deal producer fault responsibility not payed delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("judge deal producer fault responsibility not payed delta_producer: ", Number(delta_producer)/1000000000);
        console.log("judge deal producer fault responsibility not payed delta_judge: ", Number(delta_judge)/1000000000);
        console.log("judge deal producer fault responsibility not payed delta_contract: ", Number(delta_contract)/1000000000);
    });

    it('judge deal producer fault responsibility payed', async () => {

        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();

        const days = 1
        const now = new Date();
        now.setDate(now.getDate() - days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const payResponsibilityResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'PayResponsibility',
                id: deal_id,
            }
        );

        const judgeDealResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('5') + toNano('0.1'),
            },
            {
                $$type: 'JudgeDeal',
                id: deal_id,
                isProducerFault: true,
            }
        );

        expect(judgeDealResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("judge deal producer fault responsibility payed delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("judge deal producer fault responsibility payed delta_producer: ", Number(delta_producer)/1000000000);
        console.log("judge deal producer fault responsibility payed delta_judge: ", Number(delta_judge)/1000000000);
        console.log("judge deal producer fault responsibility payed delta_contract: ", Number(delta_contract)/1000000000);
    });

    it('judge deal producer not fault responsibility not payed', async () => {
        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();

        const days = 1
        const now = new Date();
        now.setDate(now.getDate() - days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('5'),
                fee: toNano('0.1'),
            }

        );

        const judgeDealResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('5') + toNano('0.1'),
            },
            {
                $$type: 'JudgeDeal',
                id: deal_id,
                isProducerFault: false,
            }
        );

        expect(judgeDealResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("judge deal producer not fault responsibility not payed delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("judge deal producer not fault responsibility not payed delta_producer: ", Number(delta_producer)/1000000000);
        console.log("judge deal producer not fault responsibility not payed delta_judge: ", Number(delta_judge)/1000000000);
        console.log("judge deal producer not fault responsibility not payed delta_contract: ", Number(delta_contract)/1000000000);
    });

    it('judge deal producer not fault responsibility payed', async () => {
        const consumer_account_balance_before = await consumerAccount.getBalance();
        const producer_account_balance_before = await producerAccount.getBalance();
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const contract_balance_before = await solomonDeal.getBalance();


        const days = 1
        const now = new Date();
        now.setDate(now.getDate() - days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('55'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('50'),
                fee: toNano('1'),
            }

        );

        const payResponsibilityResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'PayResponsibility',
                id: deal_id,
            }
        );

        const judgeDealResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('5') + toNano('0.1'),
            },
            {
                $$type: 'JudgeDeal',
                id: deal_id,
                isProducerFault: false,
            }
        );

        expect(judgeDealResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let consumer_account_balance_after = await consumerAccount.getBalance();
        let producer_account_balance_after = await producerAccount.getBalance();
        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let contract_balance_after = await solomonDeal.getBalance();

        let delta_consumer = consumer_account_balance_after - consumer_account_balance_before;
        let delta_producer = producer_account_balance_after - producer_account_balance_before;
        let delta_judge = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = contract_balance_after - contract_balance_before;

        console.log("judge deal producer not fault responsibility payed delta_consumer: ", Number(delta_consumer)/1000000000);
        console.log("judge deal producer not fault responsibility payed delta_producer: ", Number(delta_producer)/1000000000);
        console.log("judge deal producer not fault responsibility payed delta_judge: ", Number(delta_judge)/1000000000);
        console.log("judge deal producer not fault responsibility payed delta_contract: ", Number(delta_contract)/1000000000);
    });


    it('check withdraw safe', async () => {
        const contract_balance_before = await solomonDeal.getBalance();
        console.log("contract_balance_before: ", contract_balance_before);
        const days = 1

        const now = new Date();
        now.setDate(now.getDate() + days);
        const future_date = Math.floor(now.getTime() / 1000);
        const createDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('20'),
            },
            {
                $$type: 'MakeDeal',
                id: deal_id,
                producer: producerAccount.address,
                producerResponsibility: toNano('1'),
                expirationTime: BigInt(future_date),
                amount: toNano('10'),
                fee: toNano('0.2'),
            }

        );

        const payResponsibilityResult = await solomonDeal.send(
            producerAccount.getSender(),
            {
                value: toNano('1') + toNano('0.1'),
            },
            {
                $$type: 'PayResponsibility',
                id: deal_id,
            }
        );

        let producer_account_balance_before = await producerAccount.getBalance();

        const completeDealResult = await solomonDeal.send(
            consumerAccount.getSender(),
            {
                value: toNano('5') + toNano('0.1'),
            },
            {
                $$type: 'CompleteTheDeal',
                id: deal_id,
            }
        );

        expect(completeDealResult.transactions).toHaveTransaction({
            from: consumerAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const solomonDealBalanceBefore = await solomonDeal.getBalance();
        const withdrawResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('10'),
            },
            "withdraw safe",
        );

        expect(withdrawResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        let solomonDealBalanceAfter = await solomonDeal.getBalance();

        let delta = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        let delta_contract = solomonDealBalanceAfter - solomonDealBalanceBefore;

        console.log("check withdraw safe delta_contract: ", delta_contract);
        console.log("check withdraw safe delta: ", delta);

        expect(delta).toBeGreaterThanOrEqual(toNano('0.2')-toNano('0.01'));

    });

    it('ChangeMinimalDealAmount', async () => {
        const judgeSystemBalanceBefore = await judgeSystemAccount.getBalance();
        const changeMinimalDealAmountResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'ChangeMinimalDealAmount',
                minimalDealAmount: toNano('100'),
            }
        );

        expect(changeMinimalDealAmountResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let judgeSystemBalanceAfter = await judgeSystemAccount.getBalance();
        let delta = judgeSystemBalanceAfter - judgeSystemBalanceBefore;
        console.log("ChangeMinimalDealAmount delta: ", delta);

    });

    it('ChangeFeePart', async () => {
        const judgeSystemBalanceBefore = await judgeSystemAccount.getBalance();
        const changeFeeResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'ChangeFeePart',
                feePart: 100n,
            }
        );

        expect(changeFeeResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });
        let judgeSystemBalanceAfter = await judgeSystemAccount.getBalance();
        let delta = judgeSystemBalanceAfter - judgeSystemBalanceBefore;
        console.log("ChangeFeePart delta: ", delta);

    });

    it('ChangeSystemFailureFreezeTime', async () => {
        const judgeSystemBalanceBefore = await judgeSystemAccount.getBalance();
        const changeSystemFailureFreezeTimeResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'ChangeSystemFailureFreezeTime',
                systemFailureFreezeTime: 100n,
            }
        );

        expect(changeSystemFailureFreezeTimeResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });
        let judgeSystemBalanceAfter = await judgeSystemAccount.getBalance();
        let delta = judgeSystemBalanceAfter - judgeSystemBalanceBefore;
        console.log("ChangeSystemFailureFreezeTime delta: ", delta);

    });

    it('ChangeMinimalContractBalance', async () => {

        const judgeSystemBalanceBefore = await judgeSystemAccount.getBalance();

        const changeMinimalFoundBalanceResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'ChangeMinimalContractBalance',
                minimalContractBalance: toNano('100'),
            }
        );

        expect(changeMinimalFoundBalanceResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });

        let judgeSystemBalanceAfter = await judgeSystemAccount.getBalance();
        let delta = judgeSystemBalanceAfter - judgeSystemBalanceBefore;
        console.log("ChangeMinimalContractBalance delta: ", delta);
    });
});
