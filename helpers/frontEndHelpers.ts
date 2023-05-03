export async function updateTicketsMetaData(StateValue: any) {
    const res = await $fetch('/api/tickets/query/meta/count')

    if(res && res.statusCode === 200){
        // @ts-ignore
        StateValue.pending_count = res.body?.data.pending_tickets_count
        // @ts-ignore
        StateValue.resolved_count = res.body?.data.resolved_tickets_count
        // @ts-ignore
        StateValue.exceptions_count = res.body?.data.closed_tickets_count
        // @ts-ignore
        StateValue.new_count = res.body?.data.new_tickets_count
    }
}


export async function updateNewTickets(State: any){
    const res = await $fetch('/api/tickets/query/meta/new')

    if (res && res.statusCode === 200) {
        // @ts-ignore
        State.value = res.body?.data
    }
}

export async function updateNotifications(State: any, user_id: string){
    const res = await $fetch('/api/notifications', {
        method: 'POST',
        body: user_id
    })

    if(res?.statusCode === 200){
        // @ts-ignore
        State.value = res.body?.data
    }
}