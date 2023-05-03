let socket = null;

function openSocket() {
    socket = new WebSocket(`wss://ticketer.up.railway.app`);

    socket.onmessage = (message) => {
        let { type, body } = JSON.parse(message.data);

        if (type === "MESSAGE") {
            // console.log(body);
            if (Notification.permission === "granted") {
                self.registration
                    .showNotification(body.data.message.from_user_id, {
                        body: body.data.message.message,
                        icon: "/favicon.ico",
                        badge: "/favicon.ico",
                        click_action: "ticketer-production.up.railway.app",
                    })
                    .then((r) => console.log(r));
            }
        } else if (type === "details request") {
            cookieStore.getAll().then((cookies) => {
                let authCookie = cookies.find((cookie) => cookie.name === "auth");
                const decodedString = decodeURIComponent(authCookie.value);
                const user_id = JSON.parse(decodedString).user_id;

                if (user_id) {
                    // send auth cookie to server
                    socket.send(
                        JSON.stringify({
                            statusCode: 200,
                            type: "details response",
                            body: user_id.toString(),
                        })
                    );
                }
            });
        }
    };

    socket.onerror = (error) => {
        console.error(error);

        closeSocket();
    };

    socket.onclose = async (event) => {
        console.log("Socket closed:", event);
        closeSocket();

        socket = null;

        while (await pollServerStatus() === 'offline') {
            console.log('Server is offline, retrying in 3 seconds');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        let max_tries = 10;
        while (socket === null && max_tries > 0) {
            console.log('Socket is null, retrying in 3 seconds');
            await new Promise(resolve => setTimeout(resolve, 3000));
            openSocket();
            max_tries--;
        }

        const serverStatus = await pollServerStatus();

        if (socket === null && serverStatus === 'online') {
            if (Notification.permission === "granted") {
                self.registration.showNotification(body.message.from_user_id, {
                    body: "Socket is offline, but server is online | Please visit the site to reconnect for real time updates",
                    icon: "/favicon.ico",
                    badge: "/favicon.ico",
                    click_action: "ticketer-production.up.railway.app",
                }).then((r) => console.log(r));
            }
        } else if (serverStatus === 'offline') {
            if (Notification.permission === "granted" && navigator.onLine) {
                self.registration.showNotification(body.message.from_user_id, {
                    body: "Can't reach Server | Please visit the site to reconnect for real time updates | Contact support if this issue persists",
                    icon: "/favicon.ico",
                    badge: "/favicon.ico",
                    click_action: "ticketer-production.up.railway.app",
                }).then((r) => console.log(r));
            }
        }
    }
}

function closeSocket() {
    if (socket) {
        socket.close();
        socket = null;
    }
}

async function pollServerStatus(maxRetries = 10, intervalSeconds = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        const res = await fetch('/api/status');
        const response = await res.json();
        if (response) {
            console.log('Server Up | Response Received')
            if (response.statusCode === 200) {
                console.log('Server status okay, server is online');
                return 'online';
            } else {
                console.log(`Server status check failed, retrying in ${intervalSeconds} seconds`);
                await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
                retries++;
            }
        }
    }
    console.log('Server status check failed after maximum retries');
    return 'offline';
}


self.addEventListener("install", (event) => {
    console.log("Service worker installed:", event);
});

self.addEventListener("activate", (event) => {
    console.log("Service worker activated:", event);

    openSocket();
});
