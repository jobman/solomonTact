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
                value: toNano('0.1'),
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
                value: toNano('0.1'),
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

    it('check complex withdraw safe with multiple deals', async () => {
        const dealsCount = 18;
        const dealIds: bigint[] = [];
        const dealAmounts: bigint[] = [
            toNano('10'), toNano('15'), toNano('8'), toNano('16'), toNano('12'),
            toNano('20'), toNano('7'), toNano('18'), toNano('9'), toNano('14'),
            toNano('11'), toNano('17'), toNano('13'), toNano('19'), toNano('6'),
            toNano('22'), toNano('10'), toNano('15')
        ];
        
        const producerResponsibilities: bigint[] = [
            toNano('1'), toNano('0'), toNano('0.5'), toNano('0'), toNano('1.5'),
            toNano('0.8'), toNano('0'), toNano('1.2'), toNano('0.3'), toNano('0'),
            toNano('1.7'), toNano('0.9'), toNano('0'), toNano('1.4'), toNano('0.6'),
            toNano('0'), toNano('1.1'), toNano('0.4')
        ];
        
        const shouldComplete: boolean[] = [
            true, true, false, true, true,
            false, true, true, false, true,
            true, true, false, true, true,
            false, true, true
        ];
    
        // Создаем дату истечения (через 1 день)
        const now = new Date();
        now.setDate(now.getDate() + 1);
        const future_date = Math.floor(now.getTime() / 1000);
    
        // Создание сделок
        for (let i = 0; i < dealsCount; i++) {
            const deal_id = uuidToBigInt(uuidv4());
            dealIds.push(deal_id);
    
            // Рассчитываем fee как 1/50 от amount
            const fee = dealAmounts[i] / 50n;
            const balance_before_create = await solomonDeal.getBalance();
            console.log("Balance before deal id create", i, Number(balance_before_create)/1000000000);
            console.log("dealAmounts[i]", Number(dealAmounts[i])/1000000000);
            console.log("fee", Number(fee)/1000000000);
            // Создаем сделку
            const createDealResult = await solomonDeal.send(
                consumerAccount.getSender(),
                {
                    value: dealAmounts[i] + fee + toNano('0.1'),
                },
                {
                    $$type: 'MakeDeal',
                    id: deal_id,
                    producer: producerAccount.address,
                    producerResponsibility: producerResponsibilities[i],
                    expirationTime: BigInt(future_date),
                    amount: dealAmounts[i],
                    fee: fee,
                }
            );
    
            expect(createDealResult.transactions).toHaveTransaction({
                from: consumerAccount.address,
                to: solomonDeal.address,
                success: true,
            });

            const balance_after_create = await solomonDeal.getBalance();
            console.log("Balance after deal id create", i, Number(balance_after_create)/1000000000);
            const delta_balance_after_create = balance_after_create - balance_before_create;
            console.log("Delta balance after deal id create", i, Number(delta_balance_after_create)/1000000000);
    
            // Если есть producerResponsibility, оплачиваем её
            if (producerResponsibilities[i] > 0n) {
                const balance_before_pay_responsibility = await consumerAccount.getBalance();
                console.log("Balance before pay responsibility", i, Number(balance_before_pay_responsibility)/1000000000);
                console.log("producerResponsibilities[i]", Number(producerResponsibilities[i])/1000000000);
                const payResponsibilityResult = await solomonDeal.send(
                    producerAccount.getSender(),
                    {
                        value: producerResponsibilities[i] + toNano('0.1'),
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

                const balance_after_pay_responsibility = await solomonDeal.getBalance();
                console.log("Balance after pay responsibility", i, Number(balance_after_pay_responsibility)/1000000000);
                const delta_balance_after_pay_responsibility = balance_after_pay_responsibility - balance_before_pay_responsibility;
                console.log("Delta balance after pay responsibility", i, Number(delta_balance_after_pay_responsibility)/1000000000);
            }
    
            // Завершаем сделку, если указано
            if (shouldComplete[i]) {
                const balance_before_complete_deal = await solomonDeal.getBalance();
                console.log("Balance before complete deal", i, Number(balance_before_complete_deal)/1000000000);
                const completeDealResult = await solomonDeal.send(
                    consumerAccount.getSender(),
                    {
                        value: toNano('0.1'),
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

                const balance_after_complete_deal = await solomonDeal.getBalance();
                console.log("Balance after complete deal", i, Number(balance_after_complete_deal)/1000000000);
                const delta_balance_after_complete_deal = balance_after_complete_deal - balance_before_complete_deal;
                console.log("Delta balance after complete deal", i, Number(delta_balance_after_complete_deal)/1000000000);
            }
        }
    
        // Выполняем withdraw safe
        const judgeSystemAccountBalanceBefore = await judgeSystemAccount.getBalance();
        const solomonDealBalanceBefore = await solomonDeal.getBalance();
        console.log("contract_balance_before: ", solomonDealBalanceBefore);


        const withdrawResult = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('1.1'),
            },
            "withdraw safe"
        );
    
        expect(withdrawResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });
    
        // Проверяем балансы после вывода
        const judgeSystemAccountBalanceAfter = await judgeSystemAccount.getBalance();
        const solomonDealBalanceAfter = await solomonDeal.getBalance();
    
        const delta = judgeSystemAccountBalanceAfter - judgeSystemAccountBalanceBefore;
        const delta_contract = solomonDealBalanceAfter - solomonDealBalanceBefore;
    
        console.log("Total deals created: ", dealsCount);
        console.log("Deals completed: ", shouldComplete.filter(x => x).length);
        console.log("Withdraw safe delta_contract: ", Number(delta_contract)/1000000000);
        console.log("Withdraw safe delta: ", Number(delta)/1000000000);
        console.log("Contract balance before: ", Number(solomonDealBalanceBefore)/1000000000);
        console.log("Contract balance after: ", Number(solomonDealBalanceAfter)/1000000000);
    
        // Ожидаем, что выведено более 0.1 TON
        expect(delta).toBeGreaterThan(toNano('1.1'));
    
        // Дополнительная проверка: сумма всех fee должна соответствовать выводу
        const expectedFees = dealAmounts.reduce((sum, amount, i) => {
                return sum + (amount / 50n);
        }, 0n);
    
        console.log("Expected fees collected: ", Number(expectedFees)/1000000000);
        expect(delta).toBeGreaterThanOrEqual(expectedFees - toNano('0.01')); // Учитываем возможные газовые сборы


        /////////////////////////////////////////////////////////////////

        const dealIds2: bigint[] = [];
        const dealAmounts2: bigint[] = [
            toNano('10'), toNano('15'), toNano('8'), toNano('16'), toNano('12'),
            toNano('20'), toNano('7'), toNano('18'), toNano('9'), toNano('14'),
            toNano('11'), toNano('17'), toNano('13'), toNano('19'), toNano('6'),
            toNano('22'), toNano('10'), toNano('15')
        ];
        
        const producerResponsibilities2: bigint[] = [
            toNano('1'), toNano('0'), toNano('0.5'), toNano('0'), toNano('1.5'),
            toNano('0.8'), toNano('0'), toNano('1.2'), toNano('0.3'), toNano('0'),
            toNano('1.7'), toNano('0.9'), toNano('0'), toNano('1.4'), toNano('0.6'),
            toNano('0'), toNano('1.1'), toNano('0.4')
        ];
        
        const shouldComplete2: boolean[] = [
            true, true, false, true, true,
            false, true, true, false, true,
            true, true, false, true, true,
            false, true, true
        ];
    
        // Создаем дату истечения (через 1 день)
        const now2 = new Date();
        now2.setDate(now2.getDate() + 1);
        const future_date2 = Math.floor(now2.getTime() / 1000);
    
        // Создание сделок
        for (let i = 0; i < dealsCount; i++) {
            const deal_id = uuidToBigInt(uuidv4());
            dealIds2.push(deal_id);
    
            // Рассчитываем fee как 1/50 от amount
            const fee = dealAmounts2[i] / 50n;
            const balance_before_create2 = await solomonDeal.getBalance();
            console.log("Balance before deal id create2", i, Number(balance_before_create2)/1000000000);
            console.log("dealAmounts[i]", Number(dealAmounts2[i])/1000000000);
            console.log("fee", Number(fee)/1000000000);
            // Создаем сделку
            const createDealResult = await solomonDeal.send(
                consumerAccount.getSender(),
                {
                    value: dealAmounts2[i] + fee + toNano('0.1'),
                },
                {
                    $$type: 'MakeDeal',
                    id: deal_id,
                    producer: producerAccount.address,
                    producerResponsibility: producerResponsibilities2[i],
                    expirationTime: BigInt(future_date2),
                    amount: dealAmounts2[i],
                    fee: fee,
                }
            );
    
            expect(createDealResult.transactions).toHaveTransaction({
                from: consumerAccount.address,
                to: solomonDeal.address,
                success: true,
            });

            const balance_after_create2 = await solomonDeal.getBalance();
            console.log("Balance after deal id create2", i, Number(balance_after_create2)/1000000000);
            const delta_balance_after_create2 = balance_after_create2 - balance_before_create2;
            console.log("Delta balance after deal id create2", i, Number(delta_balance_after_create2)/1000000000);
    
            // Если есть producerResponsibility, оплачиваем её
            if (producerResponsibilities2[i] > 0n) {
                const balance_before_pay_responsibility2 = await consumerAccount.getBalance();
                console.log("Balance before pay responsibility2", i, Number(balance_before_pay_responsibility2)/1000000000);
                console.log("producerResponsibilities[i]", Number(producerResponsibilities2[i])/1000000000);
                const payResponsibilityResult = await solomonDeal.send(
                    producerAccount.getSender(),
                    {
                        value: producerResponsibilities2[i] + toNano('0.1'),
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

                const balance_after_pay_responsibility2 = await solomonDeal.getBalance();
                console.log("Balance after pay responsibility2", i, Number(balance_after_pay_responsibility2)/1000000000);
                const delta_balance_after_pay_responsibility2 = balance_after_pay_responsibility2 - balance_before_pay_responsibility2;
                console.log("Delta balance after pay responsibility2", i, Number(delta_balance_after_pay_responsibility2)/1000000000);
            }
    
            // Завершаем сделку, если указано
            if (shouldComplete2[i]) {
                const balance_before_complete_deal2 = await solomonDeal.getBalance();
                console.log("Balance before complete deal2", i, Number(balance_before_complete_deal2)/1000000000);
                const completeDealResult = await solomonDeal.send(
                    consumerAccount.getSender(),
                    {
                        value: toNano('0.1'),
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

                const balance_after_complete_deal2 = await solomonDeal.getBalance();
                console.log("Balance after complete deal2", i, Number(balance_after_complete_deal2)/1000000000);
                const delta_balance_after_complete_deal2 = balance_after_complete_deal2 - balance_before_complete_deal2;
                console.log("Delta balance after complete deal2", i, Number(delta_balance_after_complete_deal2)/1000000000);
            }
        }
    
        // Выполняем withdraw safe
        const judgeSystemAccountBalanceBefore2 = await judgeSystemAccount.getBalance();
        const solomonDealBalanceBefore2 = await solomonDeal.getBalance();
        console.log("contract_balance_before2: ", solomonDealBalanceBefore2);


        const withdrawResult2 = await solomonDeal.send(
            judgeSystemAccount.getSender(),
            {
                value: toNano('1.1'),
            },
            "withdraw safe"
        );
    
        expect(withdrawResult.transactions).toHaveTransaction({
            from: judgeSystemAccount.address,
            to: solomonDeal.address,
            success: true,
        });
    
        // Проверяем балансы после вывода
        const judgeSystemAccountBalanceAfter2 = await judgeSystemAccount.getBalance();
        const solomonDealBalanceAfter2 = await solomonDeal.getBalance();
    
        const delta2 = judgeSystemAccountBalanceAfter2 - judgeSystemAccountBalanceBefore2;
        const delta_contract2 = solomonDealBalanceAfter2 - solomonDealBalanceBefore2;
    
        console.log("Total deals created2: ", dealsCount);
        console.log("Deals completed2: ", shouldComplete.filter(x => x).length);
        console.log("Withdraw safe delta_contract2: ", Number(delta_contract2)/1000000000);
        console.log("Withdraw safe delta2: ", Number(delta2)/1000000000);
        console.log("Contract balance before2: ", Number(solomonDealBalanceBefore2)/1000000000);
        console.log("Contract balance after2: ", Number(solomonDealBalanceAfter2)/1000000000);
    
        // Дополнительная проверка: сумма всех fee должна соответствовать выводу
        const expectedFees2 = dealAmounts.reduce((sum, amount, i) => {
                return sum + (amount / 50n);
        }, 0n);
    
        console.log("Expected fees collected2: ", Number(expectedFees2)/1000000000);
        expect(delta2).toBeGreaterThanOrEqual(expectedFees2 - toNano('0.1')); // Учитываем возможные газовые сборы
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
