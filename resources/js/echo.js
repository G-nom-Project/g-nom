import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echo = null;

export function initEcho({ key, host, port, scheme }) {
    if (echo) return echo;
    console.log("Initializing echo");

    echo = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: Number(port ?? 80),
        wssPort: Number(port ?? 443),
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
    });
    console.log(echo)

    window.echo = echo;
    return echo;
}

export function getEcho() {
    if (!echo) throw new Error('Echo not initialised yet');
    return echo;
}
