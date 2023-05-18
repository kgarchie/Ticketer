export async function updateTicketsMetaData(StateValue: any) {
    const res = await $fetch('/api/tickets/query/count')

    if(res && res.statusCode === 200){
        StateValue.pending_count = res.body?.pending_count
        StateValue.resolved_count = res.body?.resolved_count
        StateValue.exceptions_count = res.body?.closed_count
        StateValue.new_count = res.body?.new_count
    }
}


export async function updateNewTickets(State: any){
    const res = await $fetch('/api/tickets/query/new')

    if (res && res.statusCode === 200) {
        State.value = res.body
    }
}

export async function updateNotifications(State: any, user_id: string){
    const res = await $fetch('/api/notifications', {
        method: 'POST',
        body: user_id
    })

    if(res?.statusCode === 200){
        State.value = res.body
    }
}

export async function pollServerStatus(maxRetries = 10, intervalSeconds = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await $fetch('/api/status');
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
        } catch (e) {
            console.log(`Server status check failed, retrying in ${intervalSeconds} seconds`);
            await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
            retries++;
        }
    }
    console.log('Server status check failed after maximum retries');
    return 'offline';
}
