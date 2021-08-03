class MiniTimer {
    private callbackStartTime: number;
    private remaining = 0;
    public paused = false;
    public timerId: NodeJS.Timer = null;
    private readonly _callback;
    private readonly _delay;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(callback: () => any, delay: number) {
        this._callback = callback;
        this._delay = delay;
    }

    pause() {
        if (!this.paused) {
            this.clear();
            this.remaining = Date.now() - this.callbackStartTime;
            this.paused = true;
        }
    }

    resume() {
        if (this.paused) {
            if (this.remaining) {
                setTimeout(() => {
                    this.run();
                    this.paused = false;
                    this.start();
                }, this.remaining).unref();
            } else {
                this.paused = false;
                this.start();
            }
        }
    }

    clear() {
        clearInterval(this.timerId);
    }

    start() {
        this.clear();
        this.timerId = setInterval(() => {
            this.run();
        }, this._delay).unref();
    }

    private run() {
        this.callbackStartTime = Date.now();
        this._callback();
    }
}

export default MiniTimer;
