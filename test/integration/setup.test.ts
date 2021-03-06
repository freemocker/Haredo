import { Haredo, haredo } from '../../src/haredo';
import { setup, teardown, checkQueue, checkExchange } from './helpers/amqp';
import { makeExchangeConfig } from '../../src/exchange';

describe('integration/setup', () => {
    let rabbit: Haredo;
    beforeEach(async () => {
        await setup();
        rabbit = haredo({
            connection: 'amqp://guest:guest@localhost:5672/test'
        });
        await rabbit.connect();
    });
    afterEach(async () => {
        rabbit.close();
        await teardown();
    });
    it('should set up a queue', async () => {
        await rabbit.queue('test').setup();
        await checkQueue('test');
    });
    it('should set up an exchange', async () => {
        await rabbit.exchange('test', 'direct').setup();
        await checkExchange('test', 'direct')
    });
    it('should skipSetup if it is called', async () => {
        const exchange = makeExchangeConfig('test', 'direct');
        await rabbit.exchange(exchange).skipSetup().setup();
        await rabbit.exchange(exchange.fanout()).setup();
    });
});
