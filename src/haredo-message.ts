import { Message } from 'amqplib';
import { Consumer } from './consumer';
import { MessageAlreadyHandledError, FailedParsingJsonError } from './errors';
import { EventEmitter } from 'events';
import { TypedEventEmitter } from './events';

export interface HaredoMessageEvents {
    handled: void;
}

export class HaredoMessage<T = unknown> {
    public data: T;
    public dataString: string;
    public isHandled = false;
    public isNacked = false;
    public isAcked = false;
    public emitter = new EventEmitter as TypedEventEmitter<HaredoMessageEvents>;
    constructor(public readonly raw: Message, parseJson: boolean, public readonly consumer: Consumer) {
        this.dataString = raw.content.toString();
        if (parseJson) {
            try {
                this.data = JSON.parse(this.dataString);
            } catch (e) {
                throw new FailedParsingJsonError(this.dataString);
            }
        } else {
            this.data = this.dataString as any;
        }
    }
    getHeaders() {
        return this.raw.properties.headers;
    }
    getHeader(header: string) {
        return this.getHeaders()[header];
    }
    ack() {
        if (this.isHandled) {
            throw new MessageAlreadyHandledError('A message can only be acked/nacked once');
        }
        this.consumer.ack(this);
        this.isHandled = true;
        this.isAcked = true;
        this.emitter.emit('handled');
    }
    nack(requeue = true) {
        if (this.isHandled) {
            throw new MessageAlreadyHandledError('A message can only be acked/nacked once');
        }
        this.consumer.nack(this, requeue);
        this.isHandled = true;
        this.isNacked = true;
        this.emitter.emit('handled');
    }
    toString() {
        return `HaredoMessage ${ this.dataString }`;
    }
}
